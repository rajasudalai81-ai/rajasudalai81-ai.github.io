"use strict";
const puppeteer = require("/workspace/tools/pupt/node_modules/puppeteer-core");
const http = require("http");
const fs = require("fs");
const path = require("path");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function fill(page, id, text) {
  await page.focus("#" + id);
  await page.evaluate((id, text) => {
    const el = document.getElementById(id);
    el.value = text;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, id, text);
}

// Usage: node tests/ui-smoke.js [liveUrl] [--shots]
const LIVE_URL = process.argv.slice(2).find((a) => /^https?:/.test(a)) || "";
const SHOTS = process.argv.includes("--shots") || !LIVE_URL;

async function quick(page, text) {
  await page.evaluate(() => {
    document.getElementById("toastMsg").innerHTML = "";
    document.getElementById("toast").classList.remove("show");
  });
  await fill(page, "quickEntry", text);
  await page.evaluate(() => document.getElementById("quickBtn").click());
  await page.waitForFunction(() => document.getElementById("toast").classList.contains("show") && document.getElementById("toastMsg").textContent.trim() !== "");
  return page.$eval("#toastMsg", (el) => el.textContent);
}

async function pickFirstLang(page, lang) {
  await page.waitForSelector("#langFirst:not([hidden])");
  await page.evaluate((l) => document.querySelector('[data-firstlang="' + l + '"]').click(), lang);
  await page.waitForFunction(() => document.getElementById("langFirst").hidden);
}

const root = path.join(__dirname, "..");
const bump = { id: null }; // v10: serve a different build id to test the "update available" banner
const server = http.createServer((req, res) => {
  const reqPath = req.url.split("?")[0];
  const file = reqPath === "/" ? "/index.html" : reqPath;
  const p = path.join(root, path.normalize(file).replace(/^\/+/, ""));
  if (!p.startsWith(root)) { res.writeHead(403); res.end(); return; }
  fs.readFile(p, (err, data) => {
    if (err) { res.writeHead(404); res.end("no"); return; }
    const ext = path.extname(p);
    const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".webmanifest": "application/manifest+json", ".png": "image/png", ".json": "application/json" };
    let body = data;
    if (bump.id && (file === "/index.html" || file === "/sw.js")) {
      const real = /KADAI_BUILD = "([0-9a-f]{8})"/.exec(fs.readFileSync(path.join(root, "index.html"), "utf8"));
      body = Buffer.from(data.toString("utf8").split(real[1]).join(bump.id));
    }
    res.writeHead(200, { "content-type": types[ext] || "text/plain", "cache-control": "no-cache" });
    res.end(body);
  });
});

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  const url = LIVE_URL || "http://127.0.0.1:" + port + "/index.html";
  console.log("Testing", url);
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]
  });
  const page = await browser.newPage();
  global.__page = page;
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  page.setDefaultTimeout(8000);
  page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
  await page.goto(url, { waitUntil: "networkidle0" });
  await page.evaluate(() => localStorage.clear());
  await page.goto(url, { waitUntil: "networkidle0" });

  // v7: first-run language picker, choose Tamil
  await pickFirstLang(page, "ta");
  const savedLang = await page.evaluate(() => JSON.parse(localStorage.getItem("kadai-tracker-settings-v3")).lang);
  assert(savedLang === "ta", "language persisted: " + savedLang);
  await page.reload({ waitUntil: "networkidle0" });
  assert(await page.$eval("#langFirst", (el) => el.hidden), "picker not shown again after choosing");

  const money = async (sel) => page.$eval(sel, (el) => el.textContent.trim());

  // Bilingual labels on main totals
  const incomeLabel = await page.$eval(".tot.income", (el) => el.textContent);
  assert(incomeLabel.includes("வரவு") && incomeLabel.includes("Income"), "bilingual income label: " + incomeLabel);
  const expLabel = await page.$eval(".tot.expense", (el) => el.textContent);
  assert(expLabel.includes("செலவு") && expLabel.includes("Expense"), "bilingual expense label");
  const profitLabel = await page.$eval(".tot.profit", (el) => el.textContent);
  assert(profitLabel.includes("லாபம்") && profitLabel.includes("Profit"), "bilingual profit label");
  const addIncome = await page.$eval("#btnIncome", (el) => el.textContent);
  assert(addIncome.includes("வரவு") && /Sale|Income/i.test(addIncome), "bilingual add income: " + addIncome);

  assert((await money("#totIncome")) === "₹0", "start income 0");
  assert((await money("#totExpense")) === "₹0", "start expense 0");
  assert((await money("#totProfit")) === "₹0", "start profit 0");

  // v7: typed line saves directly — no confirm card — with Undo + Edit on the toast
  let t = await quick(page, "tea 20 glass 10 rupees");
  assert(await page.$eval("#confirmCard", (el) => el.hidden), "no confirm card for a clear sentence");
  assert(/சேமிக்கப்பட்டது/.test(t) && /Saved/.test(t), "bilingual saved toast: " + t);
  assert(t.includes("200"), "toast shows ₹200: " + t);
  assert(await page.$eval("#toastUndo", (el) => !el.hidden), "Undo on toast");
  assert(await page.$eval("#toastEdit", (el) => !el.hidden), "Edit on toast");
  assert((await money("#totIncome")) === "₹200", "income after tea 20×10");
  assert((await money("#totProfit")) === "₹200", "profit after tea");

  // Undo removes it, then save again
  await page.evaluate(() => document.getElementById("toastUndo").click());
  await page.waitForFunction(() => document.querySelector("#totIncome").textContent.trim() === "₹0");
  t = await quick(page, "tea 20 glass 10 rupees");
  assert((await money("#totIncome")) === "₹200", "re-saved tea 200");

  // Edit opens the form on the saved entry
  await page.evaluate(() => document.getElementById("toastEdit").click());
  await page.waitForSelector("#sheet:not([hidden])");
  assert((await page.$eval("#fldAmount", (el) => el.value)) === "200", "edit form shows 200");
  await page.evaluate(() => document.getElementById("closeForm").click());
  await page.waitForSelector("#sheet[hidden]");

  t = await quick(page, "தக்காளி 3 கிலோ 90 ரூபாய்");
  assert(t.includes("90") && !t.includes("270"), "tomato total 90 not 270: " + t);
  assert((await money("#totExpense")) === "₹90", "expense 90");
  assert((await money("#totProfit")) === "₹110", "profit 200-90");

  t = await quick(page, "selavu diesel 500 vandi TN 01 AB 1234");
  assert((await money("#totExpense")) === "₹590", "expense 90+500");
  const vrow = await page.$eval("#entryList", (el) => el.textContent);
  assert(vrow.includes("TN01AB1234"), "vehicle saved: " + vrow);

  t = await quick(page, "gas cylinder 1100");
  assert((await money("#totExpense")) === "₹1,690", "expense +1100");

  t = await quick(page, "minus 50 discount");
  assert((await money("#totIncome")) === "₹150", "income 200-50");
  assert((await money("#totProfit")) === "-₹1,540", "profit after minus: " + (await money("#totProfit")));

  // v7: "20000 போடு" adds, "500 கழி" subtracts
  t = await quick(page, "20000 போடு");
  assert((await money("#totIncome")) === "₹20,150", "20000 podu adds income: " + (await money("#totIncome")));
  t = await quick(page, "500 கழி");
  assert((await money("#totExpense")) === "₹2,190", "500 kazhi adds expense: " + (await money("#totExpense")));
  // undo both back to known totals
  await page.evaluate(() => document.getElementById("toastUndo").click());
  await page.waitForFunction(() => document.querySelector("#totExpense").textContent.trim() === "₹1,690");
  t = await quick(page, "20000 கழி");
  await page.evaluate(() => document.getElementById("toastUndo").click());
  await page.waitForFunction(() => document.querySelector("#totExpense").textContent.trim() === "₹1,690");
  // remove the 20000 income via its row delete
  await page.evaluate(() => {
    const row = [...document.querySelectorAll("#entryList .row")].find((r) => /20,000/.test(r.textContent));
    row.querySelector('[data-act="delete"]').click();
  });
  await page.waitForSelector("#modal:not([hidden])");
  await page.evaluate(() => document.getElementById("confirmDelete").click());
  await page.waitForSelector("#modal[hidden]");
  assert((await money("#totIncome")) === "₹150", "back to 150 after deleting 20000");

  // Manual form path still works (Tamil numbers + bulk + vehicle + delete)
  // Reset by going through add income
  await page.evaluate(() => document.getElementById("btnIncome").click());
  await page.waitForSelector("#sheet:not([hidden])");
  const formTitle = await page.$eval("#formTitle", (el) => el.textContent);
  assert(/வரவு/.test(formTitle) && /Income/i.test(formTitle), "bilingual form title: " + formTitle);
  await page.click('.chip[data-chip="இட்லி"]');
  await fill(page, "fldQty", "பத்து");
  await fill(page, "fldUnitPrice", "ஐம்பது");
  await page.waitForFunction(() => document.querySelector("#fldAmount").value === "500");
  await page.click("#saveBtn");
  await page.waitForSelector("#sheet[hidden]");
  assert((await money("#totIncome")) === "₹650", "manual Tamil 10×50 added: " + (await money("#totIncome")));

  // Negative without note still blocked
  await page.evaluate(() => document.getElementById("btnExpense").click());
  await page.waitForSelector("#sheet:not([hidden])");
  await page.click('.chip[data-chip="சரிகட்டு"]');
  await fill(page, "fldAmount", "-20");
  await page.click("#saveBtn");
  const err = await page.$eval("#formError", (e) => e.textContent);
  assert(/குறிப்பு|note/i.test(err), "note required error: " + err);
  await fill(page, "fldNote", "அளவு தவறு");
  await page.click("#saveBtn");
  await page.waitForSelector("#sheet[hidden]");

  // Tamil delete confirm still present
  await page.evaluate(() => {
    const rows = [...document.querySelectorAll(".row")];
    const idli = rows.find((r) => r.querySelector(".item")?.textContent.includes("இட்லி"));
    idli.querySelector('[data-act="delete"]').click();
  });
  await page.waitForSelector("#modal:not([hidden])");
  const q = await page.$eval(".modal-q", (e) => e.textContent);
  assert(q.includes("நீக்க") && /Delete/i.test(q), "bilingual delete confirm: " + q);
  await page.click("#confirmDelete");
  await page.waitForSelector("#modal[hidden]");
  assert((await money("#totIncome")) === "₹150", "income back to 150 after deleting 500 idli");

  // Menu one-tap
  const beforeMenu = await money("#totIncome");
  await page.evaluate(() => {
    const btn = document.querySelector('[data-menu="idli"]');
    btn.scrollIntoView({ block: "center" });
    btn.click();
  });
  await page.waitForFunction((prev) => document.querySelector("#totIncome").textContent.trim() !== prev, {}, beforeMenu);
  // default idli 10, income was 150 → 160
  assert((await money("#totIncome")) === "₹160", "menu tap added idli 10: " + (await money("#totIncome")));
  await page.evaluate(() => document.querySelector('[data-menu="idli"]').click());
  assert((await money("#totIncome")) === "₹170", "second tap increments qty");

  // Kadan book
  t = await quick(page, "kadan ramesh dosa 2 40");
  assert((await money("#totIncome")) === "₹250", "credit dosa 80 included in income");
  await page.evaluate(() => document.getElementById("navKadan").click());
  await page.waitForSelector("#panelKadan:not([hidden])");
  const kadan = await page.$eval("#kadanList", (el) => el.textContent);
  assert(/ramesh/i.test(kadan) && (kadan.includes("80") || kadan.includes("₹80")), "kadan book shows ramesh 80: " + kadan);
  assert(kadan.includes("செலுத்தினார்") && /paid/i.test(kadan), "bilingual mark paid");
  await page.click("[data-paid]");
  await page.waitForSelector("#modal:not([hidden])");
  await page.click("#confirmDelete");
  await page.waitForSelector("#modal[hidden]");
  const kadan2 = await page.$eval("#kadanList", (el) => el.textContent);
  assert(/நிலுவைக் கடன் இல்லை|No outstanding/i.test(kadan2), "kadan cleared: " + kadan2);
  await page.evaluate(() => document.getElementById("navToday").click());
  assert((await money("#totIncome")) === "₹250", "marking paid does not change income");

  // Summary tab bilingual + weekly card
  await page.evaluate(() => document.getElementById("navSummary").click());
  await page.waitForSelector("#panelSummary:not([hidden])");
  const eod = await page.$eval("#eodCard", (el) => el.textContent);
  assert(/சுருக்கம்/.test(eod) && /summary/i.test(eod), "eod bilingual");
  const week = await page.$eval("#weekCard", (el) => el.textContent);
  assert(/வாரம்/.test(week) && /week/i.test(week), "week bilingual");


  // Phase 2: stock, margins, wages (fresh store so totals are known)
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle0" });
  await pickFirstLang(page, "ta");
  assert((await money("#totIncome")) === "₹0", "phase2 start income 0");
  assert((await money("#totExpense")) === "₹0", "phase2 start expense 0");
  await page.evaluate(() => document.getElementById("navShop").click());
  await page.waitForSelector("#panelShop:not([hidden])");
  const stockText = await page.$eval("#stockList", (el) => el.textContent);
  assert(/மாவு/.test(stockText) && /பால்/.test(stockText) && /வாயு/.test(stockText), "default stock items: " + stockText);
  assert(/சக்கரை/.test(stockText) && /டீ தூள்/.test(stockText) && /எண்ணெய்/.test(stockText), "sugar/tea/oil present");
  assert(await page.$eval("#stockAlert", (el) => el.hidden), "no main-screen alert on a fresh shop");

  await page.click("#btnStockIn");
  await page.waitForSelector("#stockMoveForm:not([hidden])");
  await page.select("#stockItemSel", "maavu");
  await fill(page, "stockQty", "10");
  await fill(page, "stockAmount", "200");
  await page.evaluate(() => { document.getElementById("stockLogExpense").checked = true; });
  await page.evaluate(() => {
    const btn = document.getElementById("stockMoveSave");
    btn.scrollIntoView({ block: "center" });
    btn.click();
  });
  await page.waitForFunction(() => document.getElementById("totExpense").textContent.replace(/\s/g, "") === "₹200");
  assert((await money("#totExpense")) === "₹200", "stock purchase logged as expense");
  assert((await money("#totIncome")) === "₹0", "stock purchase does not change income");
  assert((await money("#totProfit")) === "-₹200", "profit after stock expense");
  const stockAfter = await page.$eval("#stockList", (el) => el.textContent);
  assert(/10/.test(stockAfter) && /மாவு/.test(stockAfter), "maavu qty 10 shown: " + stockAfter);

  await page.click("#btnStockOut");
  await page.waitForSelector("#stockMoveForm:not([hidden])");
  await page.select("#stockItemSel", "maavu");
  await fill(page, "stockQty", "3");
  await page.evaluate(() => {
    const btn = document.getElementById("stockMoveSave");
    btn.scrollIntoView({ block: "center" });
    btn.click();
  });
  await page.waitForFunction(() => /7/.test(document.getElementById("stockList").textContent));
  const stockUsed = await page.$eval("#stockList", (el) => el.textContent);
  assert(/7/.test(stockUsed), "maavu qty 7 after use: " + stockUsed);
  assert(await page.$eval("#stockAlert", (el) => !el.hidden), "low-stock banner on main screen");
  const alertTxt = await page.$eval("#stockAlert", (el) => el.textContent);
  assert(/மாவு/.test(alertTxt) && /சரிபாருங்கள்|Low stock|Please check/i.test(alertTxt), "alert names maavu: " + alertTxt);
  assert((await money("#totExpense")) === "₹200", "using stock does not add an expense");

  await page.click('#shopSub [data-shop="margins"]');
  await page.waitForSelector("#shopMargins:not([hidden])");
  const marginText = await page.$eval("#marginList", (el) => el.textContent);
  const idliCost = await page.$eval('#marginList [data-cost="idli"]', (el) => el.value);
  assert(/இட்லி/.test(marginText), "idli on margins tab: " + marginText);
  assert(idliCost === "3.5", "idli cost input 3.5, got " + idliCost);
  assert(/6\.5|₹6\.50|₹6.5/.test(marginText), "idli unit profit 6.50: " + marginText);

  await page.evaluate(() => document.getElementById("navToday").click());
  await page.waitForSelector("#panelToday:not([hidden])");
  await page.evaluate(() => {
    const btn = document.querySelector('[data-menu="idli"]');
    btn.scrollIntoView({ block: "center" });
    btn.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 550));
  await page.evaluate(() => {
    const btn = document.querySelector('[data-menu="idli"]');
    btn.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
  });
  await page.waitForSelector("#qtyPick:not([hidden])");
  await page.click('#qtyPick [data-setqty="5"]');
  await page.waitForFunction(() => document.querySelector("#totIncome").textContent.trim() === "₹50");
  assert((await money("#totIncome")) === "₹50", "5 idli sale ₹50");
  await page.evaluate(() => document.getElementById("navShop").click());
  await page.click('#shopSub [data-shop="margins"]');
  await page.waitForSelector("#shopMargins:not([hidden])");
  const dayM = await page.$eval("#dayMarginBox", (el) => el.textContent);
  assert(/32\.5|₹32\.5|₹32.50/.test(dayM.replace(/\s/g, "") ) || /32/.test(dayM), "today item profit 32.5: " + dayM);

  await page.click('#shopSub [data-shop="staff"]');
  await page.waitForSelector("#shopStaff:not([hidden])");
  await page.click("#btnAddStaff");
  await page.waitForSelector("#staffForm:not([hidden])");
  await fill(page, "staffName", "முருகன்");
  await fill(page, "staffDaily", "700");
  await fill(page, "staffWeekly", "4200");
  await page.evaluate(() => {
    const btn = document.querySelector("#staffForm button.save");
    btn.scrollIntoView({ block: "center" });
    btn.click();
  });
  await page.waitForFunction(() => /முருகன்/.test((document.getElementById("staffList") || {}).textContent || "") || (document.getElementById("staffFormError") || {}).textContent, { timeout: 8000 });
  const staffAddErr = await page.$eval("#staffFormError", (el) => el.textContent);
  const staffListTxt = await page.$eval("#staffList", (el) => el.textContent);
  assert(/முருகன்/.test(staffListTxt), "staff added: list=" + staffListTxt + " err=" + staffAddErr);
  await page.evaluate(() => {
    const btn = document.querySelector('#staffList [data-wage="daily"]');
    btn.scrollIntoView({ block: "center" });
    btn.click();
  });
  await page.waitForSelector("#wageForm:not([hidden])");
  const wageAmt = await page.$eval("#wageAmount", (el) => el.value);
  assert(wageAmt === "700", "daily wage prefills 700: " + wageAmt);
  await page.evaluate(() => {
    const btn = document.querySelector("#wageForm button.save");
    btn.scrollIntoView({ block: "center" });
    btn.click();
  });
  await page.waitForFunction(() => {
    const t = (document.getElementById("totExpense") || {}).textContent || "";
    const err = (document.getElementById("wageFormError") || {}).textContent || "";
    return t.replace(/\s/g, "") === "₹900" || !!err;
  });
  assert((await money("#totExpense")) === "₹900", "daily wage added to expenses (200+700)");
  assert((await money("#totProfit")) === "-₹850", "profit 50-900 = -850");
  const staffTxt = await page.$eval("#staffList", (el) => el.textContent);
  assert(/700/.test(staffTxt), "staff card shows paid wage: " + staffTxt);

    // Old localStorage entries without payMode still load
  await page.evaluate(() => {
    const old = [
      { id: "legacy-1", type: "income", date: window.KadaiLogic.todayISO(), item: "டீ", amount: 30, createdAt: "2026-01-01T00:00:00.000Z" },
      { id: "legacy-2", type: "expense", date: window.KadaiLogic.todayISO(), item: "எண்ணெய்", amount: 5, vehicleNo: "MH01AA1", createdAt: "2026-01-01T00:00:01.000Z" }
    ];
    localStorage.setItem("kadai-tracker-v3", JSON.stringify(old));
  });
  await page.reload({ waitUntil: "networkidle0" });
  assert((await money("#totIncome")) === "₹30", "legacy income loads");
  assert((await money("#totExpense")) === "₹5", "legacy expense loads");
  assert((await money("#totProfit")) === "₹25", "legacy profit recomputed");
  const leg = await page.$eval("#entryList", (el) => el.textContent);
  assert(leg.includes("டீ") && leg.includes("எண்ணெய்"), "legacy rows rendered");
  assert(leg.includes("MH01AA1") || leg.includes("வாகனம்"), "legacy vehicle shown");


  // Phase 1 / v6: long-press idli, then qty 5, adds 5 at once
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle0" });
  await pickFirstLang(page, "ta");
  await page.waitForSelector("#menuGrid [data-menu=\"idli\"]");
  const menuBtns = await page.$$("#menuGrid button");
  assert(menuBtns.length >= 1, "menu buttons present");
  await page.evaluate(() => {
    const btn = document.querySelector('[data-menu="idli"]');
    btn.scrollIntoView({ block: "center" });
    btn.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 550));
  await page.evaluate(() => {
    const btn = document.querySelector('[data-menu="idli"]');
    btn.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
  });
  await page.waitForSelector("#qtyPick:not([hidden])");
  const qtyShown = await page.$eval("#qtyVal", (el) => el.textContent.trim());
  assert(qtyShown === "1", "qty row opens at 1: " + qtyShown);
  await page.click('#qtyPick [data-setqty="5"]');
  await page.waitForFunction(() => document.querySelector("#totIncome").textContent.trim() === "₹50");
  assert((await money("#totIncome")) === "₹50", "long-press then 5 adds ₹50");
  const list5 = await page.$eval("#entryList", (el) => el.textContent);
  assert(/இட்லி/.test(list5) && /5/.test(list5), "entry list shows 5 idli: " + list5);

  // v7: several entries in one line, saved at once
  t = await quick(page, "5 idli 3 tea");
  assert(/இட்லி/.test(t) && /டீ/.test(t), "toast lists both items: " + t);
  assert(/50/.test(t) && /30/.test(t), "toast shows 50 and 30: " + t);
  assert((await money("#totIncome")) === "₹130", "after 5+3 more: 50+80=130");
  await page.evaluate(() => document.getElementById("toastUndo").click());
  await page.waitForFunction(() => document.querySelector("#totIncome").textContent.trim() === "₹50");
  t = await quick(page, "5 idli 3 tea");
  assert((await money("#totIncome")) === "₹130", "multi re-saved 130");

  // v7: owner's sentence — two names, two items, no confirm
  t = await quick(page, "நூறு ரூபாய் டீக்கு ரவி பேருக்கு போடு, அம்பது ரூபாய் வடைக்கு குமார் பேருக்கு போடு");
  assert((await money("#totIncome")) === "₹280", "two named entries 100+50: " + (await money("#totIncome")));
  const named = await page.$eval("#entryList", (el) => el.textContent);
  assert(/ரவி/.test(named) && /குமார்/.test(named), "names shown in list: " + named);
  if (SHOTS) {
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(root, "shot-v7-multi-toast.png") });
  }
  // Edit on a multi save highlights rows
  await page.evaluate(() => document.getElementById("toastEdit").click());
  await page.waitForFunction(() => document.querySelectorAll("#entryList .row.flash").length === 2);

  // Unknown amount → editable sheet, never a silent save
  await page.evaluate(() => document.getElementById("toastMsg").innerHTML = "");
  await fill(page, "quickEntry", "somethingweird");
  await page.evaluate(() => document.getElementById("quickBtn").click());
  await page.waitForSelector("#confirmCard:not([hidden])");
  await page.evaluate(() => document.getElementById("confirmCancel").click());
  await page.waitForSelector("#confirmCard[hidden]");
  assert((await money("#totIncome")) === "₹280", "no-amount line leaves totals unchanged");

  // v6 paired spend/earn phrase still works, now saved directly with the margin in the toast
  const incBefore = await money("#totIncome");
  const expBefore = await money("#totExpense");
  t = await quick(page, "30 kazhi 50 varudhu");
  assert(/லாபம்/.test(t) && t.includes("20"), "pair toast shows லாபம் ₹20: " + t);
  const incAfter = await money("#totIncome");
  const expAfter = await money("#totExpense");
  assert(incAfter !== incBefore && expAfter !== expBefore, "pair save changes both totals: " + incBefore + "/" + expBefore + " → " + incAfter + "/" + expAfter);
  if (SHOTS) {
    await page.evaluate(() => { document.getElementById("toast").classList.remove("show"); window.scrollTo(0, 0); });
    await page.screenshot({ path: path.join(root, "shot-v7-today-ta.png") });
  }

  // v7: switch to Hindi in Settings — Devanagari labels with English underneath, no Tamil script
  await page.evaluate(() => document.getElementById("btnSettings").click());
  await page.waitForSelector('[data-setlang="hi"]');
  await page.evaluate(() => document.querySelector('[data-setlang="hi"]').click());
  await page.evaluate(() => { const c = document.getElementById("closeSettings"); if (c) c.click(); });
  const hi = await page.evaluate(() => ({
    inc: document.querySelector(".tot.income").innerText,
    lang: document.documentElement.lang,
    voice: JSON.parse(localStorage.getItem("kadai-tracker-settings-v3")).voiceLang,
    nav: document.getElementById("navKadan").innerText,
    btn: document.getElementById("btnIncome").innerText
  }));
  assert(/आय/.test(hi.inc) && /Income/.test(hi.inc), "Hindi income label + English: " + hi.inc);
  assert(/उधार/.test(hi.nav) && /Credit/i.test(hi.nav), "Hindi nav with English: " + hi.nav);
  assert(hi.lang === "hi" && hi.voice === "hi-IN", "html lang + speech hi-IN: " + JSON.stringify(hi));
  const tamilVisible = await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const bad = [];
    const userData = "#entryList .item, #entryList .meta, #kadanList, #setShopName, #menuEditor, #stockList, #staffList, .person-row .pn, #filterBar";
    while (walker.nextNode()) {
      const n = walker.currentNode;
      const el = n.parentElement;
      if (!el || !/[\u0B80-\u0BFF]/.test(n.textContent)) continue;
      if (el.closest("[hidden], .lg-n, " + userData)) continue;
      if (el.closest("#toast:not(.show)")) continue;
      const st = getComputedStyle(el);
      if (st.display === "none" || st.visibility === "hidden" || !el.offsetParent) continue;
      bad.push(n.textContent.trim().slice(0, 40));
    }
    return bad;
  });
  assert(tamilVisible.length === 0, "no Tamil UI text in Hindi mode: " + JSON.stringify(tamilVisible));
  t = await quick(page, "रवि के नाम 100 की चाय");
  assert(/सेव/.test(t) && /Saved/.test(t), "Hindi saved toast: " + t);
  assert(/चाय/.test(t) && t.includes("100"), "Hindi item in toast: " + t);
  const hiRows = await page.$eval("#entryList", (el) => el.textContent);
  assert(/रवि/.test(hiRows), "Hindi name saved: " + hiRows);
  if (SHOTS) {
    await page.evaluate(() => { document.getElementById("toast").classList.remove("show"); window.scrollTo(0, 0); });
    await page.screenshot({ path: path.join(root, "shot-v7-today-hi.png") });
  }

  // Marathi parse in Marathi mode
  await page.evaluate(() => document.getElementById("btnSettings").click());
  await page.evaluate(() => document.querySelector('[data-setlang="mr"]').click());
  await page.evaluate(() => { const c = document.getElementById("closeSettings"); if (c) c.click(); });
  const incMr0 = await money("#totIncome");
  t = await quick(page, "शंभर रुपये चहा");
  assert(/जतन/.test(t), "Marathi toast: " + t);
  assert((await money("#totIncome")) !== incMr0, "Marathi entry saved");
  const mrVoice = await page.evaluate(() => JSON.parse(localStorage.getItem("kadai-tracker-settings-v3")).voiceLang);
  assert(mrVoice === "mr-IN", "speech mr-IN: " + mrVoice);

  // English mode: English only, no subtitles
  await page.evaluate(() => document.getElementById("btnSettings").click());
  await page.evaluate(() => document.querySelector('[data-setlang="en"]').click());
  await page.evaluate(() => { const c = document.getElementById("closeSettings"); if (c) c.click(); });
  const en = await page.evaluate(() => document.querySelector(".tot.income").innerText);
  assert(/Income/.test(en) && !/[\u0900-\u097F\u0B80-\u0BFF]/.test(en), "English-only label: " + en);
  t = await quick(page, "add 500 Ravi peruku");
  assert(/^Saved/.test(t.trim()) && !/[\u0B80-\u0BFF]/.test(t), "English toast only: " + t);

  // back to Tamil
  await page.evaluate(() => document.getElementById("btnSettings").click());
  await page.evaluate(() => document.querySelector('[data-setlang="ta"]').click());
  await page.evaluate(() => { const c = document.getElementById("closeSettings"); if (c) c.click(); });
  const ta = await page.evaluate(() => document.querySelector(".tot.income").innerText);
  assert(/வரவு/.test(ta) && /Income/.test(ta), "Tamil back with English sub: " + ta);

  // ===================== v8 =====================
  const settingsJson = () => page.evaluate(() => JSON.parse(localStorage.getItem("kadai-tracker-settings-v3")));
  const openSettings = async () => {
    await page.evaluate(() => document.getElementById("btnSettings").click());
    await page.waitForSelector("#settings:not([hidden])");
  };
  const setLang = async (l) => {
    await openSettings();
    await page.evaluate((l) => document.querySelector('[data-setlang="' + l + '"]').click(), l);
    await page.evaluate(() => document.getElementById("closeSettings").click());
  };
  // Bug 0: open Settings in Hindi, switch to Tamil, Save → header must be Tamil, not Hindi
  await setLang("hi");
  await openSettings();
  const hiShopField = await page.$eval("#setShopName", (el) => el.value);
  assert(/इडली/.test(hiShopField), "Hindi default name in field: " + hiShopField);
  await page.evaluate(() => document.querySelector('[data-setlang="ta"]').click());
  await page.evaluate(() => document.getElementById("saveSettings").click());
  let head = await page.$eval("#shopName", (el) => el.textContent);
  assert(head === "இட்லி தோசை டீ கடை", "Tamil header after hi→ta save: " + head);
  // Old stored Hindi default (Raja's phone) also shows Tamil in Tamil mode
  await page.evaluate(() => {
    const st = JSON.parse(localStorage.getItem("kadai-tracker-settings-v3"));
    st.shopName = "इडली डोसा चाय दुकान";
    localStorage.setItem("kadai-tracker-settings-v3", JSON.stringify(st));
  });
  await page.reload({ waitUntil: "networkidle0" });
  head = await page.$eval("#shopName", (el) => el.textContent);
  assert(head === "இட்லி தோசை டீ கடை", "stored Hindi default shows Tamil: " + head);
  // A typed name stays as typed in every language
  await openSettings();
  await fill(page, "setShopName", "Raja Kadai");
  await page.evaluate(() => document.getElementById("saveSettings").click());
  await setLang("hi");
  head = await page.$eval("#shopName", (el) => el.textContent);
  assert(head === "Raja Kadai", "custom name kept in Hindi: " + head);
  await setLang("ta");
  await openSettings();
  await fill(page, "setShopName", "");
  await page.evaluate(() => document.getElementById("saveSettings").click());
  head = await page.$eval("#shopName", (el) => el.textContent);
  assert(head === "இட்லி தோசை டீ கடை", "blank name → default Tamil: " + head);
  // Date line not truncated
  const dateFit = await page.$eval("#dateLabel", (el) => ({ t: el.textContent, sw: el.scrollWidth, cw: el.clientWidth, ov: getComputedStyle(el).textOverflow }));
  assert(dateFit.sw <= dateFit.cw + 1 && !/…|\.\.\./.test(dateFit.t), "date label fits: " + JSON.stringify(dateFit));
  // Settings: bilingual language buttons + English sub-lines
  await openSettings();
  const setTxt = await page.evaluate(() => ({
    ta: document.querySelector('[data-setlang="ta"]').innerText,
    hi: document.querySelector('[data-setlang="hi"]').innerText,
    mr: document.querySelector('[data-setlang="mr"]').innerText,
    en: document.querySelector('[data-setlang="en"]').innerText,
    subs: [...document.querySelectorAll("#settings .bi .en")].filter((e) => e.offsetParent && e.textContent.trim()).length,
    hold: document.querySelector('[data-voicemode="hold"]').innerText
  }));
  assert(setTxt.ta.includes("தமிழ்") && setTxt.ta.includes("Tamil"), "ta button: " + setTxt.ta);
  assert(setTxt.hi.includes("हिंदी") && setTxt.hi.includes("Hindi"), "hi button: " + setTxt.hi);
  assert(setTxt.mr.includes("मराठी") && setTxt.mr.includes("Marathi"), "mr button: " + setTxt.mr);
  assert(setTxt.en.trim() === "English", "en button: " + setTxt.en);
  assert(setTxt.subs >= 8, "settings English sub-lines: " + setTxt.subs);
  assert(/Hold to talk/.test(setTxt.hold), "hold-to-talk option: " + setTxt.hold);
  if (SHOTS) await page.screenshot({ path: path.join(root, "shot-v8-settings-ta.png") });
  // hold mode persists
  await page.evaluate(() => document.querySelector('[data-voicemode="hold"]').click());
  assert((await settingsJson()).voiceMode === "hold", "voiceMode hold saved");
  const micHold = await page.$eval("#micBig", (el) => el.innerText);
  assert(/பிடித்து/.test(micHold), "mic label in hold mode: " + micHold);
  await page.evaluate(() => document.querySelector('[data-voicemode="tap"]').click());
  await page.evaluate(() => document.getElementById("closeSettings").click());

  // Units: 20 kg tomato for 1000 rupees = ₹1000 expense (not 20000)
  let exp0 = await money("#totExpense");
  t = await quick(page, "இருபது கிலோ தக்காளி ஆயிரம் ரூபா");
  const numOf = (m) => Number(String(m).replace(/[^\d.-]/g, ""));
  assert(numOf(await money("#totExpense")) - numOf(exp0) === 1000, "kg expense +1000: " + exp0 + " → " + (await money("#totExpense")) + " toast " + t);
  assert(/20 கிலோ/.test(t), "toast shows 20 கிலோ: " + t);
  let rows = await page.$eval("#entryList", (el) => el.innerText);
  assert(/20 கிலோ/.test(rows) && /kg/.test(rows), "list shows 20 கிலோ (kg): " + rows.slice(0, 300));
  if (SHOTS) {
    await page.evaluate(() => { document.getElementById("toast").classList.remove("show"); document.getElementById("entryList").scrollIntoView(); window.scrollBy(0, -60); });
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(root, "shot-v8-kg.png") });
  }
  // Per-kilo rate multiplies
  exp0 = await money("#totExpense");
  t = await quick(page, "3 கிலோ வெங்காயம் கிலோ 50 ரூபா");
  assert(numOf(await money("#totExpense")) - numOf(exp0) === 150, "rate 3×50=150: " + t);
  assert(/50/.test(t) && /150/.test(t), "rate calc in toast: " + t);
  // Quantity + unit, no price → form with unit chips, kg selected
  await page.evaluate(() => { document.getElementById("toastMsg").innerHTML = ""; });
  await fill(page, "quickEntry", "ஒரு கிலோ தக்காளி");
  await page.evaluate(() => document.getElementById("quickBtn").click());
  await page.waitForSelector("#sheet:not([hidden])");
  const unitState = await page.evaluate(() => ({
    unit: document.getElementById("fldUnit").value,
    chips: document.getElementById("unitChips").innerText,
    on: (document.querySelector("#unitChips .on") || {}).innerText || "",
    qty: document.getElementById("fldQty").value
  }));
  assert(unitState.unit === "கிலோ" && /கிலோ/.test(unitState.on) && unitState.qty === "1", "kg form: " + JSON.stringify(unitState));
  assert(/kg/.test(unitState.chips) && /டஜன்/.test(unitState.chips) && /லிட்டர்/.test(unitState.chips), "unit chips: " + unitState.chips);
  await page.evaluate(() => document.querySelector('#unitChips [data-unit="கிராம்"]').click());
  assert((await page.$eval("#fldUnit", (el) => el.value)) === "கிராம்", "chip sets unit");
  await page.evaluate(() => { document.getElementById("closeForm").click(); });
  await page.waitForSelector("#sheet[hidden]");

  // Math: "50 into 3 tea" = 150, calc shown in toast
  let inc0 = await money("#totIncome");
  t = await quick(page, "50 into 3 tea");
  assert(numOf(await money("#totIncome")) - numOf(inc0) === 150, "50 into 3 tea = +150: " + t);
  assert(/50 × 3 = ₹150/.test(t), "calc in toast: " + t);
  // add + sub in Tamil slang
  exp0 = await money("#totExpense");
  t = await quick(page, "500 கழி 120 selavu");
  assert(numOf(await money("#totExpense")) - numOf(exp0) === 380, "500-120 expense 380: " + t);
  inc0 = await money("#totIncome");
  t = await quick(page, "200 plus 300 podu");
  assert(numOf(await money("#totIncome")) - numOf(inc0) === 500, "200+300 income 500: " + t);
  // Math only → calculator card, then save as expense
  inc0 = await money("#totIncome");
  exp0 = await money("#totExpense");
  await fill(page, "quickEntry", "1000 வகு 4");
  await page.evaluate(() => document.getElementById("quickBtn").click());
  await page.waitForSelector("#calcCard:not([hidden])");
  const calc = await page.evaluate(() => ({ e: document.getElementById("calcExpr").textContent, r: document.getElementById("calcRes").textContent, c: document.getElementById("calcCard").innerText }));
  assert(/1000 ÷ 4/.test(calc.e) && calc.r === "₹250", "calc card: " + JSON.stringify(calc));
  assert(/Save as income/.test(calc.c) && /Save as expense/.test(calc.c), "calc buttons: " + calc.c);
  assert((await money("#totIncome")) === inc0 && (await money("#totExpense")) === exp0, "math-only saves nothing yet");
  if (SHOTS) {
    await page.evaluate(() => { document.getElementById("toast").classList.remove("show"); document.getElementById("calcCard").scrollIntoView({ block: "center" }); });
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(root, "shot-v8-math.png") });
  }
  await page.evaluate(() => document.getElementById("calcExpense").click());
  await page.waitForSelector("#calcCard[hidden]");
  assert(numOf(await money("#totExpense")) - numOf(exp0) === 250, "calc saved as expense 250");
  // Hindi multiply word
  inc0 = await money("#totIncome");
  t = await quick(page, "25 गुणा 4 चाय");
  assert(numOf(await money("#totIncome")) - numOf(inc0) === 100, "25 गुणा 4 = 100: " + t);

  // Payments to people → expense rows at once, By person card, filter
  exp0 = await money("#totExpense");
  t = await quick(page, "ராமுக்கு 500 கொடுத்தேன், சேகருக்கு 300 கொடுத்தேன், ரவி எனக்கு 200 கொடுத்தான்");
  rows = await page.$eval("#entryList", (el) => el.innerText);
  assert(numOf(await money("#totExpense")) - numOf(exp0) === 800, "two payments out = 800: " + t);
  assert(/ராம்/.test(rows) && /சேகர்/.test(rows), "payment names in list: " + rows.slice(0, 400));
  const pcard = await page.$eval("#personCard", (el) => ({ h: el.hidden, t: el.innerText }));
  assert(!pcard.h && /By person/.test(pcard.t) && /சேகர்/.test(pcard.t) && /300/.test(pcard.t), "person card: " + JSON.stringify(pcard));
  // worker wage → staff account: add முருகன் as staff (as the Shop tab would)
  await page.evaluate(() => {
    const st = JSON.parse(localStorage.getItem("kadai-tracker-settings-v3"));
    st.staff = [{ id: "staff-m", name: "முருகன்", dailyWage: 700, weeklyWage: 4200 }];
    localStorage.setItem("kadai-tracker-settings-v3", JSON.stringify(st));
  });
  await page.reload({ waitUntil: "networkidle0" });
  const wages0 = ((await settingsJson()).wages || []).length;
  exp0 = await money("#totExpense");
  t = await quick(page, "முருகனுக்கு 350 கொடுத்தேன்");
  assert(numOf(await money("#totExpense")) - numOf(exp0) === 350, "murugan 350 expense: " + t);
  assert(((await settingsJson()).wages || []).length === wages0 + 1, "wage record added for staff");
  assert(/பணியாளர்/.test(t), "staff link in toast: " + t);
  await page.evaluate(() => document.getElementById("toastUndo").click());
  await page.waitForFunction((w) => (JSON.parse(localStorage.getItem("kadai-tracker-settings-v3")).wages || []).length === w, {}, wages0);
  t = await quick(page, "முருகனுக்கு 350 கொடுத்தேன்");
  // filter by tapping a name
  await page.evaluate(() => { document.getElementById("toast").classList.remove("show"); [...document.querySelectorAll("#personCard [data-person]")].find((b) => /சேகர்/.test(b.textContent)).click(); });
  await page.waitForSelector("#filterBar:not([hidden])");
  const filtered = await page.$$eval("#entryList .row", (els) => els.map((e) => e.innerText));
  assert(filtered.length === 1 && /சேகர்/.test(filtered[0]), "filtered to one person: " + JSON.stringify(filtered));
  if (SHOTS) {
    await page.evaluate(() => { document.getElementById("filterBar").scrollIntoView({ block: "start" }); window.scrollBy(0, -10); });
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(root, "shot-v8-people.png") });
  }
  await page.evaluate(() => document.getElementById("clearFilter").click());
  await page.waitForSelector("#filterBar[hidden]");
  // Summary tab has the By person card too
  await page.evaluate(() => document.getElementById("navSummary").click());
  const psum = await page.$eval("#personSumCard", (el) => el.innerText);
  assert(/சேகர்/.test(psum) && /முருகன்/.test(psum), "summary by person: " + psum);
  await page.evaluate(() => document.getElementById("navToday").click());
  // level meter + tip exist
  assert(await page.$("#levelMeter i") && await page.$("#closeTip"), "level meter + close tip present");

  // Voice error helpers are present in the page
  const codes = await page.evaluate(() => {
    const L = window.KadaiLogic;
    return {
      nos: L.voiceErrorMessage("no-speech"),
      iphone: L.unsupportedVoiceCode("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)", false),
      init: L.VOICE.INITIAL_TIMEOUT_MS,
      cap: L.VOICE.MAX_RESTARTS
    };
  });
  assert(codes.nos && codes.nos.ta && codes.nos.en, "page exposes bilingual no-speech error");
  assert(codes.iphone === "iphone", "page flags iPhone as unsupported");
  assert(codes.init === 5500 && codes.cap === 3, "page voice policy constants");


  // ===================== v9: voice with a mocked SpeechRecognition =====================
  // Confirms the default path never opens getUserMedia, sets the right language, shows states and errors.
  const vp = await browser.newPage();
  await vp.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  vp.setDefaultTimeout(9000);
  const vErrors = [];
  vp.on("pageerror", (e) => { vErrors.push(e.message); console.log("PAGEERROR(voice):", e.message); });
  await vp.evaluateOnNewDocument(() => {
    window.__gum = 0;
    const md = navigator.mediaDevices || {};
    md.getUserMedia = function () { window.__gum++; return Promise.reject(new Error("mock: getUserMedia must not be called")); };
    if (!navigator.mediaDevices) { try { Object.defineProperty(navigator, "mediaDevices", { value: md }); } catch (e) { /* ignore */ } }
    window.__AC = 0;
    window.AudioContext = function () { window.__AC++; throw new Error("mock: no AudioContext"); };
    window.__recs = [];
    window.__plan = "ok";
    window.__phrase = "tea 20 glass 10 rupees";
    class FakeSR {
      constructor() { this.lang = ""; this.maxAlternatives = 1; window.__recs.push(this); }
      start() {
        const self = this;
        const plan = window.__plan;
        self.__started = true;
        const delay = plan === "slow-permission" ? 6500 : 60;
        setTimeout(() => {
          if (plan === "hang") return;
          self.onstart && self.onstart();
          self.onaudiostart && self.onaudiostart();
          if (plan === "ok" || plan === "slow-permission") {
            setTimeout(() => {
              self.onsoundstart && self.onsoundstart();
              self.onspeechstart && self.onspeechstart();
              window.__sawListening = document.getElementById("listenState").innerText;
              const interim = [{ transcript: "tea 20", confidence: 0 }];
              interim.isFinal = false;
              self.onresult && self.onresult({ resultIndex: 0, results: [interim] });
              window.__sawInterim = document.getElementById("liveBox").innerText;
              const fin = [{ transcript: "the wanted glass", confidence: 0.9 }, { transcript: window.__phrase, confidence: 0.6 }];
              fin.isFinal = true;
              self.onresult && self.onresult({ resultIndex: 0, results: [fin] });
            }, 150);
          } else if (plan !== "silent") {
            self.onerror && self.onerror({ error: plan });
            self.onend && self.onend();
          }
        }, delay);
      }
      stop() { setTimeout(() => this.onend && this.onend(), 10); }
      abort() { this.stop(); }
    }
    window.SpeechRecognition = FakeSR;
    window.webkitSpeechRecognition = FakeSR;
  });
  // v8-era saved settings with the meter ON and hold mode → migrated once to meter OFF + tap
  await vp.goto(url, { waitUntil: "networkidle0" });
  await vp.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("kadai-tracker-settings-v3", JSON.stringify({ lang: "ta", voiceLang: "ta-IN", noiseFilter: true, voiceMode: "hold", shopName: "இட்லி தோசை டீ கடை" }));
  });
  await vp.reload({ waitUntil: "networkidle0" });
  const mig = await vp.evaluate(() => JSON.parse(localStorage.getItem("kadai-tracker-settings-v3")));
  assert(mig.voiceFixV9 === true && mig.micPulse === false && mig.voiceMode === "tap" && !("noiseFilter" in mig), "v9 migration meter off + tap: " + JSON.stringify(mig).slice(0, 200));
  // user turns hold back on after the migration → kept
  await vp.evaluate(() => {
    const st = JSON.parse(localStorage.getItem("kadai-tracker-settings-v3"));
    st.voiceMode = "hold";
    localStorage.setItem("kadai-tracker-settings-v3", JSON.stringify(st));
  });
  await vp.reload({ waitUntil: "networkidle0" });
  assert((await vp.evaluate(() => JSON.parse(localStorage.getItem("kadai-tracker-settings-v3")).voiceMode)) === "hold", "v9 hold kept after one-time migration");
  await vp.evaluate(() => {
    const st = JSON.parse(localStorage.getItem("kadai-tracker-settings-v3"));
    st.voiceMode = "tap";
    localStorage.setItem("kadai-tracker-settings-v3", JSON.stringify(st));
  });
  await vp.reload({ waitUntil: "networkidle0" });

  const vMoney = () => vp.$eval("#totIncome", (el) => el.textContent.trim());
  const tapMic = () => vp.evaluate(() => document.getElementById("micBig").click());
  const waitToast = () => vp.waitForFunction(() => document.getElementById("toast").classList.contains("show") && document.getElementById("toastMsg").textContent.trim() !== "");
  const clearToast = () => vp.evaluate(() => { document.getElementById("toast").classList.remove("show"); document.getElementById("toastMsg").innerHTML = ""; });

  // Default tap path, Tamil: listening state, heard text, best alternative saved, no getUserMedia
  await tapMic();
  await vp.waitForFunction(() => !document.getElementById("listenState").hidden);
  const st0 = await vp.$eval("#listenState", (el) => el.innerText);
  assert(/கேட்கிறேன்|மைக்/.test(st0) && /Listening|mic/i.test(st0), "v9 visible listening state: " + st0);
  await waitToast();
  const v1 = await vp.evaluate(() => ({
    gum: window.__gum, ac: window.__AC, lang: window.__recs[0].lang, maxAlt: window.__recs[0].maxAlternatives,
    cont: window.__recs[0].continuous, saw: window.__sawListening, interim: window.__sawInterim,
    live: document.getElementById("liveBox").innerText, toast: document.getElementById("toastMsg").innerText,
    stateHidden: document.getElementById("listenState").hidden, listening: document.getElementById("micBig").classList.contains("listening")
  }));
  assert(v1.gum === 0 && v1.ac === 0, "v9 default path: no getUserMedia / AudioContext: " + JSON.stringify(v1));
  assert(v1.lang === "ta-IN" && v1.maxAlt === 5 && v1.cont === true, "v9 recognition config: " + JSON.stringify(v1));
  assert(/கேட்கிறது|Hearing/.test(v1.saw), "v9 hearing state on speech: " + v1.saw);
  assert(/tea 20/.test(v1.interim), "v9 interim text shown while listening: " + v1.interim);
  assert(/tea 20 glass 10 rupees/.test(v1.live) && /Heard|கேட்டது/.test(v1.live), "v9 heard text shown: " + v1.live);
  assert(/200/.test(v1.toast), "v9 best alternative saved ₹200: " + v1.toast);
  assert(v1.stateHidden && !v1.listening, "v9 listening state cleared after stop");
  assert((await vMoney()) === "₹200", "v9 voice entry saved");
  await clearToast();

  // Language code per mode
  for (const [lng, code] of [["en", "en-IN"], ["hi", "hi-IN"], ["mr", "mr-IN"], ["ta", "ta-IN"]]) {
    await vp.evaluate(() => document.getElementById("btnSettings").click());
    await vp.evaluate((l) => document.querySelector('[data-setlang="' + l + '"]').click(), lng);
    await vp.evaluate(() => document.getElementById("closeSettings").click());
    await vp.evaluate(() => { window.__plan = "silent"; });
    const n0 = await vp.evaluate(() => window.__recs.length);
    await tapMic();
    await vp.waitForFunction((n) => window.__recs.length > n, {}, n0);
    const got = await vp.evaluate(() => window.__recs[window.__recs.length - 1].lang);
    assert(got === code, "v9 speech lang for " + lng + ": " + got);
    await tapMic(); // tap again stops
    await vp.waitForFunction(() => !document.getElementById("micBig").classList.contains("listening"));
  }
  // Errors: each onerror code shows its own bilingual message
  const errCases = [
    ["not-allowed", /Site settings/, /அனுமதி/],
    ["service-not-allowed", /speech service/, /சேவை/],
    ["audio-capture", /another app/i, /மைக்/],
    ["network", /network/i, /இணையம்/],
    ["no-speech", /Nothing was heard/, /கேட்கவில்லை/]
  ];
  for (const [code, enRe, taRe] of errCases) {
    await vp.evaluate((c) => { window.__plan = c; }, code);
    await tapMic();
    await vp.waitForFunction(() => !document.getElementById("voiceError").hidden);
    const e = await vp.evaluate(() => ({ ta: document.getElementById("voiceErrorTa").innerText, en: document.getElementById("voiceErrorEn").innerText, listening: document.getElementById("micBig").classList.contains("listening") }));
    assert(enRe.test(e.en) && taRe.test(e.ta) && !e.listening, "v9 error " + code + ": " + JSON.stringify(e));
    await clearToast();
  }
  if (SHOTS) {
    await vp.evaluate(() => { window.__plan = "not-allowed"; document.getElementById("micBig").click(); });
    await vp.waitForFunction(() => !document.getElementById("voiceError").hidden);
    await vp.evaluate(() => { document.getElementById("toast").classList.remove("show"); document.getElementById("voiceError").scrollIntoView({ block: "center" }); });
    await new Promise((r) => setTimeout(r, 400));
    await vp.screenshot({ path: path.join(root, "shot-v9-mic-error.png") });
  }
  // start() throwing is caught
  await vp.evaluate(() => {
    window.__plan = "ok";
    const Orig = window.webkitSpeechRecognition;
    window.SpeechRecognition = window.webkitSpeechRecognition = class extends Orig { start() { throw new Error("InvalidStateError mock"); } };
    window.__restore = () => { window.SpeechRecognition = window.webkitSpeechRecognition = Orig; };
  });
  await tapMic();
  await vp.waitForFunction(() => !document.getElementById("voiceError").hidden && !document.getElementById("micBig").classList.contains("listening"));
  await vp.evaluate(() => window.__restore());
  await clearToast();
  // First use: permission prompt takes 6.5 s — must NOT fail with no-speech while the prompt is up
  await vp.evaluate(() => { window.__plan = "slow-permission"; });
  const inc0v = await vMoney();
  await tapMic();
  await vp.waitForFunction(() => /Chrome|Allow/.test(document.getElementById("listenState").innerText));
  await vp.waitForFunction((m) => document.getElementById("totIncome").textContent.trim() !== m, { timeout: 15000 }, inc0v);
  assert(await vp.$eval("#voiceError", (el) => el.hidden), "v9 no error during a slow permission prompt");
  await clearToast();
  if (SHOTS) {
    await vp.evaluate(() => { window.__plan = "silent"; document.getElementById("micBig").click(); });
    await vp.waitForFunction(() => /Listening|கேட்கிறேன்/.test(document.getElementById("listenState").innerText));
    await vp.evaluate(() => document.getElementById("micBig").scrollIntoView({ block: "center" }));
    await vp.screenshot({ path: path.join(root, "shot-v9-listening.png") });
    await tapMic();
    await vp.waitForFunction(() => !document.getElementById("micBig").classList.contains("listening"));
  }
  // Hold mode: a quick tap (pointerdown + pointerup + click) still works like tap mode
  await vp.evaluate(() => {
    const st = JSON.parse(localStorage.getItem("kadai-tracker-settings-v3"));
    st.voiceMode = "hold";
    localStorage.setItem("kadai-tracker-settings-v3", JSON.stringify(st));
  });
  await vp.reload({ waitUntil: "networkidle0" });
  await vp.evaluate(() => { window.__plan = "ok"; window.__phrase = "add 300"; });
  const incH = await vMoney();
  await vp.evaluate(() => {
    const m = document.getElementById("micBig");
    m.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch", button: 0 }));
    m.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerType: "touch", button: 0 }));
    m.click();
  });
  await vp.waitForFunction((m) => document.getElementById("totIncome").textContent.trim() !== m, { timeout: 12000 }, incH);
  const hv = await vp.evaluate(() => ({ recs: window.__recs.length, gum: window.__gum, inc: document.getElementById("totIncome").textContent.trim() }));
  assert(hv.recs === 1 && hv.gum === 0, "v9 hold-mode quick tap: one recognition, no getUserMedia: " + JSON.stringify(hv));
  // Hold mode: press-and-hold then release stops and saves
  await vp.evaluate(() => { window.__plan = "ok"; window.__phrase = "add 50"; });
  const incH2 = await vMoney();
  await vp.evaluate(() => document.getElementById("micBig").dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch", button: 0 })));
  await new Promise((r) => setTimeout(r, 900));
  await vp.evaluate(() => {
    const m = document.getElementById("micBig");
    m.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerType: "touch", button: 0 }));
    m.click();
  });
  await vp.waitForFunction((m) => document.getElementById("totIncome").textContent.trim() !== m, { timeout: 8000 }, incH2);
  assert(vErrors.length === 0, "v9 no JS errors on the voice page: " + vErrors.join(" | "));
  await vp.close();

  await require("./ui-v10").run({ browser, url, assert, SHOTS, root, LIVE_URL, bump });

  await browser.close();
  server.close();
  console.log("UI smoke tests passed");
})().catch((err) => {
  console.error("UI TEST FAILED:", err);
  process.exit(1);
});
