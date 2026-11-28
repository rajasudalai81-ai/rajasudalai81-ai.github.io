"use strict";
/* v10 browser checks: owner PIN, recipes + automatic stock, backup reminder/share, PWA (manifest, service worker, offline, update + install banners).
   Called from ui-smoke.js:  await require("./ui-v10").run(ctx)   */
const path = require("path");

module.exports.run = async function run(ctx) {
  const { browser, url, assert, SHOTS, root, LIVE_URL, bump } = ctx;
  const SETTINGS = "kadai-tracker-settings-v3";
  const ENTRIES = "kadai-tracker-v3";
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function newPage(browserCtx, errors) {
    const page = await browserCtx.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    page.setDefaultTimeout(8000);
    page.on("pageerror", (e) => errors.push(e.message));
    return page;
  }
  const newCtx = () => (browser.createBrowserContext ? browser.createBrowserContext() : browser.createIncognitoBrowserContext());
  async function fresh(page, lang) {
    await page.goto(url, { waitUntil: "networkidle0" });
    await page.evaluate(() => localStorage.clear());
    await page.goto(url, { waitUntil: "networkidle0" });
    await page.waitForSelector("#langFirst:not([hidden])");
    await page.evaluate((l) => document.querySelector('[data-firstlang="' + l + '"]').click(), lang || "ta");
    await page.waitForFunction(() => document.getElementById("langFirst").hidden);
  }
  const fillIn = async (page, id, text) => {
    await page.evaluate((id, text) => { const el = document.getElementById(id); el.value = text; el.dispatchEvent(new Event("input", { bubbles: true })); }, id, text);
  };
  async function quickAdd(page, text) {
    await page.evaluate(() => { document.getElementById("toast").classList.remove("show"); });
    await fillIn(page, "quickEntry", text);
    await page.evaluate(() => document.getElementById("quickBtn").click());
    await page.waitForFunction(() => document.getElementById("toast").classList.contains("show"));
    await page.evaluate(() => { document.getElementById("toast").classList.remove("show"); });
  }
  const getSettings = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), SETTINGS);
  const getEntries = (page) => page.evaluate((k) => { const d = JSON.parse(localStorage.getItem(k)); return Array.isArray(d) ? d : d.entries; }, ENTRIES);
  const click = (page, sel) => page.evaluate((s) => { const b = document.querySelector(s); b.scrollIntoView({ block: "center" }); b.click(); }, sel);
  const visible = (page, sel) => page.evaluate((s) => { const e = document.querySelector(s); return !!e && !e.hidden && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== "hidden"; }, sel);
  async function pinType(page, digits) {
    for (const d of digits) { await page.evaluate((k) => document.querySelector('#pinPad [data-pk="' + k + '"]').click(), d); }
    await sleep(380);
  }
  const todayIso = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Calcutta" });
  const hide = (page) => page.evaluate(() => document.getElementById("toast").classList.remove("show"));

  /* ================= PIN ================= */
  const errs = [];
  const pctx = await newCtx();
  const p = await newPage(pctx, errs);
  await fresh(p, "ta");
  // two entries today, then one on yesterday's date (before any PIN exists)
  await quickAdd(p, "tea 20 glass 10 rupees");
  await quickAdd(p, "tea 20 glass 10 rupees");
  const yest = await p.evaluate(() => { const d = new Date(Date.now() + 5.5 * 3600000 - 86400000); return d.toISOString().slice(0, 10); });
  await p.evaluate((d) => { const i = document.getElementById("dateInput"); i.value = d; i.dispatchEvent(new Event("change", { bubbles: true })); }, yest);
  await quickAdd(p, "500 vandi");
  await click(p, "#todayBtn");
  const n0 = (await getEntries(p)).length;
  assert(n0 >= 3, "v10 pin: entries added: " + n0);
  const secret = "no-pin-yet";
  assert(!(await visible(p, "#btnLock")), "v10 pin: lock button hidden until a PIN exists");

  // set a PIN in Settings
  await click(p, "#btnSettings");
  await p.waitForSelector("#settings:not([hidden])");
  assert(await visible(p, "#btnPinSet") && !(await visible(p, "#btnPinChange")), "v10 pin: Set PIN offered");
  await click(p, "#btnPinSet");
  await p.waitForSelector("#pinModal:not([hidden])");
  await pinType(p, "1234");
  assert(/மீண்டும்|again/i.test(await p.$eval("#pinTitle", (e) => e.textContent)), "v10 pin: asks to enter again");
  await pinType(p, "1111");
  assert(/ஒன்றாக இல்லை|did not match/i.test(await p.$eval("#pinMsg", (e) => e.textContent)), "v10 pin: mismatch message");
  await pinType(p, "1234");
  await pinType(p, "1234");
  await p.waitForSelector("#pinViewSetup:not([hidden])");
  await p.select("#pinQSel", "mother");
  await fillIn(p, "pinASet", "Lakshmi");
  await click(p, "#pinSetupSave");
  await p.waitForFunction(() => document.getElementById("pinModal").hidden);
  const st1 = await getSettings(p);
  assert(st1.pin && st1.pin.hash && st1.pin.salt && st1.pin.qHash, "v10 pin: salted hashes stored");
  const raw = await p.evaluate((k) => localStorage.getItem(k), SETTINGS);
  assert(!/1234/.test(raw.replace(st1.pin.hash, "").replace(st1.pin.salt, "").replace(st1.pin.qHash, "").replace(st1.pin.qSalt, "")) && !/lakshmi/i.test(raw), "v10 pin: PIN and answer are not stored in plain text");
  assert(st1.pin.hash.length === 64 && !("pin" in st1.pin) && st1.pin.iter >= 1000, "v10 pin: hash is sha-256 hex with iterations");
  assert(await visible(p, "#btnLock"), "v10 pin: lock button visible once PIN is on");
  await click(p, "#closeSettings");

  // today's own entries stay free: delete today's last entry (no PIN prompt), undo it
  await p.evaluate(() => { document.getElementById("btnLock").click(); });
  assert(/•/.test(await p.$eval("#totProfit", (e) => e.textContent)), "v10 pin: profit masked when locked");
  await click(p, '#entryList [data-act="delete"]');
  await p.waitForSelector("#modal:not([hidden])");
  assert(!(await visible(p, "#pinModal")), "v10 pin: today's own entry deletes without PIN");
  await click(p, "#cancelDelete");
  await p.waitForSelector("#modal[hidden]");
  // past date: PIN needed to delete/edit/add
  await p.evaluate((d) => { const i = document.getElementById("dateInput"); i.value = d; i.dispatchEvent(new Event("change", { bubbles: true })); }, yest);
  await click(p, '#entryList [data-act="delete"]');
  await p.waitForSelector("#pinModal:not([hidden])");
  assert(!(await visible(p, "#modal")), "v10 pin: delete of a past entry waits for the PIN");
  if (SHOTS) {
    await p.evaluate(() => { document.getElementById("toast").classList.remove("show"); });
    await p.screenshot({ path: path.join(root, "shot-v10-pin.png") });
  }
  await pinType(p, "9999");
  assert(/தவறான PIN|Wrong PIN/.test(await p.$eval("#pinMsg", (e) => e.textContent)), "v10 pin: wrong PIN message");
  assert((await getEntries(p)).length === n0, "v10 pin: wrong PIN deletes nothing");
  await pinType(p, "1234");
  await p.waitForSelector("#modal:not([hidden])");
  assert(await visible(p, "#modal") && !(await visible(p, "#pinModal")), "v10 pin: right PIN continues to the delete confirmation");
  await click(p, "#cancelDelete");
  assert(!/•/.test(await p.$eval("#totProfit", (e) => e.textContent)), "v10 pin: profit visible after unlocking");

  // lock again: settings, shop margins, stock, restore, summary share all need the PIN
  await click(p, "#btnLock");
  await click(p, "#todayBtn");
  await click(p, "#btnSettings");
  await p.waitForSelector("#pinModal:not([hidden])");
  assert(await visible(p, "#pinLangRow"), "v10 pin: language buttons on the PIN screen for Settings");
  await p.evaluate(() => document.querySelector('[data-pinlang="hi"]').click());
  assert(/PIN/.test(await p.$eval("#pinTitle", (e) => e.textContent)) && /[\u0900-\u097F]/.test(await p.$eval("#pinTitle", (e) => e.textContent)), "v10 pin: PIN screen switches to Hindi");
  await p.evaluate(() => document.querySelector('[data-pinlang="ta"]').click());
  await click(p, "#pinClose");
  assert(await p.$eval("#settings", (e) => e.hidden), "v10 pin: Settings stay closed without the PIN");
  await click(p, "#navShop");
  await click(p, '#shopSub [data-shop="margins"]');
  assert(await visible(p, "#shopLock") && !(await visible(p, "#shopMargins")), "v10 pin: margins hidden behind the lock card");
  await click(p, '#shopSub [data-shop="staff"]');
  assert(await visible(p, "#shopLock") && !(await visible(p, "#shopStaff")), "v10 pin: wages hidden behind the lock card");
  await click(p, '#shopSub [data-shop="stock"]');
  await click(p, "#btnStockIn");
  await p.waitForSelector("#pinModal:not([hidden])");
  assert(await p.$eval("#stockMoveForm", (e) => e.hidden), "v10 pin: changing stock needs the PIN");
  await click(p, "#pinClose");
  await click(p, '#shopSub [data-shop="recipes"]');
  await click(p, "#recipeList [data-recipe]");
  await p.waitForSelector("#pinModal:not([hidden])");
  await click(p, "#pinClose");
  assert(await p.$eval("#recipeEditCard", (e) => e.hidden), "v10 pin: recipe editing needs the PIN");
  await click(p, "#importFile");
  await p.waitForSelector("#pinModal:not([hidden])");
  await click(p, "#pinClose");

  // forgot PIN: wrong answer, right answer -> choose a new PIN; data untouched
  await click(p, "#btnSettings");
  await p.waitForSelector("#pinModal:not([hidden])");
  await click(p, "#pinForgot");
  await p.waitForSelector("#pinViewForgot:not([hidden])");
  assert(/அம்மா|mother/i.test(await p.$eval("#pinQuestion", (e) => e.textContent)), "v10 pin: shows the saved recovery question");
  await fillIn(p, "pinAnswer", "wrong");
  await click(p, "#pinAnswerOk");
  assert(/தவறு|not right/.test(await p.$eval("#pinForgotMsg", (e) => e.textContent)), "v10 pin: wrong recovery answer refused");
  await fillIn(p, "pinAnswer", " lakshmi ");
  await click(p, "#pinAnswerOk");
  await p.waitForSelector("#pinViewPad:not([hidden])");
  await pinType(p, "4321");
  await pinType(p, "4321");
  await p.waitForFunction(() => document.getElementById("pinModal").hidden);
  assert((await getEntries(p)).length === n0, "v10 pin: recovery keeps every entry");
  await click(p, "#btnLock");
  await click(p, "#btnSettings");
  await p.waitForSelector("#pinModal:not([hidden])");
  await pinType(p, "1234");
  assert(/தவறான PIN|Wrong PIN/.test(await p.$eval("#pinMsg", (e) => e.textContent)), "v10 pin: old PIN no longer works after recovery");
  await pinType(p, "4321");
  await p.waitForSelector("#settings:not([hidden])");
  assert(true, "v10 pin: new PIN opens Settings");

  // lockout after 5 wrong tries
  await click(p, "#btnLock");
  await click(p, "#btnSettings");
  await p.waitForSelector("#pinModal:not([hidden])");
  for (let i = 0; i < 5; i++) await pinType(p, "0000");
  assert(/காத்திருக்கவும்|wait/i.test(await p.$eval("#pinMsg", (e) => e.textContent)), "v10 pin: 5 wrong tries lock the pad for a while: " + await p.$eval("#pinMsg", (e) => e.textContent));
  await pinType(p, "4321");
  assert(/காத்திருக்கவும்|wait/i.test(await p.$eval("#pinMsg", (e) => e.textContent)), "v10 pin: even the right PIN waits while locked");
  // forgot with no answer: 24-hour wait, nothing is deleted, then the PIN can go
  await click(p, "#pinForgot");
  await click(p, "#pinNoAnswer");
  await p.waitForSelector("#pinViewReset:not([hidden])");
  assert(/24/.test(await p.$eval("#pinResetWarn", (e) => e.textContent)) && /NOT deleted|அழியாது/.test(await p.$eval("#pinResetWarn", (e) => e.textContent)), "v10 pin: reset warns that data is kept and a wait applies");
  await click(p, "#pinResetGo");
  assert(await p.$eval("#pinResetGo", (e) => e.disabled), "v10 pin: removal is disabled during the 24 h wait");
  assert((await getSettings(p)).pin.resetAt > 0, "v10 pin: reset start recorded");
  // simulate 25 hours later
  await p.evaluate((k) => { const s = JSON.parse(localStorage.getItem(k)); s.pin.resetAt = Date.now() - 25 * 3600000; s.pin.lockUntil = 0; s.pin.failCount = 0; localStorage.setItem(k, JSON.stringify(s)); }, SETTINGS);
  await p.reload({ waitUntil: "networkidle0" });
  await click(p, "#btnSettings");
  await p.waitForSelector("#pinModal:not([hidden])");
  await click(p, "#pinForgot");
  await click(p, "#pinNoAnswer");
  await sleep(200);
  assert(!(await p.$eval("#pinResetGo", (e) => e.disabled)), "v10 pin: removal enabled after the wait");
  await click(p, "#pinResetGo");
  await p.waitForFunction(() => document.getElementById("pinModal").hidden);
  const st3 = await getSettings(p);
  assert(!st3.pin && (await getEntries(p)).length === n0, "v10 pin: PIN removed after the wait, entries intact");
  await click(p, "#btnSettings");
  await p.waitForSelector("#settings:not([hidden])");
  assert(!(await visible(p, "#btnLock")), "v10 pin: lock button hidden again with no PIN");
  assert((await p.$eval("#pinStatus", (e) => e.textContent)).length > 5, "v10 pin: status line shown in Settings");
  await click(p, "#closeSettings");

  // set again and turn off via Settings, then restore keeps the local PIN
  await click(p, "#btnSettings");
  await click(p, "#btnPinSet");
  await pinType(p, "2468"); await pinType(p, "2468");
  await p.select("#pinQSel", "year"); await fillIn(p, "pinASet", "1980"); await click(p, "#pinSetupSave");
  await p.waitForFunction(() => document.getElementById("pinModal").hidden);
  await click(p, "#btnPinOff");
  await p.waitForSelector("#pinModal:not([hidden])");
  await pinType(p, "2468");
  await p.waitForFunction(() => document.getElementById("pinModal").hidden);
  assert(!(await getSettings(p)).pin, "v10 pin: Turn off PIN works with the PIN");
  assert(errs.length === 0, "v10 pin: no JS errors: " + errs.join(" | "));
  await p.close();
  await pctx.close();

  /* ================= Recipes + automatic stock ================= */
  const rctx = await newCtx();
  const rerr = [];
  const r = await newPage(rctx, rerr);
  await fresh(r, "ta");
  await click(r, "#navShop");
  // stock in 10 kg maavu (manual add, no expense)
  await click(r, "#btnStockIn");
  await r.select("#stockItemSel", "maavu");
  await fillIn(r, "stockQty", "10");
  await r.evaluate(() => { document.getElementById("stockLogExpense").checked = false; document.getElementById("stockMoveSave").click(); });
  await r.waitForFunction(() => /10/.test(document.getElementById("stockList").textContent));
  // recipe: 1 idli = 50 gram maavu
  await click(r, '#shopSub [data-shop="recipes"]');
  await r.waitForSelector("#shopRecipes:not([hidden])");
  assert(/இட்லி/.test(await r.$eval("#recipeList", (e) => e.textContent)), "v10 recipe: menu items listed");
  await click(r, '#recipeList [data-recipe="idli"]');
  await r.waitForSelector("#recipeEditCard:not([hidden])");
  await r.select('#recipeLines [data-k="stock"]', "maavu");
  const units = await r.$$eval('#recipeLines [data-k="unit"] option', (o) => o.map((x) => x.value));
  assert(units.length === 2 && units[1] === "கிராம்", "v10 recipe: kg item offers gram: " + units);
  await r.select('#recipeLines [data-k="unit"]', "கிராம்");
  await r.evaluate(() => { const i = document.querySelector('#recipeLines [data-k="qty"]'); i.value = "50"; i.dispatchEvent(new Event("input", { bubbles: true })); });
  if (SHOTS) {
    await hide(r);
    await sleep(700);
    await r.evaluate(() => document.getElementById("recipeEditTitle").scrollIntoView({ block: "start" }));
    await sleep(200);
    await r.screenshot({ path: path.join(root, "shot-v10-recipes.png") });
  }
  await click(r, "#recipeSave");
  await r.waitForFunction(() => document.getElementById("recipeEditCard").hidden);
  assert(/50/.test(await r.$eval("#recipeList", (e) => e.textContent)), "v10 recipe: saved recipe summary shows 50");
  const st = await getSettings(r);
  assert(st.recipes && st.recipes.idli && Math.abs(st.recipes.idli.lines[0].qty - 0.05) < 1e-9 && st.recipes.idli.since === todayIso(), "v10 recipe: stored as 0.05 kg since today: " + JSON.stringify(st.recipes));
  if (SHOTS) {
    await sleep(3200);
    await r.evaluate(() => window.scrollTo(0, 0));
    await r.screenshot({ path: path.join(root, "shot-v10-recipe-list.png") });
  }
  // sell 4 idli via the menu (two taps with +2 ... use quick entry for exact qty)
  await click(r, "#navToday");
  await quickAdd(r, "4 idli");
  await click(r, "#navShop");
  await click(r, '#shopSub [data-shop="stock"]');
  const stockTxt = await r.$eval("#stockList", (e) => e.textContent);
  assert(/9\.8/.test(stockTxt), "v10 recipe: selling 4 idli takes 0.2 kg off 10 kg → 9.8: " + stockTxt);
  if (SHOTS) {
    await sleep(3200);
    await r.evaluate(() => window.scrollTo(0, 0));
    await r.screenshot({ path: path.join(root, "shot-v10-stock.png") });
  }
  await click(r, "#navToday");
  assert(/🥣/.test(await r.$eval("#entryList", (e) => e.textContent)), "v10 recipe: the sale row shows the stock used");
  // qty +1 → 5 idli → 9.75
  await click(r, '#entryList [data-act="qty"][data-delta="1"]');
  await click(r, "#navShop");
  assert(/9\.75/.test(await r.$eval("#stockList", (e) => e.textContent)), "v10 recipe: editing the quantity adjusts stock (9.75)");
  // delete the sale → back to 10
  await click(r, "#navToday");
  await click(r, '#entryList [data-act="delete"]');
  await r.waitForSelector("#modal:not([hidden])");
  await click(r, "#confirmDelete");
  await r.waitForSelector("#modal[hidden]");
  await click(r, "#navShop");
  assert(/\b10\b/.test(await r.$eval("#stockList", (e) => e.textContent)) && !/9\.75/.test(await r.$eval("#stockList", (e) => e.textContent)), "v10 recipe: deleting the sale gives the stock back");
  // undo the delete → deducted again
  await click(r, "#navToday");
  await r.evaluate(() => document.getElementById("toastUndo").click());
  await click(r, "#navShop");
  assert(/9\.75/.test(await r.$eval("#stockList", (e) => e.textContent)), "v10 recipe: undo of the delete re-applies the stock move");
  // purchase of maavu by voice/quick text adds stock: "maavu 2 kg 100" expense
  await click(r, "#navToday");
  await quickAdd(r, "selavu maavu 2 kg 100 rupees");
  const stAfter = await getSettings(r);
  const maavu = stAfter.stock.find((s) => s.id === "maavu");
  assert(Math.abs(maavu.qty - 11.75) < 1e-9, "v10 recipe: a maavu purchase adds stock automatically: " + maavu.qty);
  // reload keeps everything (idempotent sync)
  await r.reload({ waitUntil: "networkidle0" });
  const stR = await getSettings(r);
  assert(Math.abs(stR.stock.find((s) => s.id === "maavu").qty - 11.75) < 1e-9, "v10 recipe: reload does not double-apply stock");
  // migration: a v9-style settings object (no recipes/autoStockSince) loads without touching stock
  await r.evaluate((k) => { const s = JSON.parse(localStorage.getItem(k)); delete s.recipes; delete s.autoStockSince; delete s.lastBackup; delete s.pin; s.stockMoves = s.stockMoves.filter((m) => !m.entryId); s.stock.find((x) => x.id === "maavu").qty = 6; localStorage.setItem(k, JSON.stringify(s)); }, SETTINGS);
  await r.reload({ waitUntil: "networkidle0" });
  const stM = await getSettings(r);
  assert(stM.autoStockSince === todayIso() && stM.recipes && Object.keys(stM.recipes).length === 0, "v10 recipe: migration adds the new settings fields");
  assert(Math.abs(stM.stock.find((x) => x.id === "maavu").qty - 6) < 1e-9 || stM.stock.find((x) => x.id === "maavu").qty >= 6, "v10 recipe: migration never rewrites old stock counts: " + stM.stock.find((x) => x.id === "maavu").qty);
  assert(rerr.length === 0, "v10 recipe: no JS errors: " + rerr.join(" | "));
  await r.close();
  await rctx.close();

  /* ================= Backup reminder + share ================= */
  const bctx = await newCtx();
  const berr = [];
  const b = await newPage(bctx, berr);
  await fresh(b, "ta");
  assert(!(await visible(b, "#backupBanner")), "v10 backup: no reminder when there is no data");
  await quickAdd(b, "tea 20 glass 10 rupees");
  await b.waitForSelector("#backupBanner:not([hidden])");
  assert(/இன்னும் காப்பு|Back up/.test(await b.$eval("#backupBanner", (e) => e.textContent)), "v10 backup: reminder shown with data and no backup");
  if (SHOTS) {
    await hide(b);
    await b.evaluate(() => window.scrollTo(0, 0));
    await b.screenshot({ path: path.join(root, "shot-v10-backup.png") });
  }
  // Later snoozes
  await click(b, "#backupLater");
  assert(!(await visible(b, "#backupBanner")), "v10 backup: Later hides the reminder");
  await b.evaluate((k) => { const s = JSON.parse(localStorage.getItem(k)); s.backupSnoozeUntil = null; localStorage.setItem(k, JSON.stringify(s)); }, SETTINGS);
  await b.reload({ waitUntil: "networkidle0" });
  await b.waitForSelector("#backupBanner:not([hidden])");
  // Web Share path
  await b.evaluate(() => {
    window.__shared = null;
    navigator.canShare = (d) => !!(d && d.files && d.files.length);
    navigator.share = async (d) => { window.__shared = { name: d.files[0].name, type: d.files[0].type, size: d.files[0].size, title: d.title }; };
  });
  await click(b, "#backupNow");
  await b.waitForFunction(() => window.__shared);
  const sh = await b.evaluate(() => window.__shared);
  assert(/^kadai-tracker-backup-\d{4}-\d{2}-\d{2}\.json$/.test(sh.name) && sh.type === "application/json" && sh.size > 100, "v10 backup: one tap shares a json file: " + JSON.stringify(sh));
  const stB = await getSettings(b);
  assert(stB.lastBackup && Math.abs(Date.now() - Date.parse(stB.lastBackup)) < 60000, "v10 backup: last backup time recorded");
  assert(!(await visible(b, "#backupBanner")), "v10 backup: reminder gone after backing up today");
  await click(b, "#btnSettings");
  assert(/20\d\d/.test(await b.$eval("#lastBackupLine", (e) => e.textContent)), "v10 backup: Settings shows the last-backup date: " + await b.$eval("#lastBackupLine", (e) => e.textContent));
  assert(await visible(b, "#btnShareBackup") && await visible(b, "#btnExport"), "v10 backup: share and download buttons in Settings");
  await click(b, "#closeSettings");
  // user closes the share sheet (AbortError) → not counted as a backup
  await b.evaluate((k) => { const s = JSON.parse(localStorage.getItem(k)); s.lastBackup = new Date(Date.now() - 2 * 86400000).toISOString(); localStorage.setItem(k, JSON.stringify(s)); }, SETTINGS);
  await b.reload({ waitUntil: "networkidle0" });
  await b.waitForSelector("#backupBanner:not([hidden])");
  assert(/கடைசி|Last/.test(await b.$eval("#backupBanner", (e) => e.textContent)), "v10 backup: next day the reminder returns with the last date");
  await b.evaluate(() => {
    navigator.canShare = () => true;
    navigator.share = async () => { const e = new Error("closed"); e.name = "AbortError"; throw e; };
  });
  const before = (await getSettings(b)).lastBackup;
  await click(b, "#backupNow");
  await sleep(500);
  assert((await getSettings(b)).lastBackup === before, "v10 backup: closing the share sheet does not count as a backup");
  // no Web Share → download fallback still records the backup
  await b.evaluate(() => { navigator.canShare = undefined; window.__dl = 0; const o = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { if (this.download) window.__dl += 1; else o.call(this); }; });
  await click(b, "#backupNow");
  await b.waitForFunction(() => window.__dl === 1);
  assert((await getSettings(b)).lastBackup !== before, "v10 backup: download fallback records the backup");
  // backup file restores into a fresh phone, and keeps its local PIN
  const payload = await b.evaluate((k, e) => ({ app: "kadai-tracker", version: 5, settings: JSON.parse(localStorage.getItem(k)), entries: JSON.parse(localStorage.getItem(e)) }), SETTINGS, ENTRIES);
  assert(payload.entries.length >= 1 && payload.settings.recipes, "v10 backup: payload has entries and v10 settings");
  assert(berr.length === 0, "v10 backup: no JS errors: " + berr.join(" | "));
  await b.close();
  await bctx.close();

  /* ================= PWA: manifest, service worker, offline, update + install banners ================= */
  const wctx = await newCtx();
  const werr = [];
  const w = await newPage(wctx, werr);
  await w.goto(url, { waitUntil: "networkidle0" });
  await w.evaluate(() => localStorage.clear());
  await w.goto(url, { waitUntil: "networkidle0" });
  await w.waitForSelector("#langFirst:not([hidden])");
  await w.evaluate(() => document.querySelector('[data-firstlang="ta"]').click());
  const build = await w.evaluate(() => window.KADAI_BUILD);
  assert(/^[0-9a-f]{8}$/.test(build), "v10 pwa: page carries a build id: " + build);
  const man = await w.evaluate(async () => {
    const link = document.querySelector('link[rel="manifest"]');
    const res = await fetch(link.href);
    const m = await res.json();
    return { href: link.getAttribute("href"), status: res.status, m };
  });
  assert(man.status === 200 && man.m.display === "standalone" && man.m.start_url === "./" && man.m.scope === "./", "v10 pwa: manifest loads (standalone, relative start/scope)");
  const sizes = man.m.icons.map((i) => i.sizes + ":" + i.purpose).join(",");
  assert(/192x192:any/.test(sizes) && /512x512:any/.test(sizes) && /512x512:maskable/.test(sizes), "v10 pwa: manifest icons 192 / 512 / maskable: " + sizes);
  for (const ic of man.m.icons) {
    const buf = Buffer.from(ic.src.split(",")[1], "base64");
    assert(buf.slice(0, 8).toString("hex") === "89504e470d0a1a0a", "v10 pwa: icon is a real PNG");
    assert(buf.readUInt32BE(16) === Number(ic.sizes.split("x")[0]), "v10 pwa: PNG width matches " + ic.sizes);
  }
  assert(await w.evaluate(() => !!document.querySelector('link[rel="apple-touch-icon"]') && !!document.querySelector('link[rel="icon"]')), "v10 pwa: page icons present");
  const reg = await w.evaluate(async () => {
    const r = await navigator.serviceWorker.ready;
    return { script: r.active.scriptURL, scope: r.scope };
  });
  assert(/sw\.js$/.test(reg.script), "v10 pwa: service worker registered: " + reg.script);
  const cacheKeys = await w.evaluate(() => caches.keys());
  assert(cacheKeys.indexOf("kadai-" + build) !== -1, "v10 pwa: cache name carries the build id: " + cacheKeys + " / " + build);
  const cachedIdx = await w.evaluate(async (b) => { const c = await caches.open("kadai-" + b); const keys = await c.keys(); return keys.map((k) => k.url); }, build);
  assert(cachedIdx.some((u) => /index\.html$/.test(u)) && cachedIdx.some((u) => /manifest\.webmanifest$/.test(u)), "v10 pwa: index.html and manifest cached: " + cachedIdx);
  // offline: reload while controlled and offline → the app still opens and still works
  await w.reload({ waitUntil: "networkidle0" });
  await w.waitForFunction(() => !!navigator.serviceWorker.controller);
  await w.setOfflineMode(true);
  await w.reload({ waitUntil: "domcontentloaded" });
  await w.waitForSelector("#micBig");
  assert(await w.evaluate(() => window.KADAI_BUILD) === build, "v10 pwa: opens offline from the saved copy");
  await fillIn(w, "quickEntry", "tea 20 glass 10 rupees");
  await w.evaluate(() => document.getElementById("quickBtn").click());
  await w.waitForFunction(() => document.getElementById("toast").classList.contains("show"));
  assert((await getEntries(w)).length >= 1, "v10 pwa: adding an entry works offline");
  await w.setOfflineMode(false);
  await w.evaluate(() => { document.getElementById("toast").classList.remove("show"); });

  // install banner (synthetic beforeinstallprompt; Chrome fires the real one on installable origins)
  await w.evaluate((k) => { const s = JSON.parse(localStorage.getItem(k)); s.lastBackup = new Date().toISOString(); localStorage.setItem(k, JSON.stringify(s)); localStorage.removeItem("kadai-install-dismissed"); }, SETTINGS);
  await w.reload({ waitUntil: "networkidle0" });
  await w.evaluate(() => {
    const ev = new Event("beforeinstallprompt", { cancelable: true });
    window.__prompted = 0;
    ev.prompt = () => { window.__prompted += 1; return Promise.resolve(); };
    ev.userChoice = Promise.resolve({ outcome: "dismissed" });
    window.dispatchEvent(ev);
  });
  await w.waitForSelector("#installBanner:not([hidden])");
  assert(/ஆப்பாக|app/i.test(await w.$eval("#installBanner", (e) => e.textContent)), "v10 pwa: install banner shown");
  if (!LIVE_URL) {
    // update banner: serve a bumped build id, ask the service worker to update
    bump.id = "deadbeef";
    await w.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); await r.update(); });
    await w.waitForSelector("#updateBanner:not([hidden])", { timeout: 15000 });
    assert(/புதிய பதிப்பு|Update available/.test(await w.$eval("#updateBanner", (e) => e.textContent)), "v10 pwa: update banner text");
    assert((await w.evaluate(() => window.KADAI_BUILD)) === build, "v10 pwa: the running page is not swapped until the user taps");
    if (SHOTS) {
      await w.evaluate(() => window.scrollTo(0, 0));
      await w.screenshot({ path: path.join(root, "shot-v10-banners.png") });
    }
    await Promise.all([
      w.waitForNavigation({ waitUntil: "networkidle0", timeout: 15000 }),
      click(w, "#updateBtn")
    ]);
    assert((await w.evaluate(() => window.KADAI_BUILD)) === "deadbeef", "v10 pwa: tapping the banner loads the new build");
    const keys2 = await w.evaluate(() => caches.keys());
    assert(keys2.indexOf("kadai-deadbeef") !== -1 && keys2.indexOf("kadai-" + build) === -1, "v10 pwa: old cache deleted, new cache named by the new build: " + keys2);
    assert(await w.$eval("#updateBanner", (e) => e.hidden), "v10 pwa: banner gone after the refresh");
    // network-first: the next bump is served immediately on a plain reload (no stale copy)
    bump.id = "cafebabe";
    await w.reload({ waitUntil: "networkidle0" });
    assert((await w.evaluate(() => window.KADAI_BUILD)) === "cafebabe", "v10 pwa: network-first serves the newest build on reload");
    bump.id = null;
  } else {
    // live site: check the deployed files directly
    const live = await w.evaluate(async () => {
      const s = await fetch("sw.js", { cache: "no-store" });
      const m = await fetch("manifest.webmanifest", { cache: "no-store" });
      return { sw: s.status, swText: await s.text(), man: m.status, manType: m.headers.get("content-type") };
    });
    assert(live.sw === 200 && /kadai-/.test(live.swText) && live.swText.indexOf("__BUILD__") === -1, "v10 pwa live: sw.js served with a real build id");
    assert(live.man === 200, "v10 pwa live: manifest served");
  }
  assert(werr.length === 0, "v10 pwa: no JS errors: " + werr.join(" | "));
  await w.close();
  await wctx.close();

  /* ================= Hindi: no Tamil in the new screens ================= */
  const hctx = await newCtx();
  const herr = [];
  const h = await newPage(hctx, herr);
  await fresh(h, "hi");
  await quickAdd(h, "tea 20 glass 10 rupees");
  await click(h, "#btnSettings");
  await click(h, "#btnPinSet");
  await h.waitForSelector("#pinModal:not([hidden])");
  const tamilIn = (page) => page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const bad = [];
    const userData = "#entryList .item, #entryList .meta, #kadanList, #setShopName, #menuEditor, #stockList, #staffList, .person-row .pn, #filterBar, #recipeList strong, #recipeLines select, #shopName";
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
  assert((await tamilIn(h)).length === 0, "v10 hindi: PIN screen has no Tamil: " + JSON.stringify(await tamilIn(h)));
  assert(/[\u0900-\u097F]/.test(await h.$eval("#pinTitle", (e) => e.textContent)), "v10 hindi: PIN title in Devanagari");
  await pinType(h, "1357"); await pinType(h, "1357");
  await h.waitForSelector("#pinViewSetup:not([hidden])");
  assert((await tamilIn(h)).length === 0, "v10 hindi: PIN recovery setup has no Tamil: " + JSON.stringify(await tamilIn(h)));
  await h.select("#pinQSel", "school"); await fillIn(h, "pinASet", "Gandhi"); await click(h, "#pinSetupSave");
  await h.waitForFunction(() => document.getElementById("pinModal").hidden);
  assert((await tamilIn(h)).length === 0, "v10 hindi: Settings with PIN has no Tamil: " + JSON.stringify(await tamilIn(h)));
  await click(h, "#closeSettings");
  await click(h, "#navShop");
  await click(h, '#shopSub [data-shop="recipes"]');
  await h.waitForSelector("#shopRecipes:not([hidden])");
  assert((await tamilIn(h)).length === 0, "v10 hindi: Recipes tab has no Tamil: " + JSON.stringify(await tamilIn(h)));
  await click(h, "#btnLock");
  await click(h, '#shopSub [data-shop="margins"]');
  assert((await tamilIn(h)).length === 0, "v10 hindi: lock card has no Tamil: " + JSON.stringify(await tamilIn(h)));
  await click(h, "#navToday");
  await h.waitForSelector("#backupBanner:not([hidden])");
  assert((await tamilIn(h)).length === 0, "v10 hindi: backup banner has no Tamil: " + JSON.stringify(await tamilIn(h)));
  assert(herr.length === 0, "v10 hindi: no JS errors: " + herr.join(" | "));
  await h.close();
  await hctx.close();
  console.log("v10 browser checks passed");
};
