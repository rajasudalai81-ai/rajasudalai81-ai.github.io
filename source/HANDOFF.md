# Kadai Tracker – Project Handoff (Nov 28, 2026) — v11 (5 s undo + audit log, galla check, supplier due book, min-stock + wastage, 7/30-day summary, combo tiles)

## What this is
A Tamil-first (bilingual Tamil + English) sales and expense tracker web app for a family roadside idli/dosa/tea stall in the Mumbai area. Users are family members and workers who are not tech-savvy, on Android phones. Main problem it solves: at end of day nobody knows the clear total sales.

Typed input is the primary, most reliable path. Voice is a secondary extra and typing never depends on it.

## Files
- `logic.js`, `app.js`, `index.src.html`, `i18n.js` — **single source**. Change these, then run `node build.js`.
- `i18n.js` (v7) — Hindi + Marathi UI text, keyed by the English string used in `app.js` (`P/H/S/TL` helpers) and in the static `.en` spans of `index.src.html`. A unit test fails if any English key lacks `hi` or `mr`.
- `build.js` — inlines `i18n.js`, `logic.js` and `app.js` into `index.src.html` and writes `index.html`; **v10:** also writes `sw.js` (from `sw.src.js`) and `manifest.webmanifest` (from `manifest.src.json`), stamps one 8-hex build id into all of them and inlines the icons as `data:` URIs. Uses string slice (not `String.replace`) so `$&` inside `logic.js` is not corrupted.
- `index.html` — the full app in ONE file. Open it in Chrome; nothing else needed. Do not edit the inlined scripts by hand.
- `tests/` — unit tests (`node tests/run.js`) and a headless Chrome UI smoke test (`node tests/ui-smoke.js`, which also runs `tests/ui-v10.js` and `tests/ui-v11.js`; `node tests/ui-smoke.js --only-v11` runs just the v11 checks).
- `sw.src.js`, `manifest.src.json`, `icons/*.png`, `tools/make-icons.py` — v10 PWA sources (`python3 tools/make-icons.py` regenerates the PNG icons; needs Pillow).
- `kadai-tracker-full.zip` — project zip (Python `zipfile`; the `zip` CLI is not available). Does not include `DEPLOY.json` (claim tokens) or `shot-*.png` (sample-data screenshots only, not shipped).
- Data stays compatible with localStorage key `kadai-tracker-v3` (settings: `kadai-tracker-settings-v3`). Older entries without `payMode` still load as cash. Shop data (stock, staff, wages, stock moves, menu `costPrice`) is stored inside settings. If this phone already ran Raja’s Phase 2 HTML, stock/staff are migrated from `kadai-tracker-stock-v2` / `kadai-tracker-staff-v2`.

## Live link (permanent, v11)
**https://rajasudalai81-ai.github.io/** — GitHub Pages, repo `rajasudalai81-ai/rajasudalai81-ai.github.io`, branch `main`, root files `index.html`, `sw.js`, `manifest.webmanifest`, `.nojekyll`, `README.md` + `source/`. **v11 pushed 28 Nov 2026 (IST)**, v10 before it — live files byte-identical to the local build (`cmp`), smoke test passed against the live URL (see the GitHub commit list for SHAs). To update: `node build.js`, then push `index.html`, `sw.js`, `manifest.webmanifest` (and `source/` copies) with the GitHub connector `push_files`; the build id changes automatically so phones get the update banner. **v9 (voice fix) pushed 23 Nov 2026, 9:48 AM IST (commit `4ccdc99`)**; live file byte-identical to the local build (`cmp`), UI smoke test passed against the live URL. v8 pushed 19 Nov 2026 (commit `4bbe488`)**; the live file was byte-identical to the local build (`cmp`) and the UI smoke test passed against the live URL. v7 was pushed 18 Nov 2026 (commit `e94768e`); the live file was byte-identical to the local build (`cmp`) and the UI smoke test passed against the live URL. To update: `node build.js`, then push `index.html` to that repo (GitHub connector `push_files`).

## Older live links (ship.page, temporary hosting)
- v1: https://utopian-house-l98o3.ship.place/ (claimed on Raja's ship.page account, older version). Updating this same slug needs a ship.page API key (`sp_...`); without it, POST `/deploy/utopian-house-l98o3` returns HTTP 401 `auth_required`.
- v2: https://sweet-success-u43kz.ship.place/ (bilingual + stall features).
- v3: https://royal-tomato-01z2y.ship.place/ (Phase 1 voice/qty/build-script fixes). Expires 21 Nov 2026, 5:26 PM IST (Asia/Calcutta) unless claimed.
- v4: https://grave-plain-7b4f8.ship.place/ (Phase 2 shop management on top of v3). Deployed 14 Nov 2026, 5:38 PM IST. Expires 21 Nov 2026, 5:38 PM IST (Asia/Calcutta) unless claimed.
- v5 first drop (UI redesign; Tamil rendered as heavy blobs on some systems because weight 800/900 fell through to the Oi display font): https://mutual-citizen-72u76.ship.place/ — deployed 18 Nov 2026, 12:01 PM IST. Expires 25 Nov 2026, 12:01 PM IST (Asia/Calcutta) unless claimed.
- v5 font-fix drop: https://cotton-option-jyemt.ship.place/ — deployed 18 Nov 2026, 12:05 PM IST. Expires 25 Nov 2026, 12:05 PM IST (Asia/Calcutta) unless claimed.
- **v6 (latest — paired spend/earn phrases, minimized Today UI, inline SVG tiles):** https://lacy-taurus-haq94.ship.place/ — deployed 18 Nov 2026, 12:29 PM IST (Asia/Calcutta). Expires **25 Nov 2026, 12:29 PM IST (Asia/Calcutta)** unless claimed. New anonymous drop because no ship.page API key was available (same-slug update of the claimed v1 still returns 401).

Claim URL: (removed from the published copy — kept by Raja only)

## Screenshots (v6, 390×844, sample data only — not in the zip)
Taken 18 Nov 2026, 12:29 PM IST (Asia/Calcutta). Sample entries and stock quantities were seeded only in the headless browser; they are not shipped in `index.html`. Tamil is clean and readable (weights ≤ 700, no Oi blobs). Menu and tab icons are inline SVGs, not emoji.
- Today, **from the top of the page** so the totals card is visible, plus the giant பேசு mic, the type box, the + Add control, and SVG menu tiles (இட்லி / தோசை / வடை): `/workspace/kadai-tracker/shot-today.png`
- Voice confirmation for a paired deal `30 kazhi 50 varudhu`, showing செலவு ₹30, வரவு ₹50, **லாபம் ₹20**, and the big green ✓ சேமி button: `/workspace/kadai-tracker/shot-voice-confirm.png`
- Shop tab (Stock / Margins / Staff, stock list with மாவு 12 and பால் 6): `/workspace/kadai-tracker/shot-shop.png`


## v11 (Nov 28, 2026) — undo + audit log, galla check, supplier due, min-stock + wastage, 7/30-day summary, combos
Everything new lives in Shop / Summary / Settings. Today only gains one thin row of combo buttons, and only if you set some up. Data is additive: a new `migrateV11` adds the fields below to old settings and never wipes anything.
New settings fields: `auditLog[]` (newest first, max 500), `deviceName`, `galla{ "YYYY-MM-DD": {opening, actual} }` (pruned to 120 days), `suppliers[]`, `supplierTx[]`, `combos[]` (max 3). Stock items keep `minAlert`; wastage is a stock move with `reason`.

1. **Undo (5 s) + audit log.** The Undo toast now lasts exactly **5 s** (`UNDO_MS = 5000`, was 8 s) with a thin countdown bar. One tap on Undo reverses the whole save: multi-line voice / quick entries (`removeMany`), quick menu taps, and combos (`multi`). Stock follows automatically because stock sync is a reconcile (`syncAutoStock`): edit, delete and undo all roll the recipe stock back (verified by tests). **Audit log** — Settings → "Edit & delete log" (Settings already needs the PIN when one is set), read only: edit (changed fields old → new), delete, restore (undo of a delete), mark-paid; each with date, time (IST) and the **device / person name** (Settings → "This phone / person name"; empty = no name). Scope decision: form edits, deletes, mark-paid and restore are logged; the qty +/- stepper is logged only for entries from past dates (today's quick fixes are free and would flood the log); creating entries is not logged.
2. **Galla (cash box) check** — Summary tab. Opening cash is entered once per day (yesterday's actual is offered with one tap). **Expected = Opening + cash sales + credit repaid in cash that day − cash expenses − supplier payments paid in cash.** Choices: only `payMode = cash` counts; UPI and credit sales/expenses never count; **kadan repayments** count when marked paid as *Cash* (the mark-paid dialog now asks Cash / UPI; old data and "UPI" are handled — `creditPaidVia`, default cash, on the local IST day of `creditPaidAt`); **staff wages / advances and stock purchases** are normal cash expenses so they come out of the box; **wastage** is a non-cash cost so it does not. Enter the actual cash to see **Short ₹x / Extra ₹x / matches**. The WhatsApp daily summary gets a "Cash box" block (opening, expected, actual, short/extra) in the chosen language when anything was entered.
3. **Supplier due book** — Shop → Suppliers; completely separate from customer kadan. Suppliers (name, phone), **bills** (what you owe) and **payments** (cash / UPI / bank), balance per supplier and total due; a negative balance shows as advance. Deleting a supplier or a transaction needs the PIN (same gate as stock). **No double counting:** bills are memo only and never become expenses. A payment is *not* an expense by default (you may have logged the purchase already; an unlinked cash payment is simply cash out in the galla). Tick "Also log as an expense" to create one expense entry linked to the payment (`source: "supplier"`, cash/UPI) — profit counts it once, the galla counts it once (via the entry), and deleting the payment removes the linked expense. Linked payments are never counted again as supplier cash.
4. **Min stock + wastage** — Shop → Stock. Each item has an "Alert when stock is at or below" level (✏️ Change, PIN-gated like other stock edits). Low items get a red **LOW** badge there, the existing yellow low-stock banner, and a small red dot on the Shop tab only (nothing added to Today). **Wastage**: "Wastage" button → item, quantity, reason (spoiled / leftover / spilled / other), optional loss ₹ (pre-filled from the last purchase price of that item). Stock goes down (may go negative: the count may just be behind). **Profit treatment (decision):** a loss amount creates one expense entry flagged `nonCash` (`source: "waste"`), so it **reduces profit** but is **not cash out of the galla**, and no stock move is created from it (so it is not deducted twice). Leave the loss empty when you already logged the purchase as an expense — the wasted stock was then already paid for. Recent wastage is listed with a delete button (PIN) that restores the stock and removes the cost entry.
5. **7 / 30-day summary** — Summary tab, "Last 7 / 30 days": total sales, total expenses, net profit (masked like the rest when the PIN hides profit), a small per-day sales bar chart and the top-selling items; ending on the date being viewed. Credit sales count as sales on their sale date (same as the rest of the app).
6. **Combo tiles** — Settings → "Combo buttons": up to 3 combos, each a name (optional; empty = "2 Idli + Tea") plus lines of menu item × count. On Today they show as one compact row of buttons (hidden when none) with the menu-price total; one tap logs every line as a cash sale at the current menu prices (merging into today's matching line, like the menu tiles), deducts recipe stock, and shows the 5 s Undo that reverses the whole combo. No separate combo price (decision: keep prices in the menu only). Lines whose menu item was deleted are dropped.

Languages: every new string has Tamil + English and Hindi + Marathi entries in `i18n.js` (the completeness unit test covers them); Hindi/Marathi screens show no Tamil in the smoke test.

### Tests (v11)
- `node tests/run.js` → **2138 passed, 0 failed** (v10's 1907 untouched + v11: audit diff/records, galla figures incl. kadan and supplier cash, rolling summary, suppliers, min-stock, wastage, combos, migration, built-file checks, i18n).
- `node tests/ui-smoke.js` → passes locally; new `tests/ui-v11.js` covers: 5 s undo (still undoable at 4 s, gone by ~5.8 s), one-tap undo of a two-line quick entry, combo editor (max 3), combo tap + recipe stock + undo (whole combo, only last tap), audit edit/delete/restore/mark-paid with device name and read-only view, galla (expected 740, Short/Extra, WhatsApp text, Cash/UPI mark-paid, yesterday's carry-over), 7/30-day totals and top list, min-stock LOW badge + Shop dot, wastage (stock, cost prefill, nonCash entry), supplier bill/payment/balance, linked payment = exactly one expense, delete restores, v10→v11 settings migration, Hindi without Tamil on the new screens.

### Screenshots (v11, 390×844, test data only — not in the zip)
`shot-v11-galla.png`, `shot-v11-supplier.png`, `shot-v11-weekly.png`, `shot-v11-combos.png`, plus `shot-v11-settings.png` (combo editor), `shot-v11-audit.png`, `shot-v11-stock.png` (LOW badge, wastage list). Written to `/workspace/kadai-tracker/` by local smoke runs.

### v11 limits (honest)
- The audit log is local to this phone like all data (shared with the backup JSON); anyone who knows the PIN can read it, and it cannot prove who held the phone — "who" is just the device/person name typed in Settings. Older edits (before v11) are not in it.
- The galla check is as good as the entries: cash sales logged as UPI, forgotten expenses or cash taken out without an entry show up as Short. Opening cash is typed, not carried automatically (only offered).
- Supplier book has no due dates, reminders or per-bill matching; a payment lowers the total balance only.
- Wastage with an empty loss only reduces stock (no profit effect); with a loss it is a profit cost but not cash.
- Combos use menu prices; they only log cash sales (tap-and-edit afterwards for UPI/credit).
- Firebase / online sync is **not** part of v11 (data is still only on the phone — backup reminder from v10 applies).

## v10 (Nov 28, 2026) — owner PIN, offline app, automatic stock, backup reminder
Built from the two AI audits Raja approved (no PIN, no PWA, stock not auto-deducted, manual backup). All v9 features unchanged; Tamil-first UI with English under everything, Hindi + Marathi for every new string.

**1. Owner PIN (Settings → Owner PIN).** Optional 4-digit PIN. When on, these ask for it: Settings, backup restore, changing stock (add / use / new item), editing recipes, seeing profit (Today profit tile and Summary show `₹ ••••` and tap-to-unlock), Shop → Margins and Staff/wages (replaced by a lock card), sharing the day summary to WhatsApp (it contains profit), marking credit paid, **editing/deleting past entries** and **adding entries to a past date**. Not needed: today's own new entries (dated today *and* created today) — add, edit, delete, undo, quantity +/−, voice and typing all stay free. Unlock lasts 3 minutes of use (sliding), the 🔒 header button locks at once, and the app locks again if it was in the background for more than a minute.
- Storage: `settings.pin` = `{salt, hash, iter, q, qSalt, qHash, failCount, lockUntil, resetAt}`; salted, iterated (2000×) SHA-256 in pure JS (verified against Node `crypto` in tests; works on plain http too). The PIN and the recovery answer are never stored in plain text.
- Wrong tries: 5 free, then the pad locks for 30 s, doubling each round up to 15 min.
- **Forgot PIN (no data is ever lost):** (a) answer the recovery question chosen when the PIN was set (4 questions, 4 languages) → choose a new PIN; (b) no answer → "Start the 24-hour wait" (warning screen says entries/stock/settings are kept); after 24 h the PIN can be removed. A correct PIN cancels a pending reset. Restoring a backup keeps this phone's own PIN.
- The language buttons are on the PIN screen shown for Settings, so a worker can still change language while locked.
- **Honest limit:** it is a deterrent for family/workers, not bank security. Everything lives in `localStorage` on the phone; someone with Chrome devtools / a rooted phone can read or edit it, and "clear site data" wipes the app *and* the PIN (that is why the backup reminder exists).

**2. Installable offline app (PWA).** `manifest.webmanifest` (standalone, `start_url`/`scope` `./` so it works under the GitHub Pages root), icons 192, 512 and maskable 512, `sw.js`.
- Service worker is **network-first**: only same-origin GETs of the app page (folder URL / `index.html`) and `manifest.webmanifest` are handled; every request is revalidated (`cache: "no-cache"`), 4 s timeout, then the saved copy is used (offline). Everything else — Google speech, other origins, `sw.js` itself — is never touched, so voice cannot be broken by the worker (unit test runs the worker in a sandbox and checks this).
- Never stale forever: cache name is `kadai-<build>` where the build id is a hash of everything that ships; old `kadai-*` caches are deleted on activate; no `skipWaiting` on install. When a new version is installed behind a running page (or the page's own build-id check sees a different build) a green banner says **"புதிய பதிப்பு தயார் — தட்டி புதுப்பிக்கவும் / Update available — tap to refresh"**; tapping sends `SKIP_WAITING` and reloads once. Page checks for updates on open, when the app returns to the foreground and every 30 min.
- Install banner from Chrome's `beforeinstallprompt` (dismiss remembered 7 days; hidden while the backup banner is showing so the screen stays free).
- Icons are also **inlined as `data:` URIs** in the manifest and `<link rel=icon>` because the GitHub push tool cannot upload binary files; the real PNGs are in `icons/` in the zip/local folder (`python3 tools/make-icons.py`).
- Root files on the site: `index.html`, `sw.js`, `manifest.webmanifest`, `.nojekyll`, `README.md`, `source/`.

**3. Stock auto-deduct (Shop → செய்முறை / Recipes).** Per menu item: ingredient + quantity per one item sold (kg items can be entered in gram, litre in ml). Stored in `settings.recipes = {menuId: {since, lines:[{stockId, qty}]}}` (qty in the stock item's base unit).
- Selling deducts; the Today row shows "🥣 மாவு −0.05 கிலோ". `L.syncAutoStock` **reconciles** all managed stock moves (those with `entryId` + `auto:true`) against the entries after every save, so add, edit, quantity +/−, delete, **undo**, restore and unit changes all stay consistent and a reload never double-counts. Manual "Use stock" moves are never touched.
- Purchases: voice/typed expenses naming a stock item with a compatible unit (kg↔gram, dozen→count; aliases such as maavu/flour/atta, milk, sugar, tea powder, oil, gas) add stock; deleting/editing the expense reverses/adjusts. Expenses created from the stock screen are linked to their stock move (`entry.stockMoveId`), so deleting that expense also removes the stock-in.
- **Migration:** `L.migrateV10` on load adds `recipes:{}`, `autoStockSince` (= day of first v10 launch), `lastBackup`, `backupSnoozeUntil`, `pin:null`. Old sales are never deducted retroactively: a recipe counts only sales dated on/after its `since` (the day it was first saved; editing keeps it), purchases only on/after `autoStockSince`. Existing stock counts are not rewritten.
- Stock can go negative (shown red with "add your real stock") — sales never get blocked.

**4. Backup safety.** Daily banner (not backed up *today*, there is data; "Later" snoozes 4 h) → **one tap** builds the backup JSON and uses the Web Share API with a file (WhatsApp / Drive / Gmail on Chrome Android); if sharing is unavailable it downloads. Closing the share sheet does not count as a backup. `settings.lastBackup` (ISO) is shown in Settings ("கடைசி காப்பு / Last backup", Asia/Kolkata) with buttons "Share or save backup" and the old "Download backup". Backup file version is 5 (includes recipes/last backup; the PIN hash is part of settings in the file).

**Tests (v10).** `node tests/run.js` → 1907 checks (1636 old + v10 logic, i18n completeness for every new string, SW/manifest consistency, SW sandbox). `node tests/ui-smoke.js` → old flows + `tests/ui-v10.js`: PIN (set, mismatch, wrong/right PIN, gating of settings/stock/recipes/restore/margins/wages/past entries, language on PIN screen, recovery answer, lockout, 24 h reset, turn off), recipes (deduct, qty edit, delete, undo, purchase, reload idempotence, migration), backup (banner, share file, AbortError, download fallback, last-backup line), PWA (manifest + PNG icons, SW registered, cache named by build, offline reload + offline entry, install banner, update banner with a bumped build served by the test server, tap → new build + old cache deleted, network-first on reload; against the live URL it checks `sw.js`/manifest instead), Hindi screens free of Tamil.

**Known limits (v10).** 4-digit PIN = deterrent only (see above). SW needs https (GitHub Pages is) and a first online visit; iPhone Safari has no install banner (Share → Add to Home Screen) and no file Web Share on old iOS. Web Share with a file works on Chrome Android only. Auto-in only for expenses whose item name matches a stock item. A recipe needs a stock item with a known unit; units must be of the same family. No cloud sync yet — the backup file is the only copy off the phone.

## v9 voice fix (Nov 23, 2026)
Raja: “VOICE WORK AGA MATUKU” — voice stopped working on his Android Chrome after v8.

### Root cause
v8 opened a **second microphone stream** (`getUserMedia` with echoCancellation / noiseSuppression / autoGainControl, plus an `AudioContext` level meter) at the same moment as `SpeechRecognition.start()`, and the setting was **ON by default**. On Android Chrome only one capture can own the mic: recognition then gets `audio-capture`, or silence and ends with no result. On first use, two permission requests (getUserMedia + speech) also raced. The v8 “retry without the meter” only ran if the meter stream had already been created, so the common case (the error arrives before getUserMedia resolves) just stopped with “could not capture audio”. In addition, the no-speech countdown (5.5 s) started at the tap, so a first-use permission prompt could time out before the mic even opened, and the v8 hold-mode quick tap stopped after ~450 ms.

### What changed
- Voice is the v7 path again: **SpeechRecognition only. `app.js` contains no `getUserMedia` or `AudioContext` call** (unit test checks the source and the built `index.html`; the smoke test mocks `getUserMedia` and asserts it is never called).
- The noise filter / real meter is removed. The optional **sound pulse** (Settings → Voice, **default OFF**, key `micPulse`) is a CSS animation driven only by the recognition’s own `onaudiostart / onsoundstart / onspeechstart / onspeechend` events.
- **One-time migration** (`voiceFixV9` flag): every phone that saved v8 settings gets the meter off (`noiseFilter` dropped, `micPulse:false`) and **tap mode**; later choices (e.g. Hold) are kept.
- **Tap mode is the default.** Hold mode no longer breaks tapping: a press shorter than 600 ms behaves like a normal tap (keeps listening, stops on silence; tap again to stop); a long press stops on release.
- Visible state line above the transcript: “மைக் திறக்கிறது… Chrome அனுமதி கேட்டால் Allow / Opening the mic… tap Allow” → “🔴 கேட்கிறேன்… / Listening… speak now” → “🔴 கேட்கிறது / Hearing you…”, with a pulsing ring on the mic. Interim words show live; after stop the box shows “கேட்டது / Heard: …”.
- **Bilingual error for every onerror code** (Tamil/Hindi/Marathi + English line): `not-allowed` (steps: 🔒 in the address bar → Permissions → Microphone → Allow, or Chrome ⋮ → Settings → Site settings → Microphone → this site → Allow, then reload), `service-not-allowed` (update Chrome / Google voice typing / not Incognito), `audio-capture` (another app such as a call or WhatsApp voice is using the mic), `network`, `no-speech`, `language-not-supported`, plus `no-start` (mic never opened in 20 s). `aborted` (our own stop) is silent. A read-only `navigator.permissions.query({name:"microphone"})` shows the allow-steps at once if the site is blocked (it never opens the mic).
- Permission-safe timers: the 5.5 s no-speech countdown starts when the mic actually opens (`onstart/onaudiostart`), not at the tap; a first-use permission prompt gets up to 20 s.
- `new SpeechRecognition()`, its setup and `start()` are in try/catch (an exception shows the error and resets the button); any old recognition is aborted before a new one; `onresult` is guarded.
- Language: `rec.lang` is `ta-IN / en-IN / hi-IN / mr-IN` for the Tamil / English / Hindi / Marathi modes (or the voice-language chip), checked in the smoke test.
- `maxAlternatives = 5` and the best-alternative pick are kept (they don’t touch the mic).

### Tests (v9)
- Unit: **1636 passed, 0 failed** (+ v9: no getUserMedia/AudioContext in app.js or index.html, start() in try/catch, every error code in 4 languages with the allow-steps, error-code mapping, permission-safe timeout logic incl. hold, speech language per mode).
- UI smoke (local + live): **passed**. New mocked-SpeechRecognition page: migration of v8 settings (meter off, tap), default tap path saves “tea 20 glass 10 rupees” = ₹200 picking the best of two alternatives, listening/hearing states and interim + heard text, `getUserMedia` and `AudioContext` called **0** times, `maxAlternatives` 5, `continuous`, `rec.lang` per mode, each error (not-allowed, service-not-allowed, audio-capture, network, no-speech) shows its bilingual message, a throwing `start()` is handled, a 6.5 s first-use permission prompt does not fail, hold-mode quick tap and press-and-hold both save, no JS errors.
- Screenshots: `/workspace/kadai-tracker/shot-v9-listening.png`, `/workspace/kadai-tracker/shot-v9-mic-error.png` (mock data, not in the zip).

### Limits
- A headless mock cannot prove real Android audio; it proves the app no longer opens a second mic stream and handles every event/error path. Raja should reload the page once (or close and reopen the installed app) so the new version loads.
- If Chrome previously got a “Block” for the mic on this site, voice stays blocked until it is allowed in site settings — the new message gives the steps.

## v8 (Nov 19, 2026)
Raja tested v7 on Android (Tamil voice note): the header showed the Hindi shop name in Tamil mode and the date was cut off; he wants the language buttons to say Tamil/English plainly, kg quantities (“20 கிலோ தக்காளி ஆயிரம் ரூபா” = ₹1000, not 20×1000), add/subtract/multiply/divide in Tamil, Hindi and Marathi slang, better hearing in a noisy shop, and money given to people (a worker, a named person) to show in the list at once.

### Bug fix: shop name / date line
- Root cause: Settings pre-fills the shop name in the current language. Opening Settings in Hindi, switching to Tamil, then Save stored the Hindi default as if typed. Now **any of the four default names** (ta/en/hi/mr) counts as “default”, so the header always follows the language; only a name the user really typed is kept as typed. Phones that already stored the Hindi default are fixed automatically on load (no data change needed). Switching language with Settings open refreshes the field.
- The date line wraps instead of being cut with “…”.

### Settings
- Language buttons: `தமிழ் / Tamil`, `English`, `हिंदी / Hindi`, `मराठी / Marathi`. Every Settings item has the small English line under it in Tamil/Hindi/Marathi (menu editor fields included).
- New Voice section: **Tap to talk** (default) or **Hold to talk**, and **Noise filter + sound level meter** (on by default), with the tip “hold the phone close to your mouth”.

### Units and quantity
- Entries have qty + unit (kg, gram, litre, packet, dozen, piece, glass), recognised in Tamil, Tanglish, Hindi, Marathi and English (`கிலோ/kilo/किलो`, `கிராம்/gram/ग्राम/ग्रॅम`, `லிட்டர்/litre/लीटर`, `பாக்கெட்/packet/पैकेट/पाकीट`, `டஜன்/dozen/दर्जन/डझन`, `பீஸ்/pcs/नग`…).
- `qty + unit + amount` → the amount is the **total** (“20 கிலோ தக்காளி ஆயிரம் ரூபா” = expense ₹1000, qty 20 kg, ₹50/kg). A per-unit rate multiplies: “கிலோ 50 ரூபா”, “50 rupay kilo”, “₹50 per kg”, “kilo ka 40” (even in the next comma part).
- Purchases (tomato, onion, potato, milk, sugar, tea powder, eggs…) default to expense; menu items (tea, idli…) keep the old sale/price logic (`tea 20 glass 10 rupees` = ₹200).
- “ஒரு கிலோ தக்காளி” (no price) opens the form with the qty and kg already chosen; the form has unit chips (கிலோ kg, கிராம் gram, லிட்டர் litre, பொட்டலம் packet, டஜன் dozen, எண்ணம் piece, கிளாஸ் glass).
- The list shows “20 கிலோ (kg) × ₹50”; CSV has `QtyUnit`, `Category`, `Calc` columns; the WhatsApp summary lists purchases with kg.

### Spoken arithmetic (4 languages + slang)
- × : `into, times, x, ×, பெருக்கு, பெருக்கல், guna, गुणा, गुणिले, पट`; ÷ : `divide, வகு, வகுத்தல், bhaag, भाग, भागिले`; + : `plus, கூட்டு, சேர்த்து, jod, जोड, बेरीज, अधिक`; − : `minus, கழி (between numbers), ghata, घटा, वजा, उणे`.
- “50 into 3 tea” = ₹150 sale (qty 3 × ₹50); “200 plus 300 podu” = income ₹500; “500 கழி 120 selavu” = expense ₹380. The toast and the list row show the calculation (“🧮 50 × 3 = ₹150”).
- A sentence with only math (“1000 வகு 4”) shows a **calculator card** (1000 ÷ 4 = ₹250) with Save as income / Save as expense; nothing is saved until a button is tapped.

**Operator precedence (decided, documented):**
1. A spend/earn pair phrase (“30 kazhi 50 varudhu”) is checked first in each part and stays a pair (v6 behaviour).
2. Separators split first (comma, and/um/aur/ani…), so “add 20000 and minus 500” = two entries (+20000, −500).
3. An operator word **directly between two numbers** is arithmetic; × and ÷ before + and − (“100 plus 50 into 2” = 200). So “add 20000 minus 500” = one income of ₹19,500, and “500 கழி 120” alone = calculator card (380).
4. Add/subtract verbs that are not math words (`podu, போடு, add` at the start, `selavu`) are never operators, so “20000 podu 5000 kazhi” stays two entries.
5. For menu sale items the old price-closeness logic still decides price vs qty; for other items a number before a unit word is the qty and the other number is the total.
6. Payments to people are detected after math.
7. A name alone is not credit and not a payment.

### Money to / from people
- Paid out → expense with the person’s name, category “கொடுத்தது / Paid to”, visible at once in Today: “ஒருத்தனுக்கு பத்தாயிரம் கொடுத்தேன்”, “முருகனுக்கு 350 கொடுத்தேன்”, “muruganukku / murugan ukku 350 kuduthen”, “Ravi ko 400 diye”, “रवीला 400 दिले”, “paid Ravi 400”.
- Worker / wage / advance words (வேலைக்காரன், worker, naukar, कर्मचारी, கூலி, पगार, advance…) → category wage (கூலி / முன்பணம்).
- If the name matches a staff member in Shop → Staff (fuzzy, e.g. “murugen” → Murugan), or a wage word is used and there is only one staff member, the payment is **also recorded in that staff member’s wage book**. Undo removes both.
- Received: “ரவி எனக்கு 500 கொடுத்தான்”, “Ravi ne 300 diya”, “got 300 from Ravi”, “रवीने 300 दिले” → income “பெற்றது / Received from”.
- Several in one sentence (with or without commas) → one row each.
- **By person** card on Today and Summary: given / received / credit per name; tap a name to filter Today’s list to that person (“✕ Show all” clears). Names typed before are matched fuzzily so spellings stay consistent.

### Noisy shop (voice)
- `maxAlternatives = 5`: the app keeps Chrome’s alternative transcripts and picks the one that parses into the most sensible entries (amount, known item, unit), not just the first.
- Hold to talk: press and hold the mic, release to stop; no silence auto-stop while held.
- ~~A separate mic stream with noise constraints drove a live level meter.~~ **Removed in v9 — it broke voice on Android (see v9).**
- Misheard item words are fixed to the nearest known item (“tomatto” → tomato) by edit distance.

### v8 limits (honest)
- Chrome’s speech recognition on Android uses its **own** microphone capture; the noise-suppression constraints apply to the meter stream and may not change what Google hears. The real gains in a crowd are: phone close to the mouth, Hold to talk, and picking the best of 5 alternatives.
- Marathi speech recognition is weaker than Tamil/Hindi; iPhone still has no voice (typing works).
- Fuzzy fixing only covers known item and person names; an unknown item said wrongly is saved as heard (Edit/Undo).
- Tamil dative names (“-க்கு”) are found by suffix rules plus a block list of non-person words (பில், கரண்ட், வீடு…); a new non-person word may be read as a name once.
- The same person in two scripts (“Ravi” and “ரவி”) shows as two rows in By person.
- Arithmetic follows the precedence above; a phrase like “add 20000 minus 500” is one entry of 19,500 (say “and” to get two entries).

### Screenshots (v8, 390×844, headless test data only — not in the zip)
- Settings in Tamil (bilingual language buttons, Voice section): `/workspace/kadai-tracker/shot-v8-settings-ta.png`
- 20 கிலோ தக்காளி ₹1,000 row with “20 கிலோ (kg) × ₹50”: `/workspace/kadai-tracker/shot-v8-kg.png`
- Calculator card for “1000 வகு 4”: `/workspace/kadai-tracker/shot-v8-math.png`
- Payments: filtered to one person + By person card: `/workspace/kadai-tracker/shot-v8-people.png`

## v7 (Nov 18, 2026)
Raja’s Tamil voice note: voice asked for options twice; “20000 போடு” should add, “கழி” should subtract, a name said with an entry should be saved with it, several items in one sentence should work, and he wants Hindi, Marathi and English modes with small English text under everything in the non-English modes.

### Direct save — no confirm step
- Voice and the type box now **save immediately**. A toast lists what was saved (`+₹100 டீ ×10 · 👤 ரவி`, `−₹30 செலவு`, margin for pairs) with **Undo** (8 s, removes everything from that sentence) and **Edit** (one entry → opens the edit form; several → highlights the rows to tap ✏️).
- The editable sheet appears **only when no amount can be read** (e.g. `somethingweird`).
- New parser `parseCommand(text, {menu})` in `logic.js` (old `parseUtterance(s)` / `parsePairDeal` are unchanged and still tested):
  - Add words: போடு / podu / add / varavu / வரவு / डालो / जोड़ो / जमा / टाका / घाला / आया …
  - Minus words: கழி / kazhi / minus / selavu / செலவு / खर्च / घटाओ / दिया / वजा / काढा …; `minus 50 discount` keeps the old negative adjustment.
  - Names: `ரவி பேருக்கு`, `Ravi peruku`, `Ravi ke naam`, `Ravi ka/ko`, `रवीच्या नावावर`, `रवीचे / रवीला`. The name is saved in `customerName` and shown in the list (👤), edit form, CSV and the WhatsApp summary (“By name” section). A name alone stays **cash**; it becomes **credit (kadan book)** only with a credit word (கடன் / kadan / udhaar / उधार / उधारी / likh do / எழுது).
  - Multi-entry: splits on commas and on and / um / அப்புறம் / aur / और / ani / आणि, and also on repeated name markers or item+amount groups when people speak without pauses (the owner’s exact two-name sentence saves 2 rows).
  - Numbers: Tamil compound/colloquial words (இருபதாயிரம், அம்பது, நூத்தம்பது, லெட்சம்), Hindi (सौ, हजार, बीस, पचास, डेढ़, ढाई, “दो सौ”), Marathi (शंभर, दोनशे, दीडशे, पन्नास, वीस), romanized Hindi/Marathi (sau, hazaar, pachas, shambhar), Devanagari digits, `20 हजार`, `20k`.
  - Paired phrases (`30 ரூவா கழி 50 ரூவா வருது`) still save both sides and show லாபம் ₹20.

### Language mode (Tamil / English / Hindi / Marathi)
- First-run picker (big 4-button overlay) and a Language section in Settings ⚙. Stored as `settings.lang`; existing users simply see the picker once — no data change or migration needed (old settings without `lang` load fine).
- Switches every label, button, tile, caption, toast, error, form, modal, Shop/Credit/Summary text, date format, placeholders, and the WhatsApp summary text (`daySummaryTextLang`).
- Sets speech recognition to `ta-IN` / `en-IN` / `hi-IN` / `mr-IN` (the mic language toggle also has हिंदी and मराठी).
- Tamil, Hindi and Marathi show a **small English subtitle** under every label; English mode shows English only. Item names are stored in Tamil (unchanged data) and translated only for display (`itemLabel`).
- Devanagari-safe font stack (Noto Sans Devanagari, Mukta, Hind, then system), weights still capped at 700.

### Screenshots (v7, 390×844, headless test data only — not in the zip)
- Today in Tamil: `/workspace/kadai-tracker/shot-v7-today-ta.png`
- Today in Hindi (Devanagari labels + English subtitles): `/workspace/kadai-tracker/shot-v7-today-hi.png`
- Toast after the owner’s two-name sentence (Saved ✓ (2), +₹100 டீ · 👤 ரவி, +₹50 வடை · 👤 குமார், Edit / Undo): `/workspace/kadai-tracker/shot-v7-multi-toast.png`

### v7 limits
- **Marathi speech (`mr-IN`)** in Chrome is noticeably weaker than Tamil/Hindi; Marathi speakers may get better results with हिंदी recognition or typing. Typed Marathi parses fine.
- Still the browser Web Speech API; iPhone/Safari voice is unsupported (type instead).
- A single small number with a menu item is read as a quantity (≤ 20, e.g. `5 idli`) and a bigger one as the amount (`100 tea` = ₹100). Say “rupees/ரூபா/रुपये” to force an amount.
- “one hundred and fifty tea” (English words with “and”) reads as 100 × 50; use digits or “150”.
- Stored item names stay Tamil; the menu editor’s first field is still the Tamil/local name.

## v6 (Nov 18, 2026)
Raja’s review of v5: features and voice are good; next he wants natural stall talk like “30 ரூவா கழி 50 ரூவா வருது” saved as both a spend and a sale in one step, a slimmer Today screen (speak once, tap once to save), and clearer pictures instead of emoji.

### Paired spend/earn phrases
One spoken or typed sentence can become **two ledger entries saved together**: an expense (what went out) and a sale (what came in), with the margin shown as **லாபம் ₹N**.

Examples that parse this way:
- `30 ரூவா கழி 50 ரூவா வருது`
- `30 ரூபாய் போச்சு 50 வந்துச்சு`
- `30 pochu 50 vandhuchu`
- `thakkali 30 ku vaangi 50 ku vithen`

Tamil and Tanglish verb forms: கழி, கழிச்சு, போச்சு, போனது, வாங்கினேன், வாங்கி, kazhi, pochu, vaangi; வருது, வந்துச்சு, வித்தேன், varudhu, vandhuchu, vithen. Currency words include ரூவா / ரூபாய் / ruva. `கழிவு` (discount) is **not** treated as a pair. `5 idli 3 tea` and `தக்காளி 3 கிலோ 90` stay as they were. If no item is named, the two rows are labelled செலவு / வரவு; if an item is named (தக்காளி, onion, …) both rows use that item. Data keys are unchanged (`kadai-tracker-v3`); these are ordinary income and expense rows.

### Minimized Today UI (first principles)
Daily work is “speak once, tap once to save.”
- Today = totals card + **one giant centered mic (பேசு)** + a single type box + picture menu tiles.
- Sale / Expense manual forms sit behind a small **+ / மேலும்** control. All previous features stay reachable (tabs, gear, forms, Shop).
- **Voice = 2 taps:** mic, then the confirm card’s big green **✓ சேமி** (auto-focused). Edit and Cancel are small secondary actions.
- **Menu tile sale = 1 tap** (adds qty 1) with a 5-second Undo toast. Long-press a tile to reveal 1/2/5/10 chips, then tap a chip to add that many.
- IDs used by tests (`#btnIncome`, `#btnExpense`, `#micBig`, `#qtyPick`, `#confirmSave`, …) are kept.

### Inline SVG illustrations
Emoji tiles were replaced with self-contained inline SVGs (no network): இட்லி, தோசை, வடை, பொங்கல், டீ, காபி, plus icons for income, expense, Today, Credit, Shop/stock, and Summary. Flat style, readable at small size, drawn for the light/warm theme. Tamil-safe font stack and weight cap at 700 are unchanged.

## v5 UI redesign (Nov 18, 2026)
Raja tested v4: it works, but the UI needed to be much nicer and easier for non-tech shop people. v5 is a visual/UX redesign only. **No features were removed. Data keys and entry shape are unchanged** (`kadai-tracker-v3` / `kadai-tracker-settings-v3`).

- Warm stall theme (cream paper `#F3E6D0` / `#FFFBF4`, dark ink `#1C120C`), high contrast for sunlight, rounded cards, subtle shadows, consistent spacing. Tuned for 360–412px wide phones.
- **Tamil-safe font stack** (no webfont network request): `"Noto Sans Tamil", "Noto Sans Tamil UI", "Hind Madurai", "Catamaran", "Mukta Malar"`, then known system Tamil UI fonts (`Nirmala UI`, `Latha`, `Tamil MN`, `Tamil Sangam MN`), then `system-ui, sans-serif`. Generic families (`ui-sans-serif`, a bare `sans-serif`) are never placed ahead of a real Tamil UI font — on some systems that picked a display face like **Oi** for Tamil at heavy weights, which rendered as unreadable blobs. All `font-weight: 800` / `900` in `index.src.html` and `app.js` are capped at **700**.
- Bilingual labels kept: Tamil large, English small underneath.
- **Today screen:** one totals card at the top (வரவு green / செலவு red / லாபம் blue when positive, red when negative) with large numbers; payment split line; compact low-stock alert; three huge primary buttons — **+ வரவு (Sale)**, **− செலவு (Expense)**, **🎤 பேசு (Speak)**; one-line parse box; picture-style quick-menu tiles (இட்லி 🍘, தோசை 🥞, வடை 🧆, பொங்கல் 🥣, டீ 🍵, காபி ☕) with price on each; qty 1/2/5/10 as big chips plus − / +; today’s entries as simple cards (item, tags, qty, large amount, ✏️ / 🗑️).
- **Bottom navigation** with 4 large icon+label tabs: இன்று Today, கடன் Credit, கடை Shop, சுருக்கம் Summary. Settings is a gear icon in the header (not a fifth tab). Tab *ids* and JS hooks are unchanged; only visual order/layout changed.
- **Forms open as bottom sheets.** Inputs are at least 18px with 56px touch targets. Number fields use `inputmode="decimal"` (not `type=number`) so Tamil number words still work. Advanced fields (bulk rate, vehicle, adjustment/note) are collapsed under **மேலும் / More**, which sits in the sticky sheet footer with payment chips and Save so it is never covered. More auto-expands when bulk, vehicle, note, or a negative amount is already set, and when the சரிகட்டு chip is used.
- **Toast:** after save, `சேமிக்கப்பட்டது ✓`. After a confirmed delete, `அழிக்கப்பட்டது / Deleted` with an **Undo** action for 5 seconds (re-adds the same entry id). The bilingual delete confirm dialog is still required first.
- CSS must hide author `display:flex` panels when the `hidden` attribute is set: `.sheet[hidden], .confirm[hidden], … { display: none !important; }`. Without this, an invisible sale sheet intercepts taps.

## Features
All v3 and v4 features are kept.

### v3 (still here)
- Bilingual labels everywhere: Tamil on top, small English under.
- Sales (வரவு) and expenses (செலவு); qty, unit (kg / kilo / gram / litre / glass / plate / packet…), unit price, bulk-rate calculator, vehicle number, required note on minus amounts.
- Tamil and Tanglish number words, including v3.1 aliases adopted in v4: padhimoonu, padhinaalu, padhinanju, embadhu, naappadhu, iruvathu, ombadhu.
- Wider stall vocabulary (idli/itli/iddly, dosai/thosai, vadai, chaya, kaapi, paal, maavu, tomato/thakkali, vengayam, gas/diesel/petrol, vithadhu, vaangunadhu, selavu, kuduthen, varavu, …).
- Edit/delete with Tamil confirm; daily totals always recomputed; week (Mon–Sun) and month; top-selling; one-line and voice entry with confirmation (never auto-saves); editable transcript; uncertainty markers; voice initial ~5.5 s timeout, restart cap 3, bilingual errors including iPhone/Safari “please type”.
- Quick menu qty 1 / 2 / 5 / 10 and +/−; multi-item lines like `5 idli 3 tea` in one confirmation card.
- Payment cash / UPI / credit (கடன்) and kadan book; WhatsApp eod summary; CSV; JSON backup/restore.

### Phase 2 shop management (from v4, still here)
Kept on a **கடை / Shop** tab so the Today screen stays simple. Three sections inside: Stock, Margins, Staff.

- **Stock:** default items மாவு, பால், வாயு சிலிண்டர், சக்கரை, டீ தூள், எண்ணெய் (qty, unit, low-stock threshold). Add stock (purchase) can optionally also log an expense; Use/reduce stock does not. Custom items can be added. Low-stock alerts (qty ≤ threshold) for items that have actually been tracked; a compact banner also appears on the main totals area (tap it to open Stock).
- **Item margins:** each menu item has a making/ingredient cost per unit (defaults from the Phase 2 file: idli ₹3.5, dosa ₹12, vada ₹5, pongal ₹12, tea ₹4, coffee ₹6; legacy menus without a cost get these by item id). Shows unit profit and %; and today’s profit from sales after ingredient cost (qty × cost vs sale amount). Costs are editable on this tab and in Settings.
- **Staff wages:** staff list with daily and weekly rates. Record daily wage, weekly wage, or advance. Paid wages and advances are ledger expenses and therefore included in செலவு / profit. Unpaid wage entries increase பாக்கி (balance owed to staff) until paid. Advances reduce the balance (negative means the staff member still has advance outstanding).

## What was taken from Raja’s two HTML files (v4, still applies)
### v3.1 file (similar to our v3, likely ChatGPT/Gemini from our code)
Compared against our v3. Our v3 was already more complete (multi-item parse, uncertainty markers, restart cap, bilingual error box, +/− qty, build script). Adopted only genuine extras:
- Extra Tanglish number-word aliases: `padhimoonu` (13), `padhinaalu` (14), `padhinanju` (15), `embadhu` (80), `naappadhu` (40), `iruvathu` (20), `ombadhu` (9).
- Confirmation hint wording: “edit if misheard”.
Not adopted from v3.1 (would have been a step backwards): the simplified parser, toast-only voice errors, no restart cap, no multi-item “5 idli 3 tea”, no uncertainty highlighting, no +/− qty, no dedicated voice-error panel.

### Phase 2 file (stock / margins / wages, but it had dropped voice and other v3 features)
Took the *ideas* and default data, then implemented them properly on top of our v3 (voice, confirmation, kadan, summary, build script all kept):
- Default stock commodities and low-stock thresholds (extended with sugar and tea powder as requested).
- Default making costs on menu items.
- Staff wage rates, and the rule that paying a wage is a செலவு.
- Low-stock alert copy and a dedicated stock/margins/staff area (placed under one Shop tab so Today / Credit / Summary stay).
Not adopted as-is: the Phase 2 file’s unbound “add stock” button, static demo stock with no add/use, margins that could not be edited, no per-day sales profit, no advances or balance owed, demo staff preloaded, a parser that auto-saved without confirmation, missing voice/kadan/summary, and separate storage-only keys (we still *read* those keys to migrate).

## Tests (v8)
Run from `/workspace/kadai-tracker`:

    node tests/run.js
    node tests/ui-smoke.js

Results on 19 Nov 2026 (IST, Asia/Calcutta), after v8:
- Unit tests: **1588 passed, 0 failed** (the 1271 v7 tests unchanged + v8: kg/gram/litre/packet/dozen in 4 languages, total-vs-rate, qty-only → form, spoken × ÷ + − in Tamil/Tanglish/Hindi/Marathi/English, math-only card, precedence rules, payments given/received/wage/advance/3-in-one, person totals, CSV QtyUnit, summary kg lines, fuzzy items/names, best-alternative pick, Devanagari word-start rule, i18n completeness for all new strings).
- Headless Chrome UI smoke: **passed** locally and against https://rajasudalai81-ai.github.io/. v8 adds: Hindi→Tamil Settings save keeps the Tamil header, stored Hindi default shows Tamil, typed name kept, date line not truncated, bilingual Settings, Hold-to-talk setting, the 20 kg ₹1000 entry, per-kg rate, “ஒரு கிலோ தக்காளி” form with kg chip, “50 into 3 tea” toast calc, `500 கழி 120 selavu`, `200 plus 300 podu`, calculator card + save, `25 गुणा 4 चाय`, the 3-person payment sentence, staff wage linking + undo, By person card + filter, Summary By person. Note: puppeteer-core now lives in `/workspace/tools/pupt` (the old `/tmp/pupt` was wiped).

Earlier (v7, 18 Nov 2026):
- Unit tests: **1271 passed, 0 failed** (the 630 earlier tests unchanged + v7: add/minus words in 4 languages, names, multi-entry, Hindi/Marathi/romanized number words, Devanagari digits, paired phrases, credit linking, labels, WhatsApp summary in 4 languages with names, CSV name, and an i18n completeness check that every English UI string has Hindi + Marathi).
- Headless Chrome UI smoke: **passed** locally and against https://rajasudalai81-ai.github.io/ (`node tests/ui-smoke.js https://rajasudalai81-ai.github.io/`). Covers the first-run picker, direct typed save with Undo/Edit, `20000 போடு` / `500 கழி`, the owner’s two-name sentence, `5 idli 3 tea`, the no-amount fallback sheet, the pair phrase, switching to Hindi (no Tamil UI text visible, hi-IN speech), Marathi (mr-IN), English (English only), plus the older menu, long-press, delete, kadan, Shop, staff and legacy-data flows. Local runs also write the `shot-v7-*.png` screenshots.

Earlier (v6):
- Unit tests: **630 passed, 0 failed** (previous 536 + v6 pair-phrase cases: the four example sentences, Tamil/Tanglish verb and number-word forms, item names, negative margin, ledger totals லாபம் ₹20, and non-pairs such as `5 idli 3 tea`, `selavu diesel 500`, `minus 50 discount`, `கழிவு 50`).
- Headless Chrome UI smoke: **passed** (viewport 390×844). Covers the giant mic / + form path, 1-tap menu add, long-press qty 5, paired `30 kazhi 50 varudhu` confirm with auto-focused Save, plus existing sale/expense, confirm, Shop, and kadan flows.

Smoke notes for the next agent: Tamil combining marks are dropped by Puppeteer’s `page.type` — use the `fill()` helper (input events). Fixed tab bar can cover buttons at 390×844 — use `scrollIntoView` + `evaluate` clicks. `#btnIncome` label is “Sale” (assert `/Sale|Income/i`). Form title is still “New income”. `.sheet { display: flex }` overrides UA `[hidden]` unless the `!important` rule above is present.

## Known limits (Raja’s review)
These are the main problems Raja is seeing. Items **1, 2 and 4** are still the most important to fix next (a free Firebase-style online database would address 1 and 2 together, and a permanent host would address 4). v5 is a UI redesign and does **not** fix these.

1. **Multi-phone sync இல்லை (biggest problem).** All data lives in that one phone’s browser (`localStorage`).
2. **Browser cache / phone change loses data.** Manual JSON backup is the only safety net today.
3. **Voice is weak.** Browser Web Speech API (`ta-IN` / `en-IN` / `hi-IN` / `mr-IN`; Marathi weakest), not ChatGPT-level recognition. Weak in stall noise; **iPhone / iOS Safari** is unreliable — the app tells people to type instead.
4. **Hosting** — fixed in v7: permanent GitHub Pages link https://rajasudalai81-ai.github.io/ (older ship.page drops expire).
5. **No password.** Anyone with the link can open the app on the stall phone and add or delete entries there.
6. **Not yet tested on a real Android phone.** Computer tests pass. Button size, mic permission, and noisy-stall voice still need a check on Raja’s Android phone.
7. **Stock does not auto-deduct from recipes.** Sales of idli do not automatically reduce மாவு; use the Use button (or a later ingredient-recipe feature). Deleting a purchase expense later also does not auto-reverse the stock move.

## Phase plan
- **Phase 1:** voice timeout + cap + bilingual errors, editable transcript, wider Tanglish vocabulary, uncertainty markers, single-source build script, quick-menu qty, multi-item confirmation. Done (v3).
- **Phase 2 – Shop management:** stock, low-stock alerts, item-level making cost and daily item profit, staff wages / advances / balance. Done (v4).
- **v5:** UI redesign for non-tech shop people, plus a same-day Tamil font-stack / weight-700 cap so bold Tamil stays readable.
- **v6:** paired spend/earn phrases, minimized Today (2-tap voice, 1-tap menu), inline SVG tiles. Not a cloud/sync phase.
- **v7:** direct save with Undo/Edit, names on entries, multi-entry sentences, Tamil/English/Hindi/Marathi modes with English subtitles, permanent GitHub Pages link.
- **Phase 3 – Advanced features (still to do):**
  - Multiple phones with separate staff accounts
  - Owner and employee permissions
  - Cloud synchronisation (Firebase / Supabase / similar)
  - AI-powered voice entry (not just the browser STT)
  - Automatic weekly and monthly reports
  - Deeper item-level profit using full ingredient recipes (auto stock deduct)

## Phone install steps
Open the link in Chrome > tap ⋮ (top right) > Add to Home screen > Add. Use the icon from the home screen. Export a JSON backup before changing phones or clearing browser data.
