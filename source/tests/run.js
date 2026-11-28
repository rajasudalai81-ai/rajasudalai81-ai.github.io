"use strict";
const {
  parseTamilNumber,
  computeAmount,
  computeTotals,
  createLedger,
  validateEntry,
  todayISO
} = require("../logic.js");

let passed = 0;
let failed = 0;
const failures = [];

function assertEqual(actual, expected, name) {
  const ok =
    actual === expected ||
    (typeof actual === "number" &&
      typeof expected === "number" &&
      !Number.isNaN(actual) &&
      !Number.isNaN(expected) &&
      Math.abs(actual - expected) < 1e-9);
  if (ok) {
    passed += 1;
  } else {
    failed += 1;
    failures.push(`${name}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assert(cond, name, detail) {
  if (cond) passed += 1;
  else {
    failed += 1;
    failures.push(`${name}${detail ? ": " + detail : ""}`);
  }
}

// ---------- Tamil / mixed number parsing ----------
const NUMBER_CASES = [
  ["100", 100],
  ["150", 150],
  ["1,50,000", 150000],
  ["₹100", 100],
  ["ரூ. 50", 50],
  ["ரூபாய் 25", 25],
  ["-20", -20],
  ["10.5", 10.5],
  ["௧௫௦", 150],
  ["௦", 0],

  ["பத்து", 10],
  ["ஐம்பது", 50],
  ["நூறு", 100],
  ["இருநூறு", 200],
  ["ஆயிரம்", 1000],
  ["நூற்றி ஐம்பது", 150],
  ["நூற்று ஐம்பது", 150],
  ["நூற்றிஐம்பது", 150],
  ["ஐம்பது ரூபாய்", 50],
  ["நூறு ரூபாய்", 100],

  ["ஒன்று", 1],
  ["ஒரு", 1],
  ["ஒண்ணு", 1],
  ["இரண்டு", 2],
  ["ரெண்டு", 2],
  ["மூன்று", 3],
  ["மூணு", 3],
  ["நான்கு", 4],
  ["நாலு", 4],
  ["ஐந்து", 5],
  ["அஞ்சு", 5],
  ["ஆறு", 6],
  ["ஏழு", 7],
  ["எட்டு", 8],
  ["ஒன்பது", 9],

  ["பதினொன்று", 11],
  ["பன்னிரண்டு", 12],
  ["பனிரண்டு", 12],
  ["பதிமூன்று", 13],
  ["பதினான்கு", 14],
  ["பதினைந்து", 15],
  ["பதினாறு", 16],
  ["பதினேழு", 17],
  ["பதினெட்டு", 18],
  ["பத்தொன்பது", 19],

  ["இருபது", 20],
  ["இருபத்து ஒன்று", 21],
  ["இருபத்தி ஒன்று", 21],
  ["இருபத்தி ஐந்து", 25],
  ["முப்பது", 30],
  ["முப்பத்து ஐந்து", 35],
  ["நாற்பது", 40],
  ["அறுபது", 60],
  ["எழுபது", 70],
  ["எண்பது", 80],
  ["தொண்ணூறு", 90],
  ["தொண்ணூற்றி ஐந்து", 95],

  ["நூற்று ஒன்று", 101],
  ["நூற்றி ஒன்று", 101],
  ["நூற்றி இருபது", 120],
  ["இருநூற்றி ஐம்பது", 250],
  ["இருநூற்று ஐம்பது", 250],
  ["முந்நூறு", 300],
  ["முன்னூறு", 300],
  ["நாநூறு", 400],
  ["ஐநூறு", 500],
  ["ஐந்நூறு", 500],
  ["அறுநூறு", 600],
  ["எழுநூறு", 700],
  ["எண்ணூறு", 800],
  ["தொள்ளாயிரம்", 900],
  ["ஐநூற்றி ஐம்பது", 550],

  ["இரண்டாயிரம்", 2000],
  ["ரெண்டாயிரம்", 2000],
  ["ஆயிரத்து நூறு", 1100],
  ["ஆயிரத்தி நூறு", 1100],
  ["ஆயிரத்து நூற்றி ஐம்பது", 1150],
  ["மூவாயிரம்", 3000],
  ["ஐயாயிரம்", 5000],
  ["ஐந்தாயிரம்", 5000],

  ["லட்சம்", 100000],
  ["இலட்சம்", 100000],
  ["ஒரு லட்சம்", 100000],
  ["இரண்டு லட்சம்", 200000],
  ["கோடி", 10000000],

  ["அரை", 0.5],
  ["கால்", 0.25],
  ["முக்கால்", 0.75],
  ["மூன்று அரை", 3.5],
  ["பத்து புள்ளி ஐந்து", 10.5],

  // English (voice fallback)
  ["fifty", 50],
  ["one hundred fifty", 150],
  ["two hundred", 200],
  ["thousand", 1000],

  // colloquial shop talk
  ["அஞ்சு", 5],
  ["நாலு", 4],
  ["மூணு", 3],
  ["ரெண்டு", 2],

  // with units ignored
  ["பத்து கிலோ", 10],
  ["3 kg", 3],
  ["மூன்று கிலோ", 3]
];

for (const [input, expected] of NUMBER_CASES) {
  assertEqual(parseTamilNumber(input), expected, `parse("${input}")`);
}

assertEqual(parseTamilNumber(""), null, "parse empty");
assertEqual(parseTamilNumber("   "), null, "parse whitespace");
assertEqual(parseTamilNumber("இட்லி"), null, "parse non-number word");

// ---------- Rate calculator ----------
{
  const r = computeAmount({ qty: 3, refQty: 10, refAmount: 100 });
  assertEqual(r.amount, 30, "bulk 10kg=100, 3kg amount");
  assertEqual(r.unitPrice, 10, "bulk unit price");
  assertEqual(r.source, "bulk", "bulk source");
}
{
  const r = computeAmount({
    qty: parseTamilNumber("மூன்று"),
    refQty: parseTamilNumber("பத்து"),
    refAmount: parseTamilNumber("நூறு")
  });
  assertEqual(r.amount, 30, "bulk with Tamil words 10=100, 3");
}
{
  const r = computeAmount({ qty: 2.5, refQty: 5, refAmount: 80 });
  assertEqual(r.amount, 40, "bulk fractional qty");
}
{
  const r = computeAmount({ qty: 4, unitPrice: 12 });
  assertEqual(r.amount, 48, "qty × unit price");
  assertEqual(r.source, "unit", "unit source");
}
{
  const r = computeAmount({
    qty: parseTamilNumber("ஐந்து"),
    unitPrice: parseTamilNumber("ஐம்பது")
  });
  assertEqual(r.amount, 250, "Tamil qty × Tamil price");
}
{
  const r = computeAmount({ qty: 3, unitPrice: 10, refQty: 10, refAmount: 100 });
  assertEqual(r.amount, 30, "bulk takes precedence over unit price");
}
{
  const r = computeAmount({ qty: "", unitPrice: "" });
  assertEqual(r.amount, null, "empty amount stays null so user can type it");
}

// ---------- Validation: note required for negative ----------
{
  const v = validateEntry({ type: "expense", amount: -20, note: "" });
  assert(!v.ok && v.errors.includes("note-required-for-negative"), "negative expense without note rejected");
}
{
  const v = validateEntry({ type: "expense", amount: -20, note: "திருப்பம்" });
  assert(v.ok, "negative expense with note accepted");
}
{
  const v = validateEntry({ type: "income", amount: -10, note: "" });
  assert(!v.ok && v.errors.includes("note-required-for-negative"), "negative income without note rejected");
}
{
  const v = validateEntry({ type: "income", amount: 100, note: "" });
  assert(v.ok, "positive income without note accepted");
}
{
  const v = validateEntry({ type: "expense", amount: "", item: "எண்ணெய்" });
  assert(!v.ok && v.errors.includes("amount"), "missing amount rejected");
}

// ---------- Daily totals: add / edit / delete (heavily tested) ----------
function checkTotals(ledger, date, inc, exp, profit, label) {
  const t = ledger.totalsForDate(date);
  assertEqual(t.income, inc, `${label} வரவு`);
  assertEqual(t.expense, exp, `${label} செலவு`);
  assertEqual(t.profit, profit, `${label} லாபம்`);
  assertEqual(t.வரவு, inc, `${label} வரவு alias`);
  assertEqual(t.செலவு, exp, `${label} செலவு alias`);
  assertEqual(t.லாபம், profit, `${label} லாபம் alias`);
}

const D = "2026-11-14";
const D2 = "2026-11-13";

{
  const L = createLedger();
  checkTotals(L, D, 0, 0, 0, "empty day");

  const a1 = L.add({ type: "income", date: D, item: "இட்லி", qty: 10, unitPrice: 10, amount: 100 });
  assert(a1.ok, "add income 100");
  checkTotals(L, D, 100, 0, 100, "after income 100");

  const a2 = L.add({ type: "income", date: D, item: "டீ", qty: 20, unitPrice: 10, amount: 200 });
  assert(a2.ok, "add income 200");
  checkTotals(L, D, 300, 0, 300, "after income 100+200");

  const a3 = L.add({ type: "expense", date: D, item: "எண்ணெய்", amount: 80, vehicleNo: "MH01AB1234" });
  assert(a3.ok && a3.entry.vehicleNo === "MH01AB1234", "add expense with vehicle no");
  checkTotals(L, D, 300, 80, 220, "after expense 80");

  // Other day must not change
  L.add({ type: "income", date: D2, item: "தோசை", amount: 500 });
  checkTotals(L, D, 300, 80, 220, "today unchanged after other-day add");
  checkTotals(L, D2, 500, 0, 500, "other day totals");

  // Delete income 200
  const del = L.remove(a2.entry.id);
  assert(del.ok, "delete income 200");
  assert(L.listForDate(D).every((e) => e.id !== a2.entry.id), "deleted id gone from list");
  checkTotals(L, D, 100, 80, 20, "after delete income 200");
  checkTotals(L, D2, 500, 0, 500, "other day untouched by delete");

  // Edit remaining income 100 → 150
  const ed = L.edit(a1.entry.id, { amount: 150 });
  assert(ed.ok, "edit income to 150");
  assertEqual(ed.entry.id, a1.entry.id, "edit keeps same id");
  assertEqual(L.listForDate(D).filter((e) => e.type === "income").length, 1, "edit does not duplicate");
  checkTotals(L, D, 150, 80, 70, "after edit income 100→150");

  // Edit expense 80 → 40
  const ed2 = L.edit(a3.entry.id, { amount: 40 });
  assert(ed2.ok, "edit expense to 40");
  checkTotals(L, D, 150, 40, 110, "after edit expense 80→40");

  // Change type income → expense (should move sides, not double count)
  const ed3 = L.edit(a1.entry.id, { type: "expense", amount: 150, note: "த typo சரி" });
  assert(ed3.ok, "edit type income to expense");
  checkTotals(L, D, 0, 190, -190, "after type change income→expense");

  // Change back
  L.edit(a1.entry.id, { type: "income", amount: 150 });
  checkTotals(L, D, 150, 40, 110, "after type change back");

  // Negative adjustment on expense (reduces செலவு)
  const adj = L.add({ type: "expense", date: D, item: "சரிகட்டு", amount: -10, note: "அளவு தவறு திருத்தம்" });
  assert(adj.ok, "add negative expense adjustment");
  checkTotals(L, D, 150, 30, 120, "after -10 expense adjustment");

  // Negative adjustment on income (reduces வரவு)
  const adjI = L.add({ type: "income", date: D, item: "திருப்பம்", amount: -20, note: "வாடிக்கையாளர் திருப்பினார்" });
  assert(adjI.ok, "add negative income adjustment");
  checkTotals(L, D, 130, 30, 100, "after -20 income adjustment");

  // Reject negative without note at add and edit
  const bad = L.add({ type: "expense", date: D, amount: -5, note: "" });
  assert(!bad.ok, "add negative without note fails");
  checkTotals(L, D, 130, 30, 100, "totals unchanged after rejected add");

  const badEdit = L.edit(a3.entry.id, { amount: -5, note: "" });
  assert(!badEdit.ok, "edit to negative without note fails");
  checkTotals(L, D, 130, 30, 100, "totals unchanged after rejected edit");

  // Delete adjustment, totals restore
  L.remove(adj.entry.id);
  checkTotals(L, D, 130, 40, 90, "after deleting -10 expense adj");

  L.remove(adjI.entry.id);
  checkTotals(L, D, 150, 40, 110, "after deleting -20 income adj");

  // Delete last expense
  L.remove(a3.entry.id);
  checkTotals(L, D, 150, 0, 150, "after deleting last expense");

  // Delete last income → zeros
  L.remove(a1.entry.id);
  checkTotals(L, D, 0, 0, 0, "after deleting last income");
  checkTotals(L, D2, 500, 0, 500, "other day still intact at end");

  // Delete missing id
  const miss = L.remove("no-such-id");
  assert(!miss.ok, "delete missing id fails safely");
}

// Sequential many add/delete to catch incremental-counter bugs
{
  const L = createLedger();
  const ids = [];
  for (let i = 0; i < 20; i++) {
    const r = L.add({ type: i % 2 === 0 ? "income" : "expense", date: D, amount: i + 1, item: "x" + i });
    ids.push(r.entry.id);
  }
  // incomes: 1+3+5+...+19 = 100, expenses: 2+4+...+20 = 110
  checkTotals(L, D, 100, 110, -10, "20 mixed entries");

  // delete evens (income) one by one
  for (let i = 0; i < 20; i += 2) {
    L.remove(ids[i]);
  }
  checkTotals(L, D, 0, 110, -110, "after deleting all incomes");

  // re-add one income and edit an expense
  L.add({ type: "income", date: D, amount: 200, item: "re" });
  L.edit(ids[1], { amount: 50 }); // was 2, now 50. expenses were 110 - 2 + 50 = 158
  checkTotals(L, D, 200, 158, 42, "after re-add and expense edit");

  // delete everything remaining
  for (const e of L.all()) L.remove(e.id);
  checkTotals(L, D, 0, 0, 0, "after wipe");
}

// computeTotals ignores deleted flag and other dates, and never double-counts
{
  const entries = [
    { type: "income", date: D, amount: 10, deleted: true },
    { type: "income", date: D, amount: 7 },
    { type: "expense", date: D, amount: 3 },
    { type: "income", date: D2, amount: 99 }
  ];
  const t = computeTotals(entries, D);
  assertEqual(t.income, 7, "ignore soft-deleted");
  assertEqual(t.expense, 3, "expense present");
  assertEqual(t.profit, 4, "profit 7-3");
}

// Vehicle number is stored only on expenses
{
  const L = createLedger();
  const inc = L.add({ type: "income", date: D, amount: 10, vehicleNo: "MH01" });
  assertEqual(inc.entry.vehicleNo, "", "income does not keep vehicle no");
  const exp = L.add({ type: "expense", date: D, amount: 10, vehicleNo: "MH 01 AB 1234" });
  assertEqual(exp.entry.vehicleNo, "MH 01 AB 1234", "expense keeps vehicle no");
}

// Tamil amounts through the ledger
{
  const L = createLedger();
  const qty = parseTamilNumber("மூன்று");
  const refQty = parseTamilNumber("பத்து");
  const refAmount = parseTamilNumber("நூறு");
  const calc = computeAmount({ qty, refQty, refAmount });
  L.add({
    type: "expense",
    date: D,
    item: "அரிசி",
    qty,
    refQty,
    refAmount,
    amount: calc.amount,
    vehicleNo: "MH02CD9999",
    unit: "கிலோ"
  });
  checkTotals(L, D, 0, 30, -30, "ledger amount from Tamil bulk rate");
}

// ---------- Tanglish number words ----------
const TANGLISH_CASES = [
  ["nooru", 100],
  ["aimbadhu", 50],
  ["pathu", 10],
  ["aayiram", 1000],
  ["ayiram", 1000],
  ["rendu", 2],
  ["moonu", 3],
  ["naalu", 4],
  ["anju", 5],
  ["nootti aimbadhu", 150],
  ["irunooru", 200],
  ["onnu", 1]
];
for (const [input, expected] of TANGLISH_CASES) {
  assertEqual(parseTamilNumber(input), expected, `tanglish parse("${input}")`);
}

// ---------- One-shot utterance / quick-entry parser ----------
const {
  parseUtterance,
  kadanBook,
  markKadanPaid,
  paymentBreakdown,
  computeTotalsRange,
  topSelling,
  toCSV,
  defaultMenu,
  normalizePayMode,
  payModeOf,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  daySummaryText
} = require("../logic.js");

{
  const p = parseUtterance("தக்காளி 3 கிலோ 90 ரூபாய்");
  assert(p.ok, "tomato utterance ok");
  assertEqual(p.type, "expense", "tomato is expense");
  assert(p.item.indexOf("தக்காளி") !== -1, "tomato item", p.item);
  assertEqual(p.qty, 3, "tomato qty");
  assertEqual(p.unit, "கிலோ", "tomato unit");
  assertEqual(p.amount, 90, "tomato total 90 (not 3×90)");
  assertEqual(p.unitPrice, 30, "tomato derived unit price");
}
{
  const p = parseUtterance("tea 20 glass 10 rupees");
  assert(p.ok, "tea utterance ok");
  assertEqual(p.type, "income", "tea is sale");
  assertEqual(p.qty, 20, "tea qty");
  assertEqual(p.unit, "கிளாஸ்", "tea unit glass");
  assertEqual(p.unitPrice, 10, "tea unit price");
  assertEqual(p.amount, 200, "tea 20×10=200");
}
{
  const p = parseUtterance("selavu diesel 500 vandi TN 01 AB 1234");
  assert(p.ok, "diesel utterance ok");
  assertEqual(p.type, "expense", "selavu → expense");
  assert(p.item.indexOf("டீசல்") !== -1 || /diesel/i.test(p.item + p.itemEn), "diesel item", p.item);
  assertEqual(p.amount, 500, "diesel amount");
  assertEqual(p.vehicleNo, "TN01AB1234", "vehicle normalized");
}
{
  const p = parseUtterance("gas cylinder 1100");
  assert(p.ok, "gas utterance ok");
  assertEqual(p.type, "expense", "gas is expense");
  assertEqual(p.amount, 1100, "gas amount");
}
{
  const p = parseUtterance("minus 50 discount");
  assert(p.ok, "minus utterance ok");
  assertEqual(p.type, "income", "discount defaults to income adjustment");
  assertEqual(p.amount, -50, "minus 50");
  assert(!!p.note, "minus has note", p.note);
}
{
  const p = parseUtterance("kadan ramesh dosa 2 40");
  assert(p.ok, "kadan utterance ok");
  assertEqual(p.payMode, "credit", "kadan → credit");
  assertEqual(p.customerName.toLowerCase(), "ramesh", "customer ramesh");
  assertEqual(p.type, "income", "credit dosa is income");
  assertEqual(p.amount, 80, "2×40 dosa");
}
{
  const p = parseUtterance("idli pathu");
  assertEqual(p.qty, 10, "tanglish pathu qty");
  assertEqual(p.amount, 100, "10 idli × menu 10");
}
{
  const p = parseUtterance("");
  assert(!p.ok, "empty utterance not ok");
}

// ---------- Payment / kadan book / mark paid (totals unchanged) ----------
{
  const L = createLedger();
  const D = "2026-11-14";
  L.add({ type: "income", date: D, item: "இட்லி", amount: 100, payMode: "cash" });
  L.add({ type: "income", date: D, item: "டீ", amount: 50, payMode: "upi" });
  const c1 = L.add({ type: "income", date: D, item: "தோசை", amount: 80, payMode: "credit", customerName: "Ramesh" });
  assert(c1.ok, "credit add with name");
  const bad = L.add({ type: "income", date: D, item: "தோசை", amount: 40, payMode: "credit", customerName: "" });
  assert(!bad.ok && bad.errors.includes("customer-required-for-credit"), "credit without name rejected");
  checkTotals(L, D, 230, 0, 230, "income includes unpaid credit");
  const pay = paymentBreakdown(L.all(), D);
  assertEqual(pay.cash, 100, "cash 100");
  assertEqual(pay.upi, 50, "upi 50");
  assertEqual(pay.credit, 80, "credit 80");
  assertEqual(pay.unpaidCredit, 80, "unpaid 80");

  const book = kadanBook(L.all());
  assertEqual(book.length, 1, "one debtor");
  assertEqual(book[0].owed, 80, "ramesh owes 80");
  assertEqual(nameQuiet(book[0].name), "ramesh", "ramesh name");

  L.add({ type: "income", date: D, item: "டீ", amount: 20, payMode: "credit", customerName: "Ramesh" });
  const book2 = kadanBook(L.all());
  assertEqual(book2[0].owed, 100, "ramesh now owes 100");
  assertEqual(book2[0].count, 2, "two open lines");

  const marked = markKadanPaid(L.all(), "ramesh");
  L.replace(marked);
  checkTotals(L, D, 250, 0, 250, "marking kadan paid does not change வரவு");
  const pay2 = paymentBreakdown(L.all(), D);
  assertEqual(pay2.credit, 100, "credit still counted as income");
  assertEqual(pay2.unpaidCredit, 0, "unpaid cleared");
  assertEqual(kadanBook(L.all()).length, 0, "kadan book empty after paid");

  // old entries without payMode still load and total
  const oldStyle = createLedger([
    { id: "old1", type: "income", date: D, item: "இட்லி", amount: 30 },
    { id: "old2", type: "expense", date: D, item: "எண்ணெய்", amount: 10, vehicleNo: "MH01AB1" }
  ]);
  checkTotals(oldStyle, D, 30, 10, 20, "v3 entries without payMode");
  assertEqual(payModeOf(oldStyle.all()[0]), "cash", "missing payMode treated as cash");
}

function nameQuiet(s) { return String(s).trim().toLowerCase(); }

// ---------- Weekly / monthly / top selling / CSV ----------
{
  const entries = [
    { type: "income", date: "2026-11-09", item: "இட்லி", qty: 5, amount: 50 }, // Monday of that week? 9 is Mon, 14 is Sat
    { type: "income", date: "2026-11-14", item: "இட்லி", qty: 10, amount: 100 },
    { type: "income", date: "2026-11-14", item: "டீ", qty: 8, amount: 80 },
    { type: "expense", date: "2026-11-14", item: "எண்ணெய்", amount: 40 },
    { type: "income", date: "2026-11-01", item: "தோசை", qty: 2, amount: 80 },
    { type: "income", date: "2026-10-30", item: "டீ", qty: 3, amount: 30 }
  ];
  assertEqual(startOfWeek("2026-11-14"), "2026-11-09", "week starts Monday");
  assertEqual(endOfWeek("2026-11-14"), "2026-11-15", "week ends Sunday");
  const week = computeTotalsRange(entries, startOfWeek("2026-11-14"), endOfWeek("2026-11-14"));
  assertEqual(week.income, 230, "week income 50+100+80");
  assertEqual(week.expense, 40, "week expense");
  assertEqual(week.profit, 190, "week profit");
  const month = computeTotalsRange(entries, startOfMonth("2026-11-14"), endOfMonth("2026-11-14"));
  assertEqual(month.income, 310, "Nov income 50+100+80+80");
  const top = topSelling(entries, "2026-11-01", "2026-11-30");
  assertEqual(top[0].item, "இட்லி", "top item idli");
  assertEqual(top[0].amount, 150, "idli 50+100");
  const csv = toCSV(entries);
  assert(csv.indexOf("Date,Type,Item") !== -1, "csv header");
  assert(csv.indexOf("இட்லி") !== -1, "csv has tamil item");
  assert(csv.charCodeAt(0) === 0xfeff, "csv has BOM for Excel");
  const summary = daySummaryText(entries, "2026-11-14", "டெஸ்ட் கடை");
  assert(summary.indexOf("வரவு") !== -1 && summary.indexOf("Income") !== -1, "summary bilingual");
  assert(summary.indexOf("180") !== -1 || summary.indexOf("₹180") !== -1, "summary income 180");
}

assertEqual(normalizePayMode("kadan"), "credit", "kadan → credit");
assertEqual(normalizePayMode("யூபிஐ"), "upi", "upi tamil");
assertEqual(defaultMenu().length, 6, "default 6 menu items");

// utterance through ledger + delete still recomputes
{
  const L = createLedger();
  const D = "2026-11-14";
  const p = parseUtterance("tea 20 glass 10 rupees");
  const a = L.add({ ...p, date: D });
  assert(a.ok, "ledger add from utterance");
  checkTotals(L, D, 200, 0, 200, "after tea utterance");
  const p2 = parseUtterance("selavu diesel 500 vandi TN 01 AB 1234");
  const b = L.add({ ...p2, date: D });
  assert(b.ok && b.entry.vehicleNo === "TN01AB1234", "diesel saved with vehicle");
  checkTotals(L, D, 200, 500, -300, "after diesel");
  L.remove(a.entry.id);
  checkTotals(L, D, 0, 500, -500, "delete sale after utterance add");
  const p3 = parseUtterance("minus 50 discount");
  const c = L.add({ ...p3, date: D });
  assert(c.ok, "minus saved because note present");
  checkTotals(L, D, -50, 500, -550, "after minus discount");
}

// ---------- Phase 1: Tanglish vocab, multi-item, uncertainty, voice policy ----------
{
  const {
    parseUtterance,
    parseUtterances,
    parsedToEntry,
    createLedger,
    VOICE,
    shouldRestartRecognition,
    shouldStopForInitialTimeout,
    shouldStopForSilence,
    voiceErrorMessage,
    unsupportedVoiceCode,
    parseTamilNumber
  } = require("../logic.js");

  assertEqual(parseTamilNumber("rendaayiram"), 2000, "rendaayiram = 2000");
  assertEqual(parseTamilNumber("nootti aimbadhu"), 150, "nootti aimbadhu = 150");
  assertEqual(parseTamilNumber("irunooru"), 200, "irunooru = 200");
  assertEqual(parseTamilNumber("moonu"), 3, "moonu = 3");
  assertEqual(parseTamilNumber("irubadhu"), 20, "irubadhu = 20");

  const itli = parseUtterance("itli pathu");
  assert(itli.ok && itli.item === "இட்லி" && itli.qty === 10 && itli.amount === 100, "itli pathu → 10 இட்லி ₹100");
  assertEqual(parseUtterance("iddly 5").item, "இட்லி", "iddly → இட்லி");
  assertEqual(parseUtterance("thosai rendu").item, "தோசை", "thosai → தோசை");
  assertEqual(parseUtterance("thosai rendu").qty, 2, "thosai rendu qty 2");
  assertEqual(parseUtterance("chaya 2").item, "டீ", "chaya → டீ");
  assertEqual(parseUtterance("kaapi 1").item, "காபி", "kaapi → காபி");
  assertEqual(parseUtterance("vadai 2").item, "வடை", "vadai → வடை");

  const veg = parseUtterance("vengayam 1 kilo 40");
  assert(veg.ok && veg.item === "வெங்காயம்" && veg.type === "expense" && veg.amount === 40, "vengayam expense 40");
  const mav = parseUtterance("maavu 5 kg 200");
  assert(mav.ok && mav.item === "மாவு" && mav.amount === 200, "maavu 5 kg 200");
  const tom = parseUtterance("tomato 3 kilo 90");
  assert(tom.ok && tom.type === "expense" && tom.amount === 90, "tomato 3 kilo 90 is total 90");

  assertEqual(parseUtterance("vithadhu idli 5").type, "income", "vithadhu → income");
  assertEqual(parseUtterance("vaangunadhu diesel 500").type, "expense", "vaangunadhu → expense");
  assertEqual(parseUtterance("kuduthen tea 2").type, "income", "kuduthen → income");
  assertEqual(parseUtterance("selavu petrol 200").type, "expense", "selavu petrol");
  assertEqual(parseUtterance("varavu pongal 1").type, "income", "varavu → income");

  const multi = parseUtterances("5 idli 3 tea");
  assert(multi.ok && multi.entries.length === 2, "5 idli 3 tea → 2 entries");
  assertEqual(multi.entries[0].item, "இட்லி", "multi first item idli");
  assertEqual(multi.entries[0].qty, 5, "multi idli qty 5");
  assertEqual(multi.entries[0].amount, 50, "multi idli 5×10");
  assertEqual(multi.entries[1].item, "டீ", "multi second item tea");
  assertEqual(multi.entries[1].qty, 3, "multi tea qty 3");
  assertEqual(multi.entries[1].amount, 30, "multi tea 3×10");

  const one = parseUtterances("tea 20 glass 10 rupees");
  assert(one.ok && one.entries.length === 1, "tea 20 glass 10 stays one item");
  assertEqual(one.entries[0].qty, 20, "tea qty 20");
  assertEqual(one.entries[0].amount, 200, "tea 20×10 = 200");

  const unk = parseUtterance("somethingweird 50");
  assert(unk.needsCheck, "unknown item needs check");
  assert(unk.uncertain && unk.uncertain.item, "unknown item flagged");
  assert(unk.uncertaintyReasons.indexOf("unknown-item") !== -1, "reason unknown-item");

  const menuP = parseUtterance("idli pathu");
  assert(menuP.ok && menuP.amount === 100, "idli pathu still 100");
  assert(menuP.needsCheck && menuP.uncertain.unitPrice, "menu default price is uncertain");

  const low = parseUtterance("idli 2", { speechConfidence: 0.4 });
  assert(low.needsCheck && low.uncertain.speech, "low speech confidence flagged");
  const hi = parseUtterance("idli 2 10", { speechConfidence: 0.95 });
  assert(!hi.uncertain.speech, "high confidence not flagged as speech");

  const miss = parseUtterance("randomword");
  assert(!miss.ok || miss.needsCheck, "no price / unknown needs check");

  assertEqual(VOICE.INITIAL_TIMEOUT_MS, 5500, "initial timeout ~5.5s");
  assertEqual(VOICE.MAX_RESTARTS, 3, "restart cap 3");
  assertEqual(shouldRestartRecognition({ listening: true, gotSpeech: true, restartCount: 0 }), true, "restart allowed after speech");
  assertEqual(shouldRestartRecognition({ listening: true, gotSpeech: false, restartCount: 0 }), false, "no restart if nothing heard");
  assertEqual(shouldRestartRecognition({ listening: true, gotSpeech: true, restartCount: 3 }), false, "no restart at cap");
  assertEqual(shouldRestartRecognition({ listening: true, gotSpeech: true, stopRequested: true, restartCount: 0 }), false, "no restart after stop");
  assertEqual(shouldStopForInitialTimeout({ listening: true, gotSpeech: false, startedAt: 0 }, 5500), true, "stop at 5.5s with no speech");
  assertEqual(shouldStopForInitialTimeout({ listening: true, gotSpeech: false, startedAt: 0 }, 1000), false, "do not stop early");
  assertEqual(shouldStopForInitialTimeout({ listening: true, gotSpeech: true, startedAt: 0 }, 5500), false, "initial timeout ignored after speech");
  assertEqual(shouldStopForSilence({ listening: true, gotSpeech: true, lastResultAt: 0 }, 2000), true, "silence after speech");
  assertEqual(shouldStopForSilence({ listening: true, gotSpeech: false, lastResultAt: 0 }, 2000), false, "silence timer does not apply before speech");

  const iphone = unsupportedVoiceCode("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605", false);
  assertEqual(iphone, "iphone", "iphone without API");
  const iphoneMsg = voiceErrorMessage("iphone");
  assert(iphoneMsg.ta.indexOf("iPhone") !== -1 && /type/i.test(iphoneMsg.en), "iphone error tells them to type");
  const nos = voiceErrorMessage("no-speech");
  assert(nos.ta && nos.en && /type/i.test(nos.en), "no-speech bilingual");
  assert(voiceErrorMessage("not-allowed").en.toLowerCase().indexOf("permission") !== -1, "mic denied message");
  assert(voiceErrorMessage("network").en.toLowerCase().indexOf("network") !== -1, "network message");
  assert(voiceErrorMessage("audio-capture").en.toLowerCase().indexOf("audio") !== -1, "audio capture message");
  assertEqual(unsupportedVoiceCode("Mozilla/5.0 Chrome", true), null, "supported when API present");

  // multi-item through ledger still recomputes totals; existing data path
  const L = createLedger();
  const D = "2026-11-14";
  const m = parseUtterances("5 idli 3 tea");
  for (const e of m.entries) {
    const r = L.add({ ...parsedToEntry(e, D) });
    assert(r.ok, "ledger add multi item " + e.item);
  }
  const t = L.totalsForDate(D);
  assertEqual(t.income, 80, "5 idli + 3 tea = ₹80");
  assertEqual(t.expense, 0, "no expense in multi sale");
  const legacy = createLedger([
    { id: "old1", type: "income", date: D, item: "இட்லி", amount: 30 },
    { id: "old2", type: "expense", date: D, item: "எண்ணெய்", amount: 10 }
  ]);
  const t2 = legacy.totalsForDate(D);
  assertEqual(t2.income, 30, "legacy income still 30 after phase 1");
  assertEqual(t2.expense, 10, "legacy expense still 10 after phase 1");
}


// ---------- Phase 2: stock, margins, wages + v3.1 number-word aliases ----------
{
  const {
    parseTamilNumber,
    defaultStockItems,
    defaultMenu,
    normalizeMenu,
    lowStockItems,
    stockIsUninitialized,
    addStock,
    useStock,
    itemMargins,
    dayItemProfits,
    addStaff,
    recordWage,
    payWageRecord,
    staffBalance,
    staffSummaries,
    loadShopExtras,
    createLedger,
    computeTotals
  } = require("../logic.js");

  assertEqual(parseTamilNumber("padhimoonu"), 13, "v3.1 alias padhimoonu");
  assertEqual(parseTamilNumber("padhinaalu"), 14, "v3.1 alias padhinaalu");
  assertEqual(parseTamilNumber("padhinanju"), 15, "v3.1 alias padhinanju");
  assertEqual(parseTamilNumber("embadhu"), 80, "v3.1 alias embadhu");
  assertEqual(parseTamilNumber("naappadhu"), 40, "v3.1 alias naappadhu");
  assertEqual(parseTamilNumber("iruvathu"), 20, "v3.1 alias iruvathu");
  assertEqual(parseTamilNumber("ombadhu"), 9, "v3.1 alias ombadhu");

  const stock = defaultStockItems();
  assertEqual(stock.length, 6, "six default stock items");
  const ids = stock.map((x) => x.id).join(",");
  assert(ids === "maavu,paal,gas,sugar,teapowder,oil", "default stock ids: " + ids);
  assert(stockIsUninitialized(stock, []), "fresh stock is uninitialized");
  assertEqual(lowStockItems(stock, []).length, 0, "no alerts before any stock is tracked");

  const buy = addStock(stock, [], { itemId: "maavu", qty: 10, amount: 200, logExpense: true, date: "2026-11-14" });
  assert(buy.ok && buy.item.qty === 10, "add stock qty 10");
  assert(buy.expense && buy.expense.amount === 200 && buy.expense.category === "stock", "purchase logs expense 200");
  assertEqual(lowStockItems(buy.stock, buy.stockMoves).length, 0, "10 maavu is above alert 8; other items not tracked");

  const used = useStock(buy.stock, buy.stockMoves, { itemId: "maavu", qty: 3, date: "2026-11-14" });
  assert(used.ok && used.item.qty === 7, "use stock 3 → 7 left");
  const alerts = lowStockItems(used.stock, used.stockMoves);
  assert(alerts.length === 1 && alerts[0].id === "maavu", "low-stock alert when 7 <= 8");

  const over = useStock(used.stock, used.stockMoves, { itemId: "maavu", qty: 99 });
  assert(!over.ok && over.errors.indexOf("insufficient-stock") !== -1, "cannot use more than on hand");

  const noExp = addStock(defaultStockItems(), [], { itemId: "oil", qty: 5, amount: 100, logExpense: false, date: "2026-11-14" });
  assert(noExp.ok && !noExp.expense && noExp.item.qty === 5, "optional: add stock without logging expense");

  const legacyMenu = normalizeMenu([{ id: "idli", nameTa: "இட்லி", nameEn: "Idli", price: 10 }]);
  assertEqual(legacyMenu[0].costPrice, 3.5, "legacy menu gets default idli cost");
  const margins = itemMargins(legacyMenu);
  assertEqual(margins[0].unitProfit, 6.5, "idli unit profit 10-3.5");
  assertEqual(margins[0].marginPct, 65, "idli margin 65%");

  const Ldg = createLedger();
  Ldg.add({ type: "income", date: "2026-11-14", item: "இட்லி", qty: 5, amount: 50 });
  Ldg.add({ type: "income", date: "2026-11-14", item: "டீ", qty: 3, amount: 30 });
  const day = dayItemProfits(Ldg.all(), "2026-11-14", defaultMenu());
  assertEqual(day.totalRevenue, 80, "day menu revenue 80");
  assertEqual(day.totalCost, 29.5, "day ingredient cost 5×3.5 + 3×4");
  assertEqual(day.totalProfit, 50.5, "day item profit 50.5");

  const st = addStaff([], { name: "முருகன்", dailyWage: 700, weeklyWage: 4200 });
  assert(st.ok && st.staff.length === 1, "add staff");
  const paid = recordWage([], st.staff, { staffId: st.member.id, kind: "daily", date: "2026-11-14", paid: true });
  assert(paid.ok && paid.expense && paid.expense.amount === 700 && paid.expense.category === "wage", "paid daily wage is expense 700");
  const ledW = createLedger();
  const a1 = ledW.add(paid.expense);
  assert(a1.ok, "ledger accepts wage expense");
  checkTotals(ledW, "2026-11-14", 0, 700, -700, "wage counted in செலவு");
  assertEqual(staffBalance(st.member.id, paid.wages).balanceOwed, 0, "paid wage leaves balance 0");

  const adv = recordWage(paid.wages, st.staff, { staffId: st.member.id, kind: "advance", amount: 200, date: "2026-11-14" });
  assert(adv.expense && adv.expense.amount === 200, "advance is expense");
  const ledA = createLedger(ledW.all());
  ledA.add(adv.expense);
  checkTotals(ledA, "2026-11-14", 0, 900, -900, "wage + advance in totals");
  assertEqual(staffBalance(st.member.id, adv.wages).advances, 200, "advance tracked");
  assertEqual(staffBalance(st.member.id, adv.wages).balanceOwed, -200, "advance outstanding (staff owes)");

  const unpaid = recordWage([], st.staff, { staffId: st.member.id, kind: "daily", date: "2026-11-14", paid: false });
  assert(!unpaid.expense, "unpaid wage is not an expense yet");
  assertEqual(staffBalance(st.member.id, unpaid.wages).balanceOwed, 700, "unpaid wage is balance owed");
  const pay = payWageRecord(unpaid.wages, st.staff, unpaid.record.id);
  assert(pay.expense && pay.expense.amount === 700, "paying due creates expense");
  assertEqual(staffBalance(st.member.id, pay.wages).balanceOwed, 0, "balance cleared after pay");

  const week = recordWage([], st.staff, { staffId: st.member.id, kind: "weekly", date: "2026-11-14" });
  assert(week.expense && week.expense.amount === 4200, "weekly wage expense uses weekly rate");

  const sums = staffSummaries(st.staff, adv.wages);
  assertEqual(sums[0].wagesPaid, 700, "summary wages paid");

  const mig = loadShopExtras({}, {
    stockV2: [{ id: "s1", nameTa: "மாவு (Batter)", qty: 25, unit: "கிலோ", minAlert: 8 }],
    staffV2: [{ id: "w1", name: "முருகன் (மாஸ்டர்)", dailyWage: 700 }]
  });
  assertEqual(mig.stock[0].qty, 25, "migrate Phase 2 stock-v2 qty");
  assert(mig.staff[0].name.indexOf("முருகன்") !== -1, "migrate Phase 2 staff-v2");

  // legacy entries without shop fields still total
  const oldStyle = createLedger([
    { id: "old1", type: "income", date: "2026-11-14", item: "இட்லி", amount: 30 },
    { id: "old2", type: "expense", date: "2026-11-14", item: "எண்ணெய்", amount: 10 }
  ]);
  checkTotals(oldStyle, "2026-11-14", 30, 10, 20, "legacy entries still total after Phase 2");
  const tAfterWage = computeTotals(oldStyle.all().concat([pay.expense]), "2026-11-14");
  assertEqual(tAfterWage.expense, 710, "legacy + wage expense recomputed");
}


// ---------- v6: natural paired spend/earn phrases ----------
{
  const {
    parseUtterance,
    parseUtterances,
    parsePairDeal,
    parsedToEntry,
    createLedger,
    computeTotals
  } = require("../logic.js");

  function checkPair(text, spent, earned, item, label) {
    const r = parseUtterances(text);
    const tag = label || text;
    assert(r.ok && r.paired && r.entries && r.entries.length === 2, tag + " should be a pair, got " + JSON.stringify({ ok: r.ok, paired: r.paired, n: (r.entries || []).length }));
    assertEqual(r.entries[0].type, "expense", tag + " first is expense");
    assertEqual(r.entries[0].amount, spent, tag + " spent");
    assertEqual(r.entries[1].type, "income", tag + " second is income");
    assertEqual(r.entries[1].amount, earned, tag + " earned");
    assertEqual(r.margin, earned - spent, tag + " margin");
    if (item) {
      assertEqual(r.entries[0].item, item, tag + " expense item");
      assertEqual(r.entries[1].item, item, tag + " income item");
    }
    assert(!r.needsCheck, tag + " should not need a guess-check: " + ((r.entries[0].uncertaintyReasons || []).concat(r.entries[1].uncertaintyReasons || []).join(",")));
  }

  checkPair("30 ரூவா கழி 50 ரூவா வருது", 30, 50, null, "30 ruva kazhi 50 varudhu Tamil");
  checkPair("30 ரூபாய் போச்சு 50 வந்துச்சு", 30, 50, null, "30 rupees pochu 50 vandhuchu Tamil");
  checkPair("30 pochu 50 vandhuchu", 30, 50, null, "30 pochu 50 vandhuchu Tanglish");
  checkPair("thakkali 30 ku vaangi 50 ku vithen", 30, 50, "தக்காளி", "thakkali 30 ku vaangi 50 ku vithen");
  checkPair("30 kazhi 50 varudhu", 30, 50, null, "30 kazhi 50 varudhu");
  checkPair("30 ரூவா கழிச்சு 50 வருது", 30, 50, null, "kazhichu form");
  checkPair("ஐம்பது போனது நூறு வந்துச்சு", 50, 100, null, "Tamil number words pair");
  checkPair("தக்காளி 30க்கு வாங்கினேன் 50க்கு வித்தேன்", 30, 50, "தக்காளி", "vaanginen / vithen Tamil");
  checkPair("முப்பது ரூவா கழி ஐம்பது வருது", 30, 50, null, "muppathu / aimbadhu pair");
  checkPair("onion 40 pochu 70 vandhuchu", 40, 70, "வெங்காயம்", "onion Tanglish item");

  const loss = parseUtterances("80 pochu 50 vandhuchu");
  assert(loss.ok && loss.paired, "loss pair still saves both");
  assertEqual(loss.margin, -30, "negative margin when spent more");

  const led0 = createLedger([]);
  const deal = parseUtterances("30 kazhi 50 varudhu");
  const a = led0.add(parsedToEntry(deal.entries[0], "2026-11-18"));
  assert(a.ok, "save pair expense");
  const b = createLedger(a.entries).add(parsedToEntry(deal.entries[1], "2026-11-18"));
  assert(b.ok, "save pair income");
  checkTotals(createLedger(b.entries), "2026-11-18", 50, 30, 20, "paired deal totals லாபம் 20");

  const multi = parseUtterances("5 idli 3 tea");
  assert(!multi.paired && multi.ok && multi.entries.length === 2, "5 idli 3 tea stays a multi-sale, not a pair");
  assertEqual(parseUtterance("selavu diesel 500").type, "expense", "selavu diesel still expense");
  const minus = parseUtterances("minus 50 discount");
  assert(!minus.paired, "discount is not a pair");
  assertEqual(minus.entries[0].amount, -50, "discount amount -50");
  const kazhivu = parseUtterances("கழிவு 50");
  assert(!kazhivu.paired, "கழிவு alone is not a spend/earn pair");
  const tea = parseUtterances("tea 20 glass 10 rupees");
  assert(!tea.paired && tea.entries.length === 1 && tea.entries[0].amount === 200, "tea 20 glass 10 stays one sale");
  const tom = parseUtterances("தக்காளி 3 கிலோ 90 ரூபாய்");
  assert(!tom.paired && tom.entries[0].type === "expense" && tom.entries[0].amount === 90, "tomato 3kg 90 stays one expense");
  assert(parsePairDeal("hello") == null, "parsePairDeal returns null when not a pair");
}


// ---------- v7: direct-save command parser (4 languages, names, multi-entry) ----------
{
  const L7 = require("../logic.js");
  const P7 = (t) => L7.parseCommand(t, {});
  const V7_CASES = [
    // [sentence, [[type, amount, name?, item?], ...]]
    ["20000 போடு", [["income", 20000]]],
    ["20000 podu", [["income", 20000]]],
    ["add 20000", [["income", 20000]]],
    ["20000 varavu", [["income", 20000]]],
    ["வரவு 20000", [["income", 20000]]],
    ["இருபதாயிரம் போடு", [["income", 20000]]],
    ["இருபதாயிரம் கழி", [["expense", 20000]]],
    ["500 kazhi", [["expense", 500]]],
    ["500 கழி", [["expense", 500]]],
    ["minus 500", [["expense", 500]]],
    ["selavu 300", [["expense", 300]]],
    ["அம்பது ரூபா கழி", [["expense", 50]]],
    ["100 tea Ravi peruku", [["income", 100, "Ravi", "டீ"]]],
    ["Ravi peruku 100 tea", [["income", 100, "Ravi", "டீ"]]],
    ["Ravi ke naam 100 chai", [["income", 100, "Ravi", "டீ"]]],
    ["रवि के नाम 100 की चाय", [["income", 100, "रवि", "டீ"]]],
    ["रवीच्या नावावर शंभर रुपये चहा", [["income", 100, "रवी", "டீ"]]],
    ["நூறு ரூபாய் டீக்கு ரவி பேருக்கு போடு, அம்பது ரூபாய் வடைக்கு குமார் பேருக்கு போடு", [["income", 100, "ரவி", "டீ"], ["income", 50, "குமார்", "வடை"]]],
    ["நூறு ரூபா டீக்கு ரவி பேருக்கு அம்பது ரூபா வடைக்கு குமார் பேருக்கு", [["income", 100, "ரவி", "டீ"], ["income", 50, "குமார்", "வடை"]]],
    ["add 20000 and minus 500", [["income", 20000], ["expense", 500]]],
    ["20000 podu 5000 kazhi", [["income", 20000], ["expense", 5000]]],
    ["100 tea um 50 vada", [["income", 100, "", "டீ"], ["income", 50, "", "வடை"]]],
    ["100 tea அப்புறம் 50 vada", [["income", 100, "", "டீ"], ["income", 50, "", "வடை"]]],
    ["100 चाय और 50 वडा", [["income", 100, "", "டீ"], ["income", 50, "", "வடை"]]],
    ["100 chai aur 50 vada", [["income", 100, "", "டீ"], ["income", 50, "", "வடை"]]],
    ["100 चहा आणि 50 वडा", [["income", 100, "", "டீ"], ["income", 50, "", "வடை"]]],
    ["5 idli 3 tea", [["income", 50, "", "இட்லி"], ["income", 30, "", "டீ"]]],
    ["बीस हज़ार डालो", [["income", 20000]]],
    ["bees hazaar jodo", [["income", 20000]]],
    ["पाच हजार खर्च", [["expense", 5000]]],
    ["वीस हजार टाका", [["income", 20000]]],
    ["दूध दोनशे खर्च", [["expense", 200, "", "பால்"]]],
    ["500 doodh kharcha", [["expense", 500, "", "பால்"]]],
    ["dedh sau chai", [["income", 150, "", "டீ"]]],
    ["ढाई सौ खर्च", [["expense", 250]]],
    ["do sau chai", [["income", 200, "", "டீ"]]],
    ["२०० चाय", [["income", 200, "", "டீ"]]],
    ["20 हजार डालो", [["income", 20000]]],
    ["20k podu", [["income", 20000]]],
    ["tea 20 glass 10 rupees", [["income", 200, "", "டீ"]]],
    ["kadan ramesh dosa 2 40", [["income", 80, "Ramesh", "தோசை"]]]
  ];
  for (const [text, want] of V7_CASES) {
    const r = P7(text);
    assert(r.ok, "v7 ok: " + text, JSON.stringify(r.failed));
    assertEqual(r.entries.length, want.length, "v7 entry count: " + text);
    want.forEach((w, i) => {
      const e = r.entries[i] || {};
      assertEqual(e.type, w[0], "v7 type #" + i + ": " + text);
      assertEqual(e.amount, w[1], "v7 amount #" + i + ": " + text);
      if (w.length > 2) assertEqual(e.customerName || "", w[2], "v7 name #" + i + ": " + text);
      if (w.length > 3) assertEqual(e.item, w[3], "v7 item #" + i + ": " + text);
    });
  }
  // credit links to the kadan book
  const kad = P7("kadan ramesh dosa 2 40").entries[0];
  assertEqual(kad.payMode, "credit", "v7 kadan payMode credit");
  const kadTa = P7("ரவி பேருக்கு கடன் 200").entries[0];
  assertEqual(kadTa.payMode, "credit", "v7 Tamil kadan credit");
  assertEqual(kadTa.customerName, "ரவி", "v7 Tamil kadan name");
  const udh = P7("Ravi ko udhaar 200 dosa likh do").entries[0];
  assertEqual(udh.payMode, "credit", "v7 Hindi udhaar credit");
  assertEqual(udh.customerName, "Ravi", "v7 Hindi udhaar name");
  // a name alone keeps cash
  assertEqual(P7("100 tea Ravi peruku").entries[0].payMode, "cash", "v7 name alone stays cash");
  // paired phrases still produce a margin
  for (const t of ["30 ரூவா கழி 50 ரூவா வருது", "30 kazhi 50 varudhu"]) {
    const r = P7(t);
    assert(r.paired, "v7 pair: " + t);
    assertEqual(r.margin, 20, "v7 pair margin: " + t);
    assertEqual(r.entries.length, 2, "v7 pair entries: " + t);
  }
  // discount keeps the old negative adjustment
  const disc = P7("minus 50 discount");
  assertEqual(disc.entries[0].amount, -50, "v7 discount -50");
  assertEqual(disc.entries[0].type, "income", "v7 discount stays income adj");
  // fallback only when no amount
  const none = P7("somethingweird");
  assert(!none.ok && none.needsSheet, "v7 no amount → sheet");
  assertEqual(P7("").ok, false, "v7 empty not ok");
  // vehicle still extracted
  assertEqual(P7("selavu diesel 500 vandi TN 01 AB 1234").entries[0].vehicleNo, "TN01AB1234", "v7 vehicle plate");
  // Devanagari word boundary (एक must not match inside एकदम)
  assert(!P7("एकदम बढ़िया").ok, "v7 एकदम is not a number");
  // number words in all scripts
  const NUM7 = [["இருபதாயிரம்", 20000], ["அம்பது", 50], ["நூத்தம்பது", 150], ["बीस हज़ार", 20000], ["ढाई सौ", 250], ["शंभर", 100], ["दोनशे", 200], ["दीडशे", 150], ["pachas", 50], ["shambhar", 100]];
  for (const [w, n] of NUM7) {
    const r = P7(w + " போடு");
    assertEqual(r.entries[0] && r.entries[0].amount, n, "v7 number word " + w);
  }
  // labels + speech languages
  assertEqual(L7.speechLangFor("ta"), "ta-IN", "speech ta");
  assertEqual(L7.speechLangFor("en"), "en-IN", "speech en");
  assertEqual(L7.speechLangFor("hi"), "hi-IN", "speech hi");
  assertEqual(L7.speechLangFor("mr"), "mr-IN", "speech mr");
  assertEqual(L7.itemLabel("டீ", "hi"), "चाय", "item label hi");
  assertEqual(L7.itemLabel("டீ", "mr"), "चहा", "item label mr");
  assertEqual(L7.itemLabel("டீ", "en"), "Tea", "item label en");
  assertEqual(L7.itemLabel("டீ", "ta"), "டீ", "item label ta");
  // WhatsApp summary in each language, with names
  const ents = [
    { id: "a", type: "income", date: "2026-11-18", item: "டீ", amount: 100, customerName: "Ravi", payMode: "cash" },
    { id: "b", type: "expense", date: "2026-11-18", item: "பால்", amount: 40, payMode: "cash" }
  ];
  const sumTa = L7.daySummaryTextLang(ents, "2026-11-18", "Kadai", "ta");
  const sumHi = L7.daySummaryTextLang(ents, "2026-11-18", "Kadai", "hi");
  const sumMr = L7.daySummaryTextLang(ents, "2026-11-18", "Kadai", "mr");
  const sumEn = L7.daySummaryTextLang(ents, "2026-11-18", "Kadai", "en");
  assert(/வரவு/.test(sumTa), "summary ta", sumTa);
  assert(/आमदनी|आय|बिक्री/.test(sumHi) && /60/.test(sumHi), "summary hi", sumHi);
  assert(/जमा|विक्री/.test(sumMr), "summary mr", sumMr);
  assert(/Income/i.test(sumEn) && !/[\u0B80-\u0BFF\u0900-\u097F]/.test(sumEn.replace(/Kadai/, "")), "summary en English only", sumEn);
  assert(/👤 Ravi: ₹100 — டீ/.test(sumTa), "summary ta lists name", sumTa);
  assert(/👤 Ravi: ₹100 — चाय/.test(sumHi), "summary hi lists name", sumHi);
  assert(/👤 Ravi: ₹100 — चहा/.test(sumMr), "summary mr lists name", sumMr);
  assert(/👤 Ravi: ₹100 — Tea/.test(sumEn), "summary en lists name", sumEn);
  // CSV keeps the name column
  assert(/Ravi/.test(L7.toCSV(ents)), "csv has name");
  // every language has every voice error text
  for (const code of ["no-speech", "not-allowed", "network", "audio-capture", "aborted"]) {
    const m = L7.voiceErrorMessage(code);
    assert(m.ta && m.en && m.hi && m.mr, "voice error 4 langs: " + code);
  }
}

// ---------- v7: every UI string has Hindi + Marathi ----------
{
  const fs = require("fs");
  const path = require("path");
  const DICT = require("../i18n.js").DICT;
  const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  const html = fs.readFileSync(path.join(__dirname, "..", "index.src.html"), "utf8");
  const keys = new Set(["This week", "This month", "Cash", "Credit", "Loss", "Profit"]);
  let m;
  const re = /\b(?:P|H|S|TL)\(\s*"((?:[^"\\]|\\.)*)"\s*,\s*"((?:[^"\\]|\\.)*)"\s*\)/g;
  while ((m = re.exec(app))) keys.add(JSON.parse('"' + m[2] + '"'));
  const re2 = /<span class="ta"(?: id="[^"]*")?>([^<]*)<\/span><span class="en"(?: id="[^"]*")?>([^<]*)<\/span>/g;
  while ((m = re2.exec(html))) if (m[2]) keys.add(m[2].replace(/&amp;/g, "&"));
  const re3 = /data-i18n-aria="[^"|]*\|([^"]*)"/g;
  while ((m = re3.exec(html))) keys.add(m[1]);
  assert(keys.size > 150, "i18n key scan found strings", String(keys.size));
  for (const k of keys) {
    const row = DICT[k];
    assert(row && row.hi && row.mr, "i18n hi+mr for: " + k);
    if (row) {
      assert(!/[\u0B80-\u0BFF]/.test(row.hi + row.mr), "i18n no Tamil in hi/mr: " + k);
    }
  }
}

// ---------- v8: units, spoken math, payments to people, fuzzy, alternatives ----------
{
  const L8 = require("../logic.js");
  const P8 = (t, o) => L8.parseCommand(t, o || {});
  const one = (t, exp, label) => {
    const r = P8(t);
    const e = r.entries && r.entries.length === 1 ? r.entries[0] : null;
    assert(!!e && r.ok, "v8 one entry: " + (label || t), JSON.stringify(r.failed || r.math || r.entries));
    if (!e) return null;
    for (const k of Object.keys(exp)) assertEqual(e[k], exp[k], "v8 " + (label || t) + " ." + k);
    return e;
  };
  // Units: qty + unit + amount → amount is the TOTAL, purchases are expenses
  const KG = [
    "இருபது கிலோ தக்காளி ஆயிரம் ரூபா", "20 கிலோ தக்காளி 1000 ரூபாய்", "20 kilo tamatar 1000 rupay",
    "20 kg tomato 1000", "20 किलो टमाटर 1000 रुपये", "२० किलो टोमॅटो १००० रुपये", "irupadhu kilo thakkali aayiram rooba"
  ];
  for (const t of KG) one(t, { type: "expense", amount: 1000, qty: 20, unit: "கிலோ", item: "தக்காளி" });
  one("500 gram sugar 30", { type: "expense", amount: 30, qty: 500, unit: "கிராம்" });
  one("2 litre milk 120", { amount: 120, qty: 2, unit: "லிட்டர்" });
  one("2 லிட்டர் பால் 120", { amount: 120, qty: 2, unit: "லிட்டர்" });
  one("2 packet milk 60", { amount: 60, qty: 2, unit: "பொட்டலம்" });
  one("2 पैकेट दूध 60", { amount: 60, qty: 2, unit: "பொட்டலம்" });
  one("1 dozen egg 80", { type: "expense", amount: 80, qty: 1, unit: "டஜன்", item: "முட்டை" });
  one("2 दर्जन अंडे 160", { amount: 160, qty: 2, unit: "டஜன்" });
  one("2 डझन अंडी 160", { amount: 160, qty: 2, unit: "டஜன்" });
  one("5 கிலோ உருளைக்கிழங்கு 200", { type: "expense", amount: 200, qty: 5, unit: "கிலோ" });
  one("1 kg chai patti 400", { type: "expense", amount: 400, qty: 1, unit: "கிலோ" });
  // Per-unit rate multiplies
  one("3 கிலோ வெங்காயம் கிலோ 50 ரூபா", { type: "expense", amount: 150, qty: 3, unitPrice: 50 }, "ta rate");
  one("கிலோ 50 ரூபா 3 கிலோ தக்காளி", { amount: 150, qty: 3, unitPrice: 50 }, "ta rate first");
  one("3 kilo pyaz 40 rupay kilo", { amount: 120, qty: 3, unitPrice: 40 }, "hinglish rate");
  one("2 kg onion ₹50 per kg", { amount: 100, qty: 2, unitPrice: 50, note: "" }, "en per kg");
  one("tamatar 5 kilo, kilo ka 40", { amount: 200, qty: 5 }, "rate in next segment");
  assert(/× ₹50 = ₹150/.test(P8("3 கிலோ வெங்காயம் கிலோ 50 ரூபா").entries[0].calc), "v8 rate calc text");
  // qty + unit, no amount → not saved, but qty/unit kept for the form
  for (const t of ["ஒரு கிலோ தக்காளி", "ரெண்டு கிலோ தக்காளி", "2 kilo tamatar"]) {
    const r = P8(t);
    const f = r.first || (r.failed || [])[0] || {};
    assert(!r.ok && f.unit === "கிலோ" && f.qty >= 1 && f.amount == null, "v8 qty-only → form: " + t, JSON.stringify(f));
  }
  // menu sale price logic unchanged
  one("tea 20 glass 10 rupees", { type: "income", amount: 200, qty: 20 }, "old tea glass");
  // unit display
  assertEqual(L8.qtyUnitLabel({ qty: 20, unit: "கிலோ" }), "20 kg", "v8 qtyUnitLabel en");
  assertEqual(L8.qtyUnitLabel({ qty: 20, unit: "கிலோ" }, "ta"), "20 கிலோ", "v8 qtyUnitLabel ta");
  assertEqual(L8.qtyUnitLabel({ qty: 2, unit: "டஜன்" }, "hi"), "2 दर्जन", "v8 qtyUnitLabel hi dozen");
  {
    const led = L8.createLedger([]);
    const r = led.add(L8.parsedToEntry(P8("20 kg tomato 1000").entries[0], "2026-11-19"));
    const csv = L8.toCSV(r.entries);
    assert(/QtyUnit/.test(csv) && /20 kg/.test(csv), "v8 CSV QtyUnit column", csv.split("\n")[1]);
    const sum = L8.daySummaryTextLang(r.entries, "2026-11-19", "Shop", "en");
    assert(/20 kg/.test(sum), "v8 summary shows 20 kg", sum);
    const sumTa = L8.daySummaryTextLang(r.entries, "2026-11-19", "கடை", "ta");
    assert(/20 கிலோ/.test(sumTa), "v8 Tamil summary shows 20 கிலோ", sumTa);
  }

  // Spoken arithmetic
  const MATH_SAVE = [
    ["50 into 3 tea", "income", 150], ["50 times 3 tea", "income", 150], ["50 x 3 tea", "income", 150],
    ["50 பெருக்கு 3 டீ", "income", 150], ["25 गुणा 4 चाय", "income", 100], ["25 गुणिले 4 चहा", "income", 100],
    ["25 guna 4 chai", "income", 100],
    ["200 plus 300 podu", "income", 500], ["200 கூட்டு 300 போடு", "income", 500], ["200 jod 300 jama", "income", 500],
    ["500 கழி 120 selavu", "expense", 380], ["500 minus 120 kharcha", "expense", 380], ["500 वजा 120 खर्च", "expense", 380],
    ["add 20000 minus 500", "income", 19500],
    ["1000 வகு 4 செலவு", "expense", 250], ["1000 divide 4 add", "income", 250]
  ];
  for (const [t, type, amt] of MATH_SAVE) {
    const e = one(t, { type, amount: amt }, "math " + t);
    if (e) assert(!!e.calc && e.calc.indexOf("₹" + amt) !== -1, "v8 calc text for " + t, e.calc);
  }
  assertEqual(P8("50 into 3 tea").entries[0].calc, "50 × 3 = ₹150", "v8 calc string format");
  const MATH_ONLY = [
    ["1000 வகு 4", 250, "÷"], ["1000 divide 4", 250, "÷"], ["1000 bhaag 4", 250, "÷"], ["1000 भाग 4", 250, "÷"],
    ["500 கழி 120", 380, "−"], ["25 into 4", 100, "×"], ["100 plus 50 into 2", 200, "×"]
  ];
  for (const [t, res, op] of MATH_ONLY) {
    const r = P8(t);
    assert(r.mathOnly === true && r.math && r.math.result === res && r.math.expr.indexOf(op) !== -1, "v8 math-only " + t, JSON.stringify(r.math));
    assert(!r.entries || r.entries.length === 0, "v8 math-only saves nothing: " + t);
  }
  // precedence: separators first, verbs never operators, pair phrase untouched
  {
    const r1 = P8("add 20000 and minus 500");
    assert(r1.entries.length === 2 && r1.entries[0].amount === 20000 && r1.entries[1].amount === 500, "v8 'and' splits before math");
    const r2 = P8("20000 podu 5000 kazhi");
    assert(r2.entries.length === 2 && r2.entries[1].type === "expense", "v8 podu is not an operator");
    const r3 = P8("30 kazhi 50 varudhu");
    assert(r3.paired === true && r3.margin === 20, "v8 pair phrase unchanged");
  }
  assertEqual(L8.applySpokenMath("10 into 2 plus 5").calcs[0].result, 25, "v8 × before +");

  // Payments to people
  const PAY = [
    ["ஒருத்தனுக்கு பத்தாயிரம் கொடுத்தேன்", "expense", 10000, "paid-to"],
    ["வேலைக்காரனுக்கு ரெண்டாயிரம் கொடுத்தேன்", "expense", 2000, "wage"],
    ["முருகனுக்கு 350 கொடுத்தேன்", "expense", 350, "paid-to", "முருகன்"],
    ["Ravi ko 400 diye", "expense", 400, "paid-to", "Ravi"],
    ["रवीला 400 दिले", "expense", 400, "paid-to", "रवी"],
    ["रवि को 400 दिए", "expense", 400, "paid-to"],
    ["paid Ravi 400", "expense", 400, "paid-to", "Ravi"],
    ["murugan ukku 350 kuduthen", "expense", 350, "paid-to"],
    ["ரவி எனக்கு 500 கொடுத்தான்", "income", 500, "received-from", "ரவி"],
    ["Ravi ne 300 diya", "income", 300, "received-from", "Ravi"],
    ["got 300 from Ravi", "income", 300, "received-from", "Ravi"],
    ["रवीने 300 दिले", "income", 300, "received-from"],
    ["कल्लू को 300 पगार दिया", "expense", 300, "wage"],
    ["कर्मचारी को 500 दिया", "expense", 500, "wage"]
  ];
  for (const [t, type, amt, cat, name] of PAY) {
    const e = one(t, { type, amount: amt, category: cat }, "pay " + t);
    if (e && name) assertEqual(e.customerName, name, "v8 pay name " + t);
  }
  {
    const r = P8("ராமுக்கு 500 கொடுத்தேன் சேகருக்கு 300 கொடுத்தேன் குமாருக்கு 200 கொடுத்தேன்");
    assert(r.ok && r.entries.length === 3, "v8 three payments in one sentence", JSON.stringify(r.entries.map((e) => [e.customerName, e.amount])));
    assertEqual(r.entries.map((e) => e.customerName).join(","), "ராம்,சேகர்,குமார்", "v8 three payment names");
    const r2 = P8("ராமுக்கு 500 கொடுத்தேன், சேகருக்கு 300 கொடுத்தேன், ரவி எனக்கு 200 கொடுத்தான்");
    assertEqual(r2.entries.map((e) => e.type).join(","), "expense,expense,income", "v8 mixed given/received");
    const adv = P8("karmachari ko 500 advance diya").entries[0];
    assertEqual(adv.wageKind, "advance", "v8 advance wage kind");
    const bill = P8("கரண்ட் பில்லுக்கு 800 கொடுத்தேன்").entries[0];
    assert(!bill.customerName, "v8 bill is not a person", bill.customerName);
    // a plain name is still not a payment
    const plain = P8("ரவி 100 டீ").entries[0];
    assert(plain && plain.type === "income" && plain.category !== "paid-to", "v8 name alone is not a payment");
  }
  // Person totals
  {
    const D8 = "2026-11-19";
    let entries = [];
    for (const e of P8("ராமுக்கு 500 கொடுத்தேன், சேகருக்கு 300 கொடுத்தேன், ரவி எனக்கு 200 கொடுத்தான்").entries) {
      entries = L8.createLedger(entries).add(L8.parsedToEntry(e, D8)).entries;
    }
    const rows = L8.personTotals(entries, D8);
    const ram = rows.find((r) => r.name === "ராம்");
    const ravi = rows.find((r) => r.name === "ரவி");
    assert(ram && ram.given === 500 && ravi && ravi.received === 200, "v8 personTotals", JSON.stringify(rows));
  }
  // Fuzzy + known names + alternatives
  {
    const f = L8.fuzzyFixItems("tomatto 2 kilo 80", []);
    assert(/tomato|தக்காளி/i.test(f.text) && f.fixes.length >= 1, "v8 fuzzy tomatto", JSON.stringify(f));
    one("tomatto 2 kilo 80", { item: "தக்காளி", amount: 80 }, "fuzzy parse");
    assertEqual(L8.matchKnownName("murugen", ["Murugan", "Ravi"]), "Murugan", "v8 known name fuzzy");
    assertEqual(L8.matchKnownName("ravi", ["Murugan", "Ravi"]), "Ravi", "v8 known name case");
    assertEqual(L8.matchKnownName("Selvam", ["Murugan", "Ravi"]), "", "v8 unknown name no match");
    assertEqual(L8.editDistance("kitten", "sitting"), 3, "v8 edit distance");
    const idx = L8.pickBestAlternative([
      { transcript: "tea wanted ten", confidence: 0.9 },
      { transcript: "tea 20 glass 10 rupees", confidence: 0.7 }
    ], {});
    assertEqual(idx, 1, "v8 pick the alternative that parses");
    assertEqual(L8.pickBestAlternative([{ transcript: "20000 podu", confidence: 0.9 }, { transcript: "20000 podu", confidence: 0.5 }], {}), 0, "v8 tie → first");
  }
  // Devanagari number words only at a word start
  one("कर्मचारी को 500 दिया", { amount: 500 }, "karmachari not 4");
}

// ---------- v9: voice fix (no second mic stream, clear errors, permission-safe timers) ----------
{
  const L9 = require("../logic.js");
  const fs9 = require("fs");
  const path9 = require("path");
  const appSrc = fs9.readFileSync(path9.join(__dirname, "..", "app.js"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  assert(!/getUserMedia\s*\(/.test(appSrc), "v9 app.js never calls getUserMedia (voice is SpeechRecognition only)");
  assert(!/AudioContext/.test(appSrc), "v9 app.js opens no AudioContext");
  assert(/maxAlternatives\s*=\s*5/.test(appSrc), "v9 maxAlternatives 5 kept");
  assert(/try\s*\{\s*rec\.start\(\);/.test(appSrc), "v9 rec.start wrapped in try/catch");
  const built = fs9.readFileSync(path9.join(__dirname, "..", "index.html"), "utf8");
  assert(!/getUserMedia\s*\(/.test(built.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "")), "v9 built index.html has no getUserMedia call");
  // every onerror code → its own message in 4 languages
  for (const code of ["no-speech", "not-allowed", "service-not-allowed", "network", "audio-capture", "language-not-supported", "no-start", "failed"]) {
    const m = L9.voiceErrorMessage(code);
    assert(m.ta && m.en && m.hi && m.mr, "v9 voice error 4 langs: " + code);
    assert(!/[\u0B80-\u0BFF]/.test(m.hi + m.mr + m.en), "v9 no Tamil in hi/mr/en: " + code);
  }
  const na = L9.voiceErrorMessage("not-allowed");
  assert(/Site settings/.test(na.en) && /Microphone/.test(na.en) && /Allow/.test(na.en) && /🔒/.test(na.en), "v9 not-allowed gives Chrome steps", na.en);
  assert(/Allow/.test(na.ta) && /Site settings/.test(na.hi) && /Site settings/.test(na.mr), "v9 not-allowed steps in ta/hi/mr");
  assert(L9.voiceErrorMessage("service-not-allowed").en !== na.en, "v9 service-not-allowed has its own message");
  assert(/another app/i.test(L9.voiceErrorMessage("audio-capture").en), "v9 audio-capture explains mic in use");
  assertEqual(L9.voiceErrorCode("aborted"), null, "v9 aborted is silent");
  for (const c of ["no-speech", "not-allowed", "service-not-allowed", "network", "audio-capture", "language-not-supported"]) assertEqual(L9.voiceErrorCode(c), c, "v9 error code " + c);
  assertEqual(L9.voiceErrorCode("bad-grammar"), "failed", "v9 unknown error → failed");
  // timers: no-speech countdown waits for the mic to open (first-use permission prompt)
  const T = (o, now) => L9.voiceTimeoutCode(Object.assign({ listening: true }, o), now);
  assertEqual(T({ audioStarted: false, tappedAt: 0 }, 8000), null, "v9 permission prompt: no timeout at 8 s");
  assertEqual(T({ audioStarted: false, tappedAt: 0 }, 20000), "no-start", "v9 mic never opened → no-start");
  assertEqual(T({ audioStarted: true, startedAt: 8000, gotSpeech: false }, 12000), null, "v9 countdown from audio start");
  assertEqual(T({ audioStarted: true, startedAt: 8000, gotSpeech: false }, 13500), "no-speech", "v9 no-speech after 5.5 s of open mic");
  assertEqual(T({ audioStarted: true, gotSpeech: true, lastResultAt: 1000 }, 3100), "done", "v9 silence after speech → done");
  assertEqual(T({ audioStarted: true, gotSpeech: true, lastResultAt: 1000 }, 2500), null, "v9 still talking");
  assertEqual(T({ holding: true, audioStarted: true, gotSpeech: false, startedAt: 0 }, 60000), null, "v9 hold-to-talk never times out while held");
  assertEqual(L9.voiceTimeoutCode({ listening: false }, 99999), null, "v9 not listening → nothing");
  // speech language per mode
  assertEqual(L9.speechLangFor("ta"), "ta-IN", "v9 ta-IN");
  assertEqual(L9.speechLangFor("en"), "en-IN", "v9 en-IN");
  assertEqual(L9.speechLangFor("hi"), "hi-IN", "v9 hi-IN");
  assertEqual(L9.speechLangFor("mr"), "mr-IN", "v9 mr-IN");
  assertEqual(L9.speechLangFor(null), "ta-IN", "v9 default ta-IN");
}

console.log(`\nPassed: ${passed}  Failed: ${failed}`);
if (failures.length) {
  console.log("\nFAILURES:");
  for (const f of failures) console.log(" - " + f);
  process.exit(1);
}

