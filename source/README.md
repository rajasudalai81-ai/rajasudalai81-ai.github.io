# கடை கணக்கு — Kadai Tracker

Tamil / English / Hindi / Marathi sales and expense tracker for a Mumbai-area idli / dosa / tea stall.

Live: https://rajasudalai81-ai.github.io/

Open `index.html` on a phone (or the public link). Data stays in that phone's browser (`kadai-tracker-v3`). Older entries still load.

## Build

`logic.js`, `app.js`, `i18n.js` (Hindi/Marathi UI text) and `index.src.html` are the single source of truth. Do not edit the inlined scripts inside `index.html`. After changing `logic.js`, `app.js`, or `index.src.html`, assemble the one-file app with:

    node build.js

That writes `index.html` once, with each source file inlined a single time.

## Main path
- Typing is the most reliable way to enter values.
- Tamil, English and Tanglish number words work (நூறு, nooru, ஐம்பது, aimbadhu, நூற்றி ஐம்பது, pathu, aayiram, rendaayiram, nootti aimbadhu).
- One-line box: type a whole sentence (e.g. `தக்காளி 3 கிலோ 90 ரூபாய்`, `tea 20 glass 10 rupees`, `5 idli 3 tea`) and it saves at once; the toast has Undo and Edit. Multi-item lines save several rows together.

## Voice (optional)
- One big mic button. Speak a full sentence; it is saved straight away (v7) with Undo / Edit on the toast. Only a sentence with no amount opens the editable sheet.
- Uses the browser's Web Speech API (not a cloud AI model). Needs Chrome or a Chromium browser, HTTPS, and mic permission.
- Recognition language follows the app language: ta-IN, en-IN, hi-IN or mr-IN (also switchable on the mic toggle). Tanglish / Hinglish / mixed sentences use the same parser.
- If you press the mic and nothing is heard within ~5–6 seconds, listening stops cleanly. After speech, it stops after ~2 seconds of silence. Restarts are capped (never loops forever).
- Recognized text is shown in an editable box; editing re-parses live before you save.
- If the parser had to guess (unknown item, missing or menu-default price, unstated sale/expense, ambiguous number, low speech confidence), those fields are marked **சரிபாருங்கள் / Please check** (also: check pannunga).
- Clear bilingual errors for no speech, mic permission denied, no network, unsupported browser (iPhone/Safari: type instead), and audio capture failure.
- If voice fails, type the same sentence in the box.

## Other features
- Quick menu buttons (idli, dosa, vada, pongal, tea, coffee) with editable prices. Pick qty 1 / 2 / 5 / 10 (or +/-) then tap an item to add that many.
- Payment: cash / UPI / credit (கடன்) and a credit book with Mark paid.
- End-of-day summary + WhatsApp share, weekly/monthly totals, top-selling items, CSV for Excel.
- Bulk rate (10 kg = ₹100 → 3 kg = ₹30), vehicle number on expenses, required note for minus amounts, Tamil+English delete confirm.
- Totals (வரவு / Income, செலவு / Expense, லாபம் / Profit) are fully recomputed after every add, edit or delete.
- Shop tab (கடை): stock (மாவு, பால், gas, சக்கரை, டீ தூள், எண்ணெய்) with add/use, low-stock alerts on the main screen; per-item making cost and today's item profit; staff list with daily/weekly wages, advances, and balance owed. Paid wages and advances count as expenses.


## v5 UI
Tamil-safe font stack (Noto Sans Tamil, Hind Madurai, Catamaran, Mukta Malar, then system Tamil UI fonts; weights capped at 700 so Tamil never falls through to a display face). Warm stall theme, large Tamil-first labels, a bottom tab bar (Today / Credit / Shop / Summary), forms as bottom sheets, picture-style quick-menu tiles, and a save toast plus 5-second undo after delete. All v4 features and the `kadai-tracker-v3` data key are unchanged. Rebuild with `node build.js` after editing `index.src.html`, `app.js`, or `logic.js`.


## v6
One sentence can record both a spend and a sale (for example "30 ruva kazhi 50 varudhu" becomes expense 30, income 50, profit 20). The Today screen is totals + one giant mic + a type box + SVG menu tiles: speak then tap Save (2 taps), or tap a tile once to add 1 (with undo). Long-press a tile for qty 2/5/10. Sale/Expense forms are behind the small + button. Icons are inline SVGs (no network). Data key kadai-tracker-v3 is unchanged.

## v7
- Voice and typed lines save directly (Undo 8 s + Edit). `20000 போடு / podu / add / डालो / टाका` adds income; `கழி / kazhi / minus / selavu / खर्च / वजा` adds an expense.
- Names (`ரவி பேருக்கு`, `Ravi peruku`, `Ravi ke naam`, `रवीच्या नावावर`) are saved on the entry and shown in the list, edit form, CSV and WhatsApp text. With a credit word (கடன் / kadan / udhaar / उधार) the entry goes to the credit book.
- Several entries in one sentence (commas, and / um / அப்புறம் / aur / और / ani / आणि, or just two name/item groups).
- Language mode: தமிழ் / English / हिंदी / मराठी (first-run picker + Settings). Tamil, Hindi and Marathi show a small English line under each label; English mode is English only.

## v8
- Header shop name always follows the language (any default name is treated as default); date line no longer cut off.
- Settings: `தமிழ் / Tamil`, `English`, `हिंदी / Hindi`, `मराठी / Marathi`, English line under every item; Voice: Tap / Hold to talk, noise filter + level meter.
- Units: “20 கிலோ தக்காளி ஆயிரம் ரூபா” = expense ₹1000, 20 kg; “கிலோ 50 ரூபா” / “50 rupay kilo” / “₹50 per kg” multiply; unit chips in the form; kg in list, CSV and summary.
- Spoken math (into/times/பெருக்கு/गुणा, divide/வகு/भाग, plus/கூட்டு, minus/கழி/वजा): “50 into 3 tea” = ₹150; math-only → calculator card. Precedence is in HANDOFF.md.
- Money to/from people: “முருகனுக்கு 350 கொடுத்தேன்”, “Ravi ko 400 diye”, “Ravi ne 300 diya”; wage words / staff names also go to the staff wage book; By person card with tap-to-filter.
- Voice: picks the best of 5 alternatives, hold-to-talk, live level meter, fuzzy item/name fixes.

## v9 (voice fix)
- Voice is SpeechRecognition only again (v8's extra getUserMedia meter stream took the mic on Android). Meter removed; optional sound pulse (off by default) uses recognition events only; old settings migrated once to meter off + tap mode.
- Visible listening / hearing state, “Heard:” text, bilingual message with fix steps for every mic error, permission-safe timers, try/catch around start.

## v10 (28 Nov 2026)
- **Owner PIN** (Settings → Owner PIN): optional 4-digit PIN (salted hash, never plain text). Needed for past-entry edit/delete, stock changes, recipes, profit / margins / wages, Settings and backup restore; today's own new entries stay free. Forgot PIN → recovery question, or a 24-hour wait that keeps all data.
- **Offline installable app**: `manifest.webmanifest`, icons, `sw.js` (network-first, never touches voice, cache named per build). New versions show "Update available — tap to refresh".
- **Automatic stock**: Shop → Recipes sets ingredient per item sold; sales deduct, edits/deletes/undo reverse; migration keeps old data.
- **Backup safety**: daily reminder, one-tap share (WhatsApp / Drive) or download, last backup date in Settings.
- Build: `python3 tools/make-icons.py` (once, needs Pillow) then `node build.js` → `index.html`, `sw.js`, `manifest.webmanifest`.

## Tests

    node tests/run.js
    node tests/ui-smoke.js                                   # local, also writes shot-v7-*.png and shot-v8-*.png
    node tests/ui-smoke.js https://rajasudalai81-ai.github.io/  # against the live site
