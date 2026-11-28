"use strict";
/* v11 browser checks: 5 s undo (multi-entry too), audit log, galla cash check, supplier due book, min-stock + wastage,
   7/30-day summary, combo tiles, Hindi/Marathi (no Tamil leaking).  Called from ui-smoke.js:  await require("./ui-v11").run(ctx) */
const path = require("path");

module.exports.run = async function run(ctx) {
  const { browser, url, assert, SHOTS, root } = ctx;
  const SETTINGS = "kadai-tracker-settings-v3";
  const ENTRIES = "kadai-tracker-v3";
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const newCtx = () => (browser.createBrowserContext ? browser.createBrowserContext() : browser.createIncognitoBrowserContext());
  async function newPage(bctx, errors) {
    const page = await bctx.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    page.setDefaultTimeout(8000);
    page.on("pageerror", (e) => errors.push(e.message));
    return page;
  }
  async function fresh(page, lang) {
    await page.goto(url, { waitUntil: "networkidle0" });
    await page.evaluate(() => localStorage.clear());
    await page.goto(url, { waitUntil: "networkidle0" });
    await page.waitForSelector("#langFirst:not([hidden])");
    await page.evaluate((l) => document.querySelector('[data-firstlang="' + l + '"]').click(), lang || "en");
    await page.waitForFunction(() => document.getElementById("langFirst").hidden);
  }
  const fillIn = (page, id, text) => page.evaluate((id, text) => { const el = document.getElementById(id); el.value = text; el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); }, id, text);
  const click = (page, sel) => page.evaluate((s) => { const b = document.querySelector(s); if (!b) throw new Error("no " + s); b.scrollIntoView({ block: "center" }); b.click(); }, sel);
  const visible = (page, sel) => page.evaluate((s) => { const e = document.querySelector(s); return !!e && !e.hidden && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== "hidden"; }, sel);
  const text = (page, sel) => page.$eval(sel, (e) => e.textContent.replace(/\s+/g, " ").trim());
  const getSettings = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), SETTINGS);
  const getEntries = (page) => page.evaluate((k) => { const d = JSON.parse(localStorage.getItem(k)); return Array.isArray(d) ? d : d.entries; }, ENTRIES);
  const todayIso = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Calcutta" });
  const hideToast = (page) => page.evaluate(() => document.getElementById("toast").classList.remove("show"));
  async function quickAdd(page, t, keepToast) {
    await hideToast(page);
    await fillIn(page, "quickEntry", t);
    await page.evaluate(() => document.getElementById("quickBtn").click());
    await page.waitForFunction(() => document.getElementById("toast").classList.contains("show"));
    if (!keepToast) await hideToast(page);
  }
  async function seedEntries(page, list) {
    await page.evaluate((k, list) => {
      const d = JSON.parse(localStorage.getItem(k) || "[]");
      const arr = Array.isArray(d) ? d : d.entries;
      list.forEach((e, i) => arr.push(Object.assign({ id: "seed-" + i + "-" + Math.random().toString(36).slice(2, 6), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), qty: null, unit: "", unitPrice: null, note: "", customerName: "", creditPaid: false }, e)));
      localStorage.setItem(k, JSON.stringify(Array.isArray(d) ? arr : Object.assign(d, { entries: arr })));
    }, ENTRIES, list);
  }
  async function reload(page) { await page.reload({ waitUntil: "networkidle0" }); }
  async function goto(page, tab) { await click(page, "#nav" + tab); await sleep(60); }
  const errs = [];
  const bctx = await newCtx();
  const p = await newPage(bctx, errs);
  await fresh(p, "en");
  const today = todayIso();

  /* ================= 1. Undo = 5 s, one tap, multi-entry ================= */
  assert((await visible(p, "#comboRow")) === false, "v11 combo: row hidden while no combos are configured");
  await quickAdd(p, "tea 10 rupees, vada 15 rupees", true);
  const nAfter = (await getEntries(p)).length;
  assert(nAfter === 2, "v11 undo: a two-item quick entry saved both lines: " + nAfter);
  assert(await visible(p, "#toastUndo"), "v11 undo: Undo button is on the save toast");
  assert(await p.evaluate(() => document.getElementById("toast").classList.contains("undo-timer")), "v11 undo: countdown bar is running");
  await sleep(4100);
  assert(await p.evaluate(() => document.getElementById("toast").classList.contains("show")), "v11 undo: still undoable after 4 s");
  await sleep(1700);
  assert(!(await p.evaluate(() => document.getElementById("toast").classList.contains("show"))), "v11 undo: toast gone after ~5 s (not 8)");
  await quickAdd(p, "tea 10 rupees, vada 15 rupees", true);
  assert((await getEntries(p)).length === 4, "v11 undo: second multi save");
  await click(p, "#toastUndo");
  await sleep(150);
  assert((await getEntries(p)).length === 2, "v11 undo: ONE tap removes every line of a multi-entry save");
  await hideToast(p);

  /* ================= 2. Combos on Today ================= */
  // stock + recipe: idli uses 0.05 kg maavu
  await p.evaluate((k, today) => {
    const s = JSON.parse(localStorage.getItem(k));
    s.stock = s.stock.map((x) => (x.id === "maavu" ? Object.assign(x, { qty: 10 }) : x));
    s.recipes = { idli: { since: today, lines: [{ stockId: "maavu", qty: 0.05 }] } };
    s.autoStockSince = today;
    localStorage.setItem(k, JSON.stringify(s));
    localStorage.setItem("kadai-tracker-v3", "[]"); // start the combo checks from an empty day
  }, SETTINGS, today);
  await reload(p);
  await click(p, "#btnSettings");
  await p.waitForSelector("#settings:not([hidden])");
  await click(p, "#addCombo");
  await p.evaluate(() => {
    const box = document.querySelector("#comboEditor .combo-edit");
    const sel = box.querySelector('[data-k="menu"]'); sel.value = "idli";
    box.querySelector('[data-k="qty"]').value = "2";
  });
  await click(p, '#comboEditor [data-cladd="0"]');
  await p.evaluate(() => {
    const rows = document.querySelectorAll("#comboEditor .combo-edit .cl-row");
    rows[1].querySelector('[data-k="menu"]').value = "tea"; rows[1].querySelector('[data-k="qty"]').value = "1";
  });
  await click(p, "#addCombo");
  await p.evaluate(() => {
    const boxes = document.querySelectorAll("#comboEditor .combo-edit");
    boxes[1].querySelector(".cname").value = "Dosa set";
    boxes[1].querySelector('[data-k="menu"]').value = "dosa";
  });
  await click(p, "#addCombo");
  assert(!(await visible(p, "#addCombo")), "v11 combo: max 3 combos then the add button hides");
  await p.evaluate(() => { document.querySelectorAll("#comboEditor .combo-edit")[2].querySelector("[data-cldel]").click(); });
  await p.evaluate(() => { document.getElementById("setDevice").value = "Counter phone"; });
  await click(p, "#saveSettings");
  await sleep(120);
  await hideToast(p);
  const stC = await getSettings(p);
  assert(stC.combos.length === 2 && stC.combos[0].lines.length === 2 && stC.deviceName === "Counter phone", "v11 combo: saved 2 combos + device name: " + JSON.stringify(stC.combos));
  assert(await visible(p, "#comboRow"), "v11 combo: row visible once configured");
  const nBtn = await p.$$eval("#comboRow .combo-btn", (b) => b.length);
  assert(nBtn === 2, "v11 combo: two tiles");
  const rowBox = await p.$eval("#comboRow", (e) => { const r = e.getBoundingClientRect(); return { h: r.height, w: r.width }; });
  assert(rowBox.h < 80, "v11 combo: compact single row (" + rowBox.h + "px)");
  assert((await text(p, "#comboRow .combo-btn")).indexOf("₹30") !== -1, "v11 combo: tile shows total ₹30 (2 idli + tea): " + (await text(p, "#comboRow .combo-btn")));
  const nBefore = (await getEntries(p)).length;
  const maavuBefore = (await getSettings(p)).stock.find((x) => x.id === "maavu").qty;
  await click(p, '#comboRow [data-combo]');
  await sleep(120);
  let ent = await getEntries(p);
  assert(ent.length === nBefore + 2, "v11 combo: one tap logs both items (" + (ent.length - nBefore) + ")");
  const idliE = ent.filter((e) => e.item === "இட்லி" && e.date === today);
  assert(idliE.length === 1 && idliE[0].qty === 2 && idliE[0].amount === 20, "v11 combo: 2 idli at menu price: " + JSON.stringify(idliE.map((e) => [e.qty, e.amount])));
  const maavuAfter = (await getSettings(p)).stock.find((x) => x.id === "maavu").qty;
  assert(Math.abs(maavuBefore - maavuAfter - 0.1) < 1e-6, "v11 combo: recipe stock deducted (0.1 kg): " + maavuBefore + " → " + maavuAfter);
  assert(await visible(p, "#toastUndo"), "v11 combo: save shows Undo");
  if (SHOTS) {
    await p.evaluate(() => { document.getElementById("toast").classList.remove("show"); document.getElementById("comboRow").scrollIntoView({ block: "center" }); });
    await sleep(500);
    await p.screenshot({ path: path.join(root, "shot-v11-combos.png") });
  }
  await click(p, "#toastUndo");
  await sleep(150);
  assert((await getEntries(p)).length === nBefore, "v11 combo: Undo removes the whole combo");
  assert(Math.abs((await getSettings(p)).stock.find((x) => x.id === "maavu").qty - maavuBefore) < 1e-6, "v11 combo: Undo gives the stock back");
  await click(p, '#comboRow [data-combo]');
  await sleep(100);
  await hideToast(p);
  await click(p, '#comboRow [data-combo]');
  await sleep(100);
  ent = await getEntries(p);
  assert(ent.filter((e) => e.item === "இட்லி" && e.date === today)[0].qty === 4, "v11 combo: tapping twice merges into the same lines (qty 4)");
  await click(p, "#toastUndo");
  await sleep(150);
  assert(ent.length === (await getEntries(p)).length && (await getEntries(p)).filter((e) => e.item === "இட்லி" && e.date === today)[0].qty === 2, "v11 combo: Undo only reverses the last tap");
  await hideToast(p);

  /* ================= 3. Audit log ================= */
  // edit today's idli entry (the form), delete one entry, then read the log in Settings
  await p.evaluate(() => { document.querySelector('#entryList [data-act="edit"]').click(); });
  await p.waitForSelector("#sheet:not([hidden])");
  const before = (await getSettings(p)).auditLog.length;
  const fe = await p.evaluate(() => ({ amt: document.getElementById("fldAmount").value }));
  await fillIn(p, "fldAmount", String(Number(fe.amt) + 7));
  await p.evaluate(() => document.getElementById("entryForm").dispatchEvent(new Event("submit", { cancelable: true, bubbles: true })));
  await sleep(150);
  const st3 = await getSettings(p);
  assert(st3.auditLog.length === before + 1 && st3.auditLog[0].action === "edit" && st3.auditLog[0].changed.indexOf("amount") !== -1, "v11 audit: edit recorded with changed field: " + JSON.stringify(st3.auditLog[0]));
  assert(st3.auditLog[0].by === "Counter phone", "v11 audit: device name is recorded as 'who'");
  assert(st3.auditLog[0].old.amount !== st3.auditLog[0].new.amount, "v11 audit: old → new amounts differ");
  await hideToast(p);
  await click(p, '#entryList [data-act="delete"]');
  await p.waitForSelector("#modal:not([hidden])");
  await click(p, "#confirmDelete");
  await sleep(150);
  const st3b = await getSettings(p);
  assert(st3b.auditLog[0].action === "delete" && st3b.auditLog.length === before + 2, "v11 audit: delete recorded");
  await click(p, "#toastUndo"); // restore is also logged
  await sleep(150);
  assert((await getSettings(p)).auditLog[0].action === "restore", "v11 audit: undo-of-delete is logged as restore");
  await hideToast(p);
  await click(p, "#btnSettings");
  await p.waitForSelector("#settings:not([hidden])");
  await click(p, "#btnAudit");
  assert(await visible(p, "#auditList .audit-row"), "v11 audit: log rows show in Settings");
  const logTxt = await text(p, "#auditList");
  assert(/Counter phone/.test(logTxt) && /→/.test(logTxt), "v11 audit: log shows device and old → new: " + logTxt.slice(0, 160));
  if (SHOTS) {
    await p.evaluate(() => { document.getElementById("toast").classList.remove("show"); document.getElementById("comboEditor").scrollIntoView({ block: "start" }); });
    await sleep(400);
    await p.screenshot({ path: path.join(root, "shot-v11-settings.png") });
    await p.evaluate(() => document.getElementById("auditList").scrollIntoView({ block: "start" }));
    await sleep(400);
    await p.screenshot({ path: path.join(root, "shot-v11-audit.png") });
  }
  assert((await p.$$eval("#auditList input, #auditList button, #auditList textarea", (a) => a.length)) === 0, "v11 audit: log is read-only (no inputs or buttons)");
  await click(p, "#closeSettings");

  /* ================= 4. Galla check ================= */
  await p.evaluate((k, today) => {
    const arr = JSON.parse(localStorage.getItem(k));
    const list = Array.isArray(arr) ? arr : arr.entries;
    for (let i = list.length - 1; i >= 0; i--) if (list[i].date === today) list.splice(i, 1); // clean today
    localStorage.setItem(k, JSON.stringify(Array.isArray(arr) ? list : Object.assign(arr, { entries: list })));
  }, ENTRIES, today);
  await seedEntries(p, [
    { type: "income", date: today, item: "Tea cash", amount: 300, payMode: "cash" },
    { type: "income", date: today, item: "Tea upi", amount: 120, payMode: "upi" },
    { type: "income", date: today, item: "Tea credit", amount: 80, payMode: "credit", customerName: "Ravi" },
    { type: "expense", date: today, item: "Milk", amount: 60, payMode: "cash" },
    { type: "expense", date: today, item: "Gas", amount: 900, payMode: "upi" }
  ]);
  await reload(p);
  await goto(p, "Summary");
  await p.waitForSelector("#panelSummary:not([hidden])");
  assert(await visible(p, "#gallaCard"), "v11 galla: card on the Summary tab");
  await fillIn(p, "gallaOpening", "500");
  await click(p, "#gallaOpeningSave");
  await sleep(150);
  let g = (await getSettings(p)).galla;
  assert(g[today] && g[today].opening === 500, "v11 galla: opening saved once per day: " + JSON.stringify(g));
  let bk = await text(p, "#gallaBreakdown");
  // expected = 500 + 300 − 60 = 740 (UPI + credit left out)
  assert(/740/.test(bk) && !/1,?200|920/.test(bk), "v11 galla: expected = opening + cash sales − cash expenses (UPI/credit excluded) = 740: " + bk);
  await fillIn(p, "gallaActual", "720");
  await click(p, "#gallaActualSave");
  await sleep(150);
  let rs = await text(p, "#gallaResult");
  assert(/Short/.test(rs) && /20/.test(rs), "v11 galla: Short ₹20 shown: " + rs);
  await fillIn(p, "gallaActual", "755");
  await click(p, "#gallaActualSave");
  await sleep(150);
  rs = await text(p, "#gallaResult");
  assert(/Extra/.test(rs) && /15/.test(rs), "v11 galla: Extra ₹15 shown: " + rs);
  if (SHOTS) {
    await p.evaluate(() => { document.getElementById("toast").classList.remove("show"); document.getElementById("gallaCard").scrollIntoView({ block: "start" }); });
    await sleep(500);
    await p.screenshot({ path: path.join(root, "shot-v11-galla.png") });
  }
  // WhatsApp summary contains the galla block
  const waUrl = await p.evaluate(() => { let u = ""; window.open = (x) => { u = x; return null; }; document.getElementById("btnWhatsApp").click(); return u; });
  const waTxt = decodeURIComponent(waUrl.split("text=")[1] || "");
  assert(/Cash box|கல்லா/.test(waTxt) && /740/.test(waTxt) && /755/.test(waTxt) && /Extra|கூடுதல்/.test(waTxt), "v11 galla: WhatsApp summary has opening/expected/actual/extra: " + waTxt.slice(-220));
  // credit repaid in cash joins; repaid by UPI does not
  await goto(p, "Kadan");
  await click(p, "[data-paid]");
  await p.waitForSelector("#modal:not([hidden])");
  assert(await visible(p, "#paidViaSeg"), "v11 galla: mark-paid asks Cash or UPI");
  await click(p, '#paidViaSeg [data-paidvia="cash"]');
  await click(p, "#confirmDelete");
  await sleep(150);
  await hideToast(p);
  await goto(p, "Summary");
  bk = await text(p, "#gallaBreakdown");
  assert(/820/.test(bk), "v11 galla: credit repaid in cash adds to expected (740 + 80 = 820): " + bk);
  assert((await getSettings(p)).auditLog[0].action === "paid", "v11 audit: mark-paid logged");
  // next day: yesterday's closing cash is offered as opening
  await p.evaluate((d) => { const i = document.getElementById("dateInput"); i.value = d; i.dispatchEvent(new Event("change", { bubbles: true })); }, new Date(Date.now() + 5.5 * 3600000 + 86400000).toISOString().slice(0, 10));
  await goto(p, "Summary");
  assert(await visible(p, "#gallaUsePrev"), "v11 galla: yesterday's closing cash offered as today's opening");
  await click(p, "#todayBtn");

  /* ================= 5. 7 / 30 day summary ================= */
  const dm = (n) => new Date(Date.now() + 5.5 * 3600000 - n * 86400000).toISOString().slice(0, 10);
  await seedEntries(p, [
    { type: "income", date: dm(3), item: "Idli", qty: 10, unit: "pcs", unitPrice: 10, amount: 100, payMode: "cash" },
    { type: "income", date: dm(10), item: "Dosa", qty: 5, unit: "pcs", unitPrice: 40, amount: 200, payMode: "cash" },
    { type: "expense", date: dm(2), item: "Flour", amount: 50, payMode: "cash" },
    { type: "expense", date: dm(20), item: "Oil", amount: 70, payMode: "cash" }
  ]);
  await reload(p);
  await goto(p, "Summary");
  const r7 = await text(p, "#rollBody");
  const r7inc = 300 + 120 + 80 + 100; // today's seeded sales (cash+upi+credit) + idli 3 days ago
  assert(/Top-selling/.test(r7) && new RegExp("₹\\s?" + (r7inc).toLocaleString("en-IN")).test(r7), "v11 weekly: 7-day total sales ₹" + r7inc + ": " + r7);
  assert(!/Dosa/.test(r7), "v11 weekly: 7-day top list leaves out the item sold 10 days ago");
  await click(p, '#rollSeg [data-roll="30"]');
  const r30 = await text(p, "#rollBody");
  assert(/Dosa/.test(r30) && /Idli/.test(r30), "v11 monthly: 30-day top list includes older items: " + r30);
  await click(p, '#rollSeg [data-roll="7"]');
  if (SHOTS) {
    await p.evaluate(() => { document.getElementById("toast").classList.remove("show"); document.getElementById("rollCard").scrollIntoView({ block: "start" }); });
    await sleep(500);
    await p.screenshot({ path: path.join(root, "shot-v11-weekly.png") });
  }

  /* ================= 6. Min stock + wastage ================= */
  await goto(p, "Shop");
  await p.waitForSelector("#panelShop:not([hidden])");
  await p.evaluate((k) => { const s = JSON.parse(localStorage.getItem(k)); const m = s.stock.find((x) => x.id === "maavu"); m.qty = 4; m.minAlert = 2; s.stockMoves = (s.stockMoves || []).concat([{ id: "buy1", itemId: "maavu", type: "in", qty: 10, date: new Date().toISOString().slice(0, 10), amount: 500, note: "", at: new Date().toISOString() }]); localStorage.setItem(k, JSON.stringify(s)); }, SETTINGS);
  await reload(p);
  assert(!(await p.evaluate(() => document.getElementById("navShop").classList.contains("has-low"))), "v11 minstock: no dot while above the level");
  await goto(p, "Shop");
  await click(p, '[data-minedit="maavu"]');
  await p.waitForSelector("#stockMinForm:not([hidden])");
  await fillIn(p, "stockMinVal", "6");
  await p.evaluate(() => document.getElementById("stockMinForm").dispatchEvent(new Event("submit", { cancelable: true, bubbles: true })));
  await sleep(150);
  await hideToast(p);
  assert((await getSettings(p)).stock.find((x) => x.id === "maavu").minAlert === 6, "v11 minstock: level saved per item");
  assert(await visible(p, "#stockList .badge.low"), "v11 minstock: red LOW badge on the item");
  assert(await p.evaluate(() => document.getElementById("navShop").classList.contains("has-low")), "v11 minstock: subtle dot on the Shop tab");
  await goto(p, "Today");
  assert(!(await p.evaluate(() => { const n = document.querySelector("#panelToday .badge.low"); return !!n && n.getClientRects().length > 0; })), "v11 minstock: no extra badge cluttering Today");
  await goto(p, "Shop");
  // wastage: cost pre-filled from last purchase (500 / 10 kg = 50 per kg)
  await click(p, "#btnWaste");
  await p.waitForSelector("#wasteForm:not([hidden])");
  await p.evaluate(() => { document.getElementById("wasteItemSel").value = "maavu"; });
  await fillIn(p, "wasteQty", "1");
  assert((await p.$eval("#wasteCost", (e) => e.value)) === "50", "v11 waste: loss pre-filled from the last purchase price");
  const eBefore = (await getEntries(p)).length;
  const qBefore = (await getSettings(p)).stock.find((x) => x.id === "maavu").qty;
  await p.evaluate(() => document.getElementById("wasteForm").dispatchEvent(new Event("submit", { cancelable: true, bubbles: true })));
  await sleep(200);
  const stW = await getSettings(p);
  assert(Math.abs(stW.stock.find((x) => x.id === "maavu").qty - (qBefore - 1)) < 1e-9, "v11 waste: stock reduced by the wasted quantity");
  const entW = await getEntries(p);
  const wE = entW.filter((e) => e.source === "waste");
  assert(entW.length === eBefore + 1 && wE.length === 1 && wE[0].amount === 50 && wE[0].nonCash === true, "v11 waste: one nonCash cost entry for ₹50: " + JSON.stringify(wE));
  const noDouble = await p.evaluate(() => 1);
  assert(noDouble === 1 && (await visible(p, "#wasteList .tx-row")), "v11 waste: recent wastage listed");
  if (SHOTS) {
    await p.evaluate(() => { document.getElementById("toast").classList.remove("show"); document.getElementById("stockList").scrollIntoView({ block: "start" }); });
    await sleep(400);
    await p.screenshot({ path: path.join(root, "shot-v11-stock.png") });
  }
  // galla ignores wastage cash
  await goto(p, "Summary");
  assert(/820/.test(await text(p, "#gallaBreakdown")), "v11 waste: wastage is a cost, not cash out of the box (galla unchanged)");
  await goto(p, "Shop");
  await hideToast(p);

  /* ================= 7. Supplier due book ================= */
  await click(p, '#shopSub [data-shop="suppliers"]');
  await p.waitForSelector("#shopSuppliers:not([hidden])");
  await click(p, "#btnSupNew");
  await fillIn(p, "supName", "Milk man");
  await p.evaluate(() => document.getElementById("supNewForm").dispatchEvent(new Event("submit", { cancelable: true, bubbles: true })));
  await sleep(120);
  assert(await visible(p, "#supDetail"), "v11 supplier: detail opens after adding");
  await click(p, "#btnSupBill");
  await fillIn(p, "supTxAmount", "1000");
  await p.evaluate(() => document.getElementById("supTxForm").dispatchEvent(new Event("submit", { cancelable: true, bubbles: true })));
  await sleep(120);
  const eN = (await getEntries(p)).length;
  assert(eN === entW.length, "v11 supplier: a bill creates no expense by itself");
  await click(p, "#btnSupPay");
  await fillIn(p, "supTxAmount", "400");
  await p.evaluate(() => document.getElementById("supTxForm").dispatchEvent(new Event("submit", { cancelable: true, bubbles: true })));
  await sleep(120);
  let sb = await text(p, "#supDetailHead");
  assert(/600/.test(sb), "v11 supplier: balance = 1000 − 400 = 600: " + sb);
  assert(/600/.test(await text(p, "#supTotal")), "v11 supplier: total due shown");
  assert((await getEntries(p)).length === eN, "v11 supplier: an unlinked payment adds no expense entry");
  // linked payment: expense created once, no double count
  await click(p, "#btnSupPay");
  await fillIn(p, "supTxAmount", "100");
  await p.evaluate(() => { document.getElementById("supAsExpense").checked = true; });
  await p.evaluate(() => document.getElementById("supTxForm").dispatchEvent(new Event("submit", { cancelable: true, bubbles: true })));
  await sleep(150);
  const entS = await getEntries(p);
  assert(entS.length === eN + 1 && entS.filter((e) => e.source === "supplier").length === 1, "v11 supplier: linked payment makes exactly one expense");
  sb = await text(p, "#supDetailHead");
  assert(/500/.test(sb), "v11 supplier: balance now 500: " + sb);
  await goto(p, "Summary");
  assert(/820/.test(await text(p, "#gallaBreakdown")) === false, "v11 supplier: cash payments now go out of the galla");
  await goto(p, "Shop");
  if (SHOTS) {
    await p.evaluate(() => { document.getElementById("toast").classList.remove("show"); document.getElementById("supList").scrollIntoView({ block: "start" }); });
    await sleep(500);
    await p.screenshot({ path: path.join(root, "shot-v11-supplier.png") });
  }
  // deleting a supplier payment needs no PIN here (no PIN set) and removes its linked expense
  await p.evaluate(() => { document.querySelector('#supTxList [data-suptxdel]').click(); });
  await sleep(200);
  const entS2 = await getEntries(p);
  assert(entS2.filter((e) => e.source === "supplier").length === 0 && /600/.test(await text(p, "#supDetailHead")), "v11 supplier: deleting the linked payment removes the expense and restores the balance");
  assert(errs.length === 0, "v11: no JS errors: " + errs.join(" | "));
  await p.close();
  await bctx.close();

  /* ================= 8. PIN protects deletes + migration ================= */
  const mctx = await newCtx();
  const merr = [];
  const m = await newPage(mctx, merr);
  await fresh(m, "en");
  await m.evaluate((k) => { const s = JSON.parse(localStorage.getItem(k)); ["auditLog", "deviceName", "galla", "suppliers", "supplierTx", "combos"].forEach((f) => { delete s[f]; }); localStorage.setItem(k, JSON.stringify(s)); }, SETTINGS).catch(() => {});
  await reload(m);
  const sm = await getSettings(m);
  assert(Array.isArray(sm.auditLog) && Array.isArray(sm.suppliers) && Array.isArray(sm.supplierTx) && Array.isArray(sm.combos) && sm.galla && typeof sm.galla === "object", "v11 migration: v10 settings get the new fields");
  await m.close();
  await mctx.close();

  /* ================= 9. Hindi: no Tamil on the new screens ================= */
  const hctx = await newCtx();
  const herr = [];
  const h = await newPage(hctx, herr);
  await fresh(h, "hi");
  await seedEntries(h, [{ type: "income", date: today, item: "Tea cash", amount: 300, payMode: "cash" }]);
  await h.evaluate((k) => { const s = JSON.parse(localStorage.getItem(k)); s.combos = [{ id: "c1", name: "", lines: [{ menuId: "idli", qty: 2 }, { menuId: "tea", qty: 1 }] }]; s.suppliers = [{ id: "s1", name: "Dudh wala", phone: "" }]; s.supplierTx = [{ id: "t1", supplierId: "s1", type: "bill", amount: 100, date: new Date().toISOString().slice(0, 10), note: "", method: "", createdAt: new Date().toISOString() }]; s.galla = {}; localStorage.setItem(k, JSON.stringify(s)); }, SETTINGS);
  await reload(h);
  const tamilIn = (page) => page.evaluate(() => {
    const skip = ".lg-n, #entryList .item, #entryList .meta, #kadanList, #setShopName, #menuEditor, #stockList, #staffList, .person-row .pn, #filterBar, #comboRow .cn, #supList strong, #comboEditor select, #comboEditor input, #wasteItemSel, #topCard, #rollBody li";
    const bad = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const n = walker.currentNode;
      if (!/[\u0B80-\u0BFF]/.test(n.textContent)) continue;
      const el = n.parentElement;
      if (!el || el.closest(skip)) continue;
      const st = getComputedStyle(el);
      if (st.display === "none" || st.visibility === "hidden" || el.getClientRects().length === 0) continue;
      bad.push(n.textContent.trim().slice(0, 40));
    }
    return bad;
  });
  const chk = async (label) => { const t = await tamilIn(h); assert(t.length === 0, "v11 hindi: " + label + " has no Tamil: " + JSON.stringify(t)); };
  await chk("Today with combos");
  await goto(h, "Summary");
  await chk("Summary (galla + 7/30)");
  await goto(h, "Shop");
  await chk("Stock tab");
  await click(h, "#btnWaste");
  await chk("Wastage form");
  await click(h, "#wasteCancel");
  await click(h, '#shopSub [data-shop="suppliers"]');
  await chk("Suppliers list");
  await click(h, '[data-sup="s1"]');
  await click(h, "#btnSupPay");
  await chk("Supplier payment form");
  await click(h, "#navToday");
  await click(h, "#btnSettings");
  await click(h, "#btnAudit");
  await chk("Settings (combos + audit)");
  assert(herr.length === 0, "v11 hindi: no JS errors: " + herr.join(" | "));
  await h.close();
  await hctx.close();
  console.log("v11 browser checks passed");
};
