/* Kadai Tracker UI. Typing is the primary path; one-shot voice is optional. */
(function () {
  "use strict";
  const L = window.KadaiLogic;
  const STORE_KEY = "kadai-tracker-v3";
  const SETTINGS_KEY = "kadai-tracker-settings-v3";

  const SALE_CHIPS = ["இட்லி", "தோசை", "மசாலா தோசை", "வடை", "பொங்கல்", "டீ", "காபி", "பால்", "பிற"];
  const EXPENSE_CHIPS = ["அரிசி", "உளுந்து", "எண்ணெய்", "பால்", "சீனி", "காய்கறி", "தக்காளி", "வாயு சிலிண்டர்", "வாடகை", "டீசல்", "சரிகட்டு", "பிற"];
  const MONTHS_TA = ["ஜனவரி", "பிப்ரவரி", "மார்ச்", "ஏப்ரல்", "மே", "ஜூன்", "ஜூலை", "ஆகஸ்ட்", "செப்டம்பர்", "அக்டோபர்", "நவம்பர்", "டிசம்பர்"];
  const DAYS_TA = ["ஞாயிறு", "திங்கள்", "செவ்வாய்", "புதன்", "வியாழன்", "வெள்ளி", "சனி"];
  const PAY_LABEL = {
    cash: { ta: "ரொக்கம்", en: "Cash" },
    upi: { ta: "UPI", en: "UPI" },
    credit: { ta: "கடன்", en: "Credit" }
  };

  /* ---------- v7 language helpers ----------
   * P(ta, en)  primary text in the chosen language (Hindi/Marathi from i18n.js, keyed by English)
   * H(ta, en)  stacked markup: primary on top, small English underneath (English mode: English only)
   * S(ta, en)  one-line text "primary / English" for toasts, aria-labels and error boxes
   */
  const I18N = window.KadaiI18n || { DICT: {} };
  const PAIRS = new Map();
  const LANGS = ["ta", "en", "hi", "mr"];
  function curLang() {
    const l = state && state.settings && state.settings.lang;
    return LANGS.indexOf(l) !== -1 ? l : "ta";
  }
  function P(ta, en) {
    const l = curLang();
    if (l === "ta") return ta;
    if (l === "en") return en;
    const row = I18N.DICT[en];
    return (row && row[l]) || en;
  }
  function H(ta, en) {
    const p = P(ta, en);
    if (curLang() === "en" || p === en) return '<span class="bi" data-dyn="1"><span class="ta">' + p + "</span></span>";
    return '<span class="bi" data-dyn="1"><span class="ta">' + p + '</span><span class="en">' + en + "</span></span>";
  }
  function TL(ta, en) {
    const p = P(ta, en);
    if (curLang() === "en" || p === en) return '<span class="tl"><span class="ta">' + p + "</span></span>";
    return '<span class="tl"><span class="ta">' + p + '</span><span class="en">' + en + "</span></span>";
  }
  function S(ta, en) {
    const p = P(ta, en);
    if (curLang() === "en" || p === en) return en;
    const out = p + " / " + en;
    PAIRS.set(out, [p, en]);
    return out;
  }
  function msgHtml(msg) {
    const m = String(msg == null ? "" : msg);
    if (PAIRS.has(m)) {
      const pair = PAIRS.get(m);
      return '<span class="ta">' + escapeHtml(pair[0]) + '</span><span class="en">' + escapeHtml(pair[1]) + "</span>";
    }
    return '<span class="ta">' + escapeHtml(m) + "</span>";
  }
  function setMsg(el, msg) {
    if (!el) return;
    if (!msg) { el.innerHTML = ""; return; }
    el.innerHTML = '<span class="bi" data-dyn="1">' + msgHtml(msg) + "</span>";
  }
  function itemName(item) {
    return L.itemLabel(item, curLang());
  }
  /** English name under a known item, for Tamil / Hindi / Marathi screens. */
  function itemEnSub(item) {
    if (curLang() === "en") return "";
    const en = L.itemLabel(item, "en");
    return en && en !== itemName(item) ? en : "";
  }
  function unitName(u) {
    return L.unitLabel(u, curLang());
  }
  function payLabel(pm) {
    const row = PAY_LABEL[pm] || PAY_LABEL.cash;
    return P(row.ta, row.en);
  }
  const DEFAULT_SHOP_TA = "இட்லி தோசை டீ கடை";

  const ICONS = {
    idli: '<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="50" rx="26" ry="9" fill="#5B8C3A"/><ellipse cx="32" cy="47" rx="24" ry="8" fill="#7CB35A"/><ellipse cx="20" cy="40" rx="11" ry="7" fill="#E8DCC8"/><ellipse cx="20" cy="38" rx="11" ry="7" fill="#FFFDF8"/><ellipse cx="44" cy="40" rx="11" ry="7" fill="#E8DCC8"/><ellipse cx="44" cy="38" rx="11" ry="7" fill="#FFFDF8"/><ellipse cx="32" cy="34" rx="11" ry="7" fill="#E8DCC8"/><ellipse cx="32" cy="32" rx="11" ry="7" fill="#FFFDF8"/><path d="M26 24c0-4 3-7 6-8" stroke="#C5B8A4" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M32 22c0-4 2-6 5-7" stroke="#C5B8A4" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>',
    dosa: '<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="52" rx="24" ry="8" fill="#D9C4A0"/><ellipse cx="32" cy="50" rx="22" ry="7" fill="#F3E6D0"/><path d="M12 42c2-14 14-24 28-22 8 1 14 8 16 16-8 2-18 3-28 0-6-2-12-4-16 6z" fill="#C4842A"/><path d="M14 40c2-10 10-18 22-17 10 1 16 8 18 15-10 1-20 0-28-3-5-2-9-1-12 5z" fill="#F2C56D"/><path d="M20 38c4-2 14-3 24 0" stroke="#C4842A" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>',
    vada: '<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="52" rx="22" ry="7" fill="#E5D3B3"/><ellipse cx="32" cy="38" rx="18" ry="16" fill="#B86A12"/><ellipse cx="32" cy="36" rx="18" ry="16" fill="#E8A02A"/><ellipse cx="24" cy="32" rx="2" ry="1.6" fill="#C47A1A"/><ellipse cx="42" cy="40" rx="1.8" ry="1.4" fill="#C47A1A"/><ellipse cx="32" cy="36" rx="6" ry="5.5" fill="#F3E6D0"/></svg>',
    pongal: '<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="54" rx="20" ry="6" fill="#C4B49A"/><path d="M12 36c0 12 9 20 20 20s20-8 20-20" fill="#8A9AA8"/><path d="M14 36c0 10 8 17 18 17s18-7 18-17" fill="#C5D0D8"/><ellipse cx="32" cy="36" rx="20" ry="7" fill="#9AA8B4"/><ellipse cx="32" cy="34" rx="18" ry="6" fill="#F6E3A8"/><ellipse cx="32" cy="32" rx="16" ry="5" fill="#FFE9B0"/><ellipse cx="24" cy="32" rx="3" ry="2" fill="#E8B84A"/><ellipse cx="38" cy="33" rx="3" ry="2" fill="#E8B84A"/><circle cx="30" cy="30" r="1.2" fill="#3A2416"/><circle cx="36" cy="31" r="1" fill="#3A2416"/></svg>',
    tea: '<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="56" rx="14" ry="4" fill="#C4B49A"/><ellipse cx="32" cy="54" rx="12" ry="3" fill="#E8DCC8"/><path d="M22 18h20l-3 32c0 4-6 6-7 6s-7-2-7-6z" fill="#D7E8EE"/><path d="M24 26h16l-2.2 24c0 3-5 4.5-5.8 4.5s-5.5-1.5-5.5-4.5z" fill="#8B4A1E"/><path d="M25 26h14l-1 7H26z" fill="#C47A3A"/><path d="M24 18h16" stroke="#A89880" stroke-width="2" stroke-linecap="round"/><path d="M28 10c0-4 8-4 8 2" stroke="#C5B8A4" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>',
    coffee: '<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="56" rx="20" ry="5" fill="#C4B49A"/><path d="M14 42c0 8 8 14 18 14s18-6 18-14" fill="#C5D0D8"/><ellipse cx="32" cy="42" rx="18" ry="6" fill="#AEB8C0"/><ellipse cx="32" cy="42" rx="16" ry="5" fill="#4A2A14"/><rect x="24" y="16" width="16" height="24" rx="3" fill="#C5D0D8"/><rect x="26" y="20" width="12" height="16" rx="2" fill="#4A2A14"/><path d="M26 20h12l-1 4H27z" fill="#7A4A28"/></svg>',
    dish: '<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="48" rx="24" ry="10" fill="#E5D3B3"/><ellipse cx="32" cy="44" rx="20" ry="8" fill="#F7F1E4"/><ellipse cx="32" cy="30" rx="14" ry="12" fill="#E8A64A"/><ellipse cx="32" cy="28" rx="12" ry="9" fill="#F2C56D"/></svg>',
    income: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#0A6B3C"/><path d="M12 6v12M6 12h12" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>',
    expense: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#B91C1C"/><path d="M6 12h12" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>',
    mic: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="24" y="8" width="16" height="28" rx="8" fill="#fff"/><path d="M18 30a14 14 0 0 0 28 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M32 44v10M22 54h20" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>',
    today: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" fill="currentColor" fill-opacity=".2" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 21v-7h6v7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    credit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h11a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" fill="currentColor" fill-opacity=".2" stroke="currentColor" stroke-width="1.8"/><path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    stock: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9l9-5 9 5-9 5-9-5z" fill="currentColor" fill-opacity=".2" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M3 9v6l9 5 9-5V9M12 14v6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    summary: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19V10h3v9H5zm5 0V5h3v14h-3zm5 0v-7h3v7h-3z" fill="currentColor"/></svg>'
  };

  function iconSvg(name) {
    return ICONS[name] || ICONS.dish;
  }

  function paintChromeIcons() {
    const mic = document.getElementById("micIcon");
    if (mic) mic.innerHTML = iconSvg("mic");
    const add = document.getElementById("addIcon");
    if (add) add.innerHTML = iconSvg("plus");
    const inc = document.getElementById("icoIncome");
    if (inc) inc.innerHTML = iconSvg("income");
    const exp = document.getElementById("icoExpense");
    if (exp) exp.innerHTML = iconSvg("expense");
    document.querySelectorAll("[data-ico]").forEach((el) => {
      el.innerHTML = iconSvg(el.getAttribute("data-ico"));
    });
  }

  const state = {
    date: L.todayISO(),
    entries: [],
    settings: { shopName: "இட்லி தோசை டீ கடை", menu: L.defaultMenu(), voiceLang: "ta-IN", lang: null, stock: L.defaultStockItems(), staff: [], wages: [], stockMoves: [], voiceMode: "tap", micPulse: false, voiceFixV9: true, recipes: {}, autoStockSince: null, lastBackup: null, backupSnoozeUntil: null, pin: null },
    pinUnlockedAt: 0,
    personFilter: "",
    pendingCalc: null,
    finalAlts: [],
    holding: false,
    audio: null,
    form: null,
    amountManual: false,
    formPay: "cash",
    tab: "Today",
    pendingParse: null,
    listening: false,
    recognition: null,
    silenceTimer: null,
    lastResultAt: 0,
    gotSpeech: false,
    finalText: "",
    interimText: "",
    pendingDeleteId: null,
    pendingPaidName: null,
    menuQty: 1,
    restartCount: 0,
    startedAt: 0,
    stopRequested: false,
    speechConfidence: null,
    shopSection: "stock",
    undoEntry: null,
    undoAction: null,
    lastSavedIds: [],
    qtyForMenuId: null,
    suppressMenuClick: false
  };

  function loadLegacyShop() {
    let stockV2 = null;
    let staffV2 = null;
    try {
      const r = localStorage.getItem("kadai-tracker-stock-v2");
      if (r) stockV2 = JSON.parse(r);
    } catch (e) { stockV2 = null; }
    try {
      const r = localStorage.getItem("kadai-tracker-staff-v2");
      if (r) staffV2 = JSON.parse(r);
    } catch (e) { staffV2 = null; }
    return { stockV2, staffV2 };
  }

  function applySettingsObject(parsed) {
    const shop = L.loadShopExtras(parsed || {}, loadLegacyShop());
    state.settings = {
      shopName: (parsed && parsed.shopName) || state.settings.shopName || "இட்லி தோசை டீ கடை",
      menu: L.normalizeMenu(parsed && parsed.menu),
      voiceLang: normalizeVoiceLang(parsed && parsed.voiceLang, parsed && parsed.lang),
      lang: parsed && LANGS.indexOf(parsed.lang) !== -1 ? parsed.lang : null,
      stock: shop.stock,
      staff: shop.staff,
      wages: shop.wages,
      stockMoves: shop.stockMoves,
      // v9: one-time reset — v8's mic meter (getUserMedia) broke voice on Android; meter off, tap mode.
      voiceMode: parsed && parsed.voiceFixV9 && parsed.voiceMode === "hold" ? "hold" : "tap",
      micPulse: !!(parsed && parsed.voiceFixV9 && parsed.micPulse === true),
      voiceFixV9: true,
      recipes: parsed && parsed.recipes,
      autoStockSince: parsed && parsed.autoStockSince,
      lastBackup: parsed && parsed.lastBackup,
      backupSnoozeUntil: parsed && parsed.backupSnoozeUntil,
      pin: parsed && parsed.pin
    };
    if (parsed && !parsed.voiceFixV9) state.settingsMigrated = true;
    // v10: fill in recipes / auto-stock start day / backup fields / PIN (never touches entries)
    if (!parsed || !parsed.autoStockSince || !parsed.recipes) state.settingsMigrated = true;
    state.settings = L.migrateV10(state.settings, state.entries, L.todayISO());
  }

  function normalizeVoiceLang(v, lang) {
    if (v === "tanglish") return "en-IN";
    if (["ta-IN", "en-IN", "hi-IN", "mr-IN"].indexOf(v) !== -1) return v;
    return L.speechLangFor(lang || "ta");
  }

  function loadStore() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        state.entries = Array.isArray(data) ? data : Array.isArray(data.entries) ? data.entries : [];
      }
    } catch (e) {
      state.entries = [];
    }
    try {
      const s = localStorage.getItem(SETTINGS_KEY);
      applySettingsObject(s ? JSON.parse(s) : null);
    } catch (e) { /* keep defaults */ }
  }

  /** Reconcile the automatic stock moves with the current entries (idempotent). */
  function syncStock() {
    try {
      const r = L.syncAutoStock(state.entries, state.settings);
      if (r.changed) { state.settings.stock = r.stock; state.settings.stockMoves = r.stockMoves; }
    } catch (e) { /* never block saving an entry because of stock maths */ }
  }

  function saveStore() {
    syncStock();
    localStorage.setItem(STORE_KEY, JSON.stringify(state.entries));
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
  }

  function ledger() {
    return L.createLedger(state.entries);
  }

  function formatMoney(n) {
    if (n == null || Number.isNaN(Number(n))) return "₹0";
    const num = L.roundMoney(Number(n));
    const abs = Math.abs(num);
    const formatted = abs.toLocaleString("en-IN", {
      minimumFractionDigits: num % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    });
    return (num < 0 ? "-₹" : "₹") + formatted;
  }

  function formatDateTa(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    const l = curLang();
    if (l === "ta") return `${d} ${MONTHS_TA[m - 1]}, ${DAYS_TA[dt.getDay()]}`;
    try {
      return new Intl.DateTimeFormat(l + "-IN", { day: "numeric", month: "long", weekday: "long" }).format(dt);
    } catch (e) {
      return iso;
    }
  }

  function isToday(iso) {
    return iso === L.todayISO();
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  const UNDO_MS = 8000;

  function toast(msg, opts) {
    opts = opts || {};
    const el = document.getElementById("toast");
    const msgEl = document.getElementById("toastMsg") || el;
    const undoBtn = document.getElementById("toastUndo");
    const editBtn = document.getElementById("toastEdit");
    msgEl.innerHTML = opts.html ? msg : msgHtml(msg);
    if (undoBtn) undoBtn.hidden = !(opts.undo && (state.undoAction || state.undoEntry));
    if (editBtn) editBtn.hidden = !(opts.edit && state.lastSavedIds && state.lastSavedIds.length);
    el.classList.add("show");
    clearTimeout(toast._t);
    const ms = opts.ms || (opts.undo ? UNDO_MS : 2800);
    toast._t = setTimeout(() => {
      el.classList.remove("show");
      if (opts.undo) {
        state.undoEntry = null;
        state.undoAction = null;
        if (undoBtn) undoBtn.hidden = true;
      }
      if (editBtn) editBtn.hidden = true;
    }, ms);
  }

  function hideToast() {
    clearTimeout(toast._t);
    const el = document.getElementById("toast");
    if (el) el.classList.remove("show");
    const u = document.getElementById("toastUndo");
    if (u) u.hidden = true;
    const e = document.getElementById("toastEdit");
    if (e) e.hidden = true;
  }

  function undoLast() {
    const action = state.undoAction || (state.undoEntry ? { kind: "restore", entry: state.undoEntry } : null);
    state.undoEntry = null;
    state.undoAction = null;
    clearTimeout(toast._t);
    hideToast();
    state.lastSavedIds = [];
    if (!action) return;
    let result;
    if (action.kind === "removeMany") {
      const led = ledger();
      for (const id of action.ids) {
        result = led.remove(id);
        if (!result.ok) break;
      }
      if (action.wageIds && action.wageIds.length) {
        state.settings.wages = (state.settings.wages || []).filter((w) => action.wageIds.indexOf(w.id) === -1);
      }
    } else if (action.kind === "remove") {
      result = ledger().remove(action.id);
    } else if (action.kind === "revert") {
      result = ledger().edit(action.id, action.prev);
    } else if (action.kind === "restore") {
      result = ledger().add(action.entry);
    }
    if (!result || !result.ok) {
      toast(S("மீட்க முடியவில்லை", "Could not undo"));
      return;
    }
    applyLedger(result, S("செயல்தவிர்க்கப்பட்டது ✓", "Undone ✓"));
  }
  function undoDelete() { undoLast(); }

  function speechSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  function parsedHint(inputEl, hintEl) {
    const raw = inputEl.value.trim();
    if (!raw) {
      hintEl.textContent = "";
      hintEl.className = "hint";
      return null;
    }
    const n = L.parseTamilNumber(raw);
    if (n == null) {
      hintEl.textContent = S("எண்ணைப் புரிந்துகொள்ளவில்லை", "Could not read this number");
      hintEl.className = "hint bad";
      return null;
    }
    const moneyish = hintEl.id !== "hintQty" && hintEl.id !== "hintRefQty";
    hintEl.textContent = "→ " + (moneyish ? formatMoney(n) : String(n));
    hintEl.className = "hint ok";
    return n;
  }

  function fieldNumber(id) {
    const el = document.getElementById(id);
    const raw = el.value.trim();
    if (!raw) return { empty: true, value: null };
    return { empty: false, value: L.parseTamilNumber(raw), raw };
  }

  const DEFAULT_SHOP = { ta: DEFAULT_SHOP_TA, en: "Idli Dosa Tea Stall", hi: "इडली डोसा चाय दुकान", mr: "इडली डोसा चहा दुकान" };
  /** Any language's default name counts as "not typed by the user" (v8 fix: Hindi name stuck in Tamil mode). */
  function isDefaultShopName(n) {
    const t = String(n || "").trim();
    return !t || Object.keys(DEFAULT_SHOP).some((k) => DEFAULT_SHOP[k] === t);
  }
  function shopTitle() {
    const n = state.settings.shopName;
    return isDefaultShopName(n) ? DEFAULT_SHOP[curLang()] : n;
  }

  function render() {
    applyStaticLang();
    document.getElementById("shopName").textContent = shopTitle();
    document.getElementById("dateLabel").textContent = formatDateTa(state.date);
    document.getElementById("dateInput").value = state.date;
    document.getElementById("todayBtn").hidden = isToday(state.date);

    const t = L.computeTotals(state.entries, state.date);
    document.getElementById("totIncome").textContent = formatMoney(t.income);
    document.getElementById("totExpense").textContent = formatMoney(t.expense);
    const profitEl = document.getElementById("totProfit");
    profitEl.textContent = profitText(t.profit);
    const card = profitEl.closest(".tot");
    card.classList.toggle("neg", !profitHidden() && t.profit < 0);
    card.classList.toggle("masked", profitHidden());

    const pay = L.paymentBreakdown(state.entries, state.date);
    document.getElementById("payLine").innerHTML =
      `<span>${TL("ரொக்கம்", "Cash")} ${formatMoney(pay.cash)}</span>` +
      `<span>UPI ${formatMoney(pay.upi)}</span>` +
      `<span>${TL("கடன்", "Credit")} ${formatMoney(pay.credit)}</span>`;

    document.getElementById("panelToday").hidden = state.tab !== "Today";
    document.getElementById("panelKadan").hidden = state.tab !== "Kadan";
    document.getElementById("panelSummary").hidden = state.tab !== "Summary";
    document.getElementById("panelShop").hidden = state.tab !== "Shop";
    renderStockAlert();
    if (state.tab === "Shop") renderShop();
    document.querySelectorAll(".tabbar button").forEach((b) => {
      b.classList.toggle("on", b.getAttribute("data-tab") === state.tab);
    });
    document.querySelectorAll("#langTog button").forEach((b) => {
      b.classList.toggle("on", b.getAttribute("data-lang") === state.settings.voiceLang);
    });

    document.querySelectorAll("[data-setlang]").forEach((b) => {
      b.classList.toggle("on", b.getAttribute("data-setlang") === curLang());
    });
    document.querySelectorAll("[data-voicemode]").forEach((b) => {
      b.classList.toggle("on", b.getAttribute("data-voicemode") === (state.settings.voiceMode || "tap"));
    });
    const nf = document.getElementById("setMicPulse");
    if (nf) nf.checked = state.settings.micPulse === true;
    syncMicLabel();
    renderPersons();

    renderMenu();
    renderList();
    renderKadan();
    renderSummary();
    renderBanners();
    renderBackupSettings();
    renderPinSettings();
  }

  function renderMenu() {
    const box = document.getElementById("menuGrid");
    box.innerHTML = (state.settings.menu || []).map((m) => {
      const l = curLang();
      let main = m.nameTa || m.nameEn;
      if (l === "en") main = m.nameEn || m.nameTa;
      else if (l !== "ta") {
        const tr = L.itemLabel(m.nameTa, l);
        main = tr !== m.nameTa ? tr : (m.nameEn || m.nameTa);
      }
      const label = escapeHtml(main);
      const en = l !== "en" && m.nameEn && m.nameEn !== main ? `<span class="en">${escapeHtml(m.nameEn)}</span>` : "";
      const icon = iconSvg(m.id);
      const on = state.qtyForMenuId === m.id ? " on-qty" : "";
      return `<button type="button" class="menu-btn${on}" data-menu="${escapeHtml(m.id)}">
        <span class="menu-ico" aria-hidden="true">${icon}</span>
        <span class="nm bi" style="align-items:center"><span class="ta">${label}</span>${en}</span>
        <div class="pr">${formatMoney(m.price)}</div>
      </button>`;
    }).join("");
  }

  function renderList() {
    const pf = String(state.personFilter || "").trim().toLowerCase();
    const bar = document.getElementById("filterBar");
    if (bar) {
      bar.hidden = !pf;
      bar.innerHTML = pf ? '<button type="button" id="clearFilter">✕ 👤 ' + escapeHtml(state.personFilter) + " — " + TL("எல்லாம் காட்டு", "Show all") + "</button>" : "";
    }
    const list = state.entries
      .filter((e) => e.date === state.date)
      .filter((e) => !pf || String(e.customerName || "").trim().toLowerCase() === pf)
      .slice()
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")) || String(b.id).localeCompare(String(a.id)));
    const box = document.getElementById("entryList");
    if (!list.length) {
      box.innerHTML = '<div class="empty">' + H("இன்று இன்னும் பதிவே இல்லை. மேலே பேசவும், தட்டச்சு செய்யவும், அல்லது மெனுவைத் தட்டவும்.", "No entries yet today. Speak, type, or tap a menu picture above.") + "</div>";
      return;
    }
    const fxMap = L.stockEffectsByEntry(state.settings.stockMoves);
    box.innerHTML = list.map((e) => {
      const signClass = e.type === "income" ? "in" : "ex";
      const fx = (fxMap.get(e.id) || []).map((m) => {
        const si = (state.settings.stock || []).find((x) => x.id === m.itemId);
        return si ? `<span class="meta stock-fx">🥣 ${escapeHtml(stockName(si))} ${m.type === "out" ? "−" : "+"}${escapeHtml(String(m.qty))} ${escapeHtml(unitName(si.unit))}</span>` : "";
      }).join("");
      const kind = e.type === "income" ? TL("வரவு", "In") : TL("செலவு", "Ex");
      const pm = L.payModeOf(e);
      const pay = `<span class="pay ${pm}">${TL(PAY_LABEL[pm].ta, PAY_LABEL[pm].en)}</span>`;
      const quLocal = L.qtyUnitLabel(e, curLang());
      const quEn = L.qtyUnitLabel(e);
      const qtyBit = e.qty != null && !Number.isNaN(Number(e.qty))
        ? `<span class="meta">${escapeHtml(quLocal)}${curLang() !== "en" && quEn !== quLocal ? " (" + escapeHtml(quEn) + ")" : ""}${e.unitPrice != null ? " × " + formatMoney(e.unitPrice) : ""}</span>`
        : "";
      const calcBit = e.calc ? `<span class="meta calc">🧮 ${escapeHtml(e.calc)}</span>` : "";
      const veh = e.type === "expense" && e.vehicleNo ? `<span class="meta">${escapeHtml(S("வாகனம்", "Vehicle"))}: ${escapeHtml(e.vehicleNo)}</span>` : "";
      const cust = e.customerName
        ? (pm === "credit"
          ? `<span class="meta who">👤 ${escapeHtml(S("கடன்", "Credit"))}: ${escapeHtml(e.customerName)}${e.creditPaid ? " (" + escapeHtml(S("செலுத்தியது", "paid")) + ")" : ""}</span>`
          : `<span class="meta who">👤 ${escapeHtml(e.customerName)}</span>`)
        : "";
      const note = e.note ? `<span class="note">${escapeHtml(S("குறிப்பு", "Note"))}: ${escapeHtml(e.note)}</span>` : "";
      const adj = Number(e.amount) < 0 ? `<span class="adj-tag">${TL("சரிகட்டு", "Adj")}</span>` : "";
      const sub = itemEnSub(e.item);
      const canStep = e.type === "income" && e.unitPrice != null && Number(e.amount) >= 0;
      const stepper = canStep
        ? `<button type="button" class="qty-btn" data-act="qty" data-delta="-1" data-id="${escapeHtml(e.id)}">−</button><button type="button" class="qty-btn" data-act="qty" data-delta="1" data-id="${escapeHtml(e.id)}">+</button>`
        : "";
      return `<article class="row ${signClass}" data-id="${escapeHtml(e.id)}">
        <div class="row-main">
          <div class="item">${escapeHtml(itemName(e.item) || "—")}${sub ? `<span class="en-sub">${escapeHtml(sub)}</span>` : ""}</div>
          <div class="row-top">
            <span class="kind">${kind}</span>${pay}${adj}
          </div>
          <div class="row-meta">${qtyBit}${calcBit}${veh}${cust}${note}${fx}</div>
        </div>
        <div class="amt">${formatMoney(e.amount)}</div>
        <div class="row-actions">
          ${stepper}
          <button type="button" class="btn-edit" data-act="edit" data-id="${escapeHtml(e.id)}" aria-label="${escapeHtml(S("திருத்து", "Edit"))}">✏️</button>
          <button type="button" class="btn-del" data-act="delete" data-id="${escapeHtml(e.id)}" aria-label="${escapeHtml(S("நீக்கு", "Delete"))}">🗑️</button>
        </div>
      </article>`;
    }).join("");
  }

  /* ---------- v8: By person (given / received) ---------- */
  function personRowsHtml(rows) {
    const pf = String(state.personFilter || "").trim().toLowerCase();
    return rows.map((r) => {
      const bits = [];
      if (r.given) bits.push(`<span class="give">${escapeHtml(S("கொடுத்தது", "Given"))} ${formatMoney(r.given)}</span>`);
      if (r.received) bits.push(`<span class="get">${escapeHtml(S("பெற்றது", "Received"))} ${formatMoney(r.received)}</span>`);
      if (r.credit) bits.push(`<span class="give">${escapeHtml(S("கடன்", "Credit"))} ${formatMoney(r.credit)}</span>`);
      return `<button type="button" class="person-row${r.name.toLowerCase() === pf ? " on" : ""}" data-person="${escapeHtml(r.name)}">
        <span class="pn">👤 ${escapeHtml(r.name)}</span>
        <span class="pv">${bits.join("<br>")}</span>
      </button>`;
    }).join("");
  }
  function renderPersons() {
    const rows = L.personTotals(state.entries, state.date);
    const head = `<h3>${H("பெயர் வாரியாக", "By person")}</h3><div class="help">${H("தட்டினால் அந்த நபரின் பதிவுகள் மட்டும்", "Tap a name to see only their entries")}</div>`;
    const card = document.getElementById("personCard");
    if (card) {
      card.hidden = !rows.length;
      card.innerHTML = rows.length ? head + personRowsHtml(rows) : "";
    }
    const sum = document.getElementById("personSumCard");
    if (sum) {
      sum.innerHTML = head + (rows.length ? personRowsHtml(rows) : "<p class='help'>" + H("இன்று பெயருடன் பதிவு இல்லை.", "No entries with a name today.") + "</p>");
    }
  }
  function setPersonFilter(name) {
    const cur = String(state.personFilter || "").toLowerCase();
    state.personFilter = cur === String(name || "").toLowerCase() ? "" : String(name || "");
    state.tab = "Today";
    render();
    const list = document.getElementById("entryList");
    if (list && state.personFilter && list.scrollIntoView) list.scrollIntoView({ block: "start" });
  }

  function renderKadan() {
    const book = L.kadanBook(state.entries);
    const box = document.getElementById("kadanList");
    if (!book.length) {
      box.innerHTML = '<div class="empty">' + H("நிலுவைக் கடன் இல்லை.", "No outstanding credit.") + "</div>";
      return;
    }
    box.innerHTML = book.map((g) => {
      const lines = g.entries.map((e) => `${e.date} · ${escapeHtml(itemName(e.item) || "")} · ${formatMoney(e.amount)}`).join("<br>");
      return `<div class="card">
        <div class="kadan-row">
          <div>
            <div style="font-weight:700;font-size:18px">${escapeHtml(g.name)}</div>
            <div class="row-meta">${g.count} ${escapeHtml(S("பதிவு", "entries"))}<br>${lines}</div>
          </div>
          <div style="text-align:right">
            <div class="amt" style="color:var(--saffron)">${formatMoney(g.owed)}</div>
            <button type="button" class="ok" data-paid="${escapeHtml(g.name)}" style="margin-top:8px;padding:8px 12px">${H("செலுத்தினார்", "Mark paid")}</button>
          </div>
        </div>
      </div>`;
    }).join("");
  }

  function rangeCard(titleTa, titleEn, from, to) {
    const t = L.computeTotalsRange(state.entries, from, to);
    const top = L.topSelling(state.entries, from, to, 5);
    return `${H(titleTa, titleEn)}<div class="help">${from} – ${to}</div>
      <div class="pay-line" style="margin-top:10px">
        <span>${TL("வரவு", "In")} ${formatMoney(t.income)}</span>
        <span>${TL("செலவு", "Ex")} ${formatMoney(t.expense)}</span>
        <span>${TL("லாபம்", "Profit")} ${profitText(t.profit)}</span>
      </div>`;
  }

  function renderSummary() {
    const d = state.date;
    const t = L.computeTotals(state.entries, d);
    const pay = L.paymentBreakdown(state.entries, d);
    document.getElementById("eodCard").innerHTML =
      `${H("இன்றைய சுருக்கம்", "End-of-day summary")}<div class="help">${escapeHtml(formatDateTa(d))}</div>
       <p style="font-weight:700;margin:10px 0 6px">${escapeHtml(shopTitle())}</p>
       <div>${TL("வரவு", "Income")}: <strong>${formatMoney(t.income)}</strong></div>
       <div>${TL("செலவு", "Expense")}: <strong>${formatMoney(t.expense)}</strong></div>
       <div>${TL("லாபம்", "Profit")}: <strong>${profitText(t.profit)}</strong></div>
       <div class="pay-line">
         <span>${TL("ரொக்கம்", "Cash")} ${formatMoney(pay.cash)}</span>
         <span>UPI ${formatMoney(pay.upi)}</span>
         <span>${TL("கடன்", "Credit")} ${formatMoney(pay.credit)}</span>
       </div>
       <div style="margin-top:8px;color:var(--muted)">${TL("நிலுவைக் கடன்", "Unpaid credit")}: ${formatMoney(pay.unpaidCredit)}</div>`;
    document.getElementById("weekCard").innerHTML = rangeCard("இந்த வாரம்", "This week", L.startOfWeek(d), L.endOfWeek(d));
    document.getElementById("monthCard").innerHTML = rangeCard("இந்த மாதம்", "This month", L.startOfMonth(d), L.endOfMonth(d));
    const top = L.topSelling(state.entries, L.startOfMonth(d), L.endOfMonth(d), 8);
    document.getElementById("topCard").innerHTML =
      H("இந்த மாதம் அதிகம் விற்றவை", "Top-selling items this month") +
      (top.length
        ? "<ol style='margin:10px 0 0;padding-left:20px'>" + top.map((x) => `<li><strong>${escapeHtml(itemName(x.item))}</strong> — ${formatMoney(x.amount)}${x.qty ? " (" + x.qty + ")" : ""}</li>`).join("") + "</ol>"
        : "<p class='help'>" + H("இந்த மாதம் வரவுப் பதிவு இல்லை.", "No sales this month.") + "</p>");
  }

  function setTab(tab) {
    state.tab = tab;
    render();
  }

  function applyLedger(result, okMsg, opts) {
    if (!result.ok) return false;
    state.entries = result.entries;
    saveStore();
    render();
    if (okMsg && !(opts && opts.skipToast)) toast(okMsg);
    return true;
  }

  function savedToast(detail) {
    const head = S("சேமிக்கப்பட்டது ✓", "Saved ✓");
    if (!detail) return head;
    const pair = PAIRS.get(head);
    if (pair) {
      const out = pair[0] + "  " + detail + " / " + pair[1] + "  " + detail;
      PAIRS.set(out, [pair[0] + "  " + detail, pair[1] + "  " + detail]);
      return out;
    }
    return head + "  " + detail;
  }

  function addMenuSale(menuId, qtyOverride) {
    if (gated("add-entry", { date: state.date }, () => addMenuSale(menuId, qtyOverride), "addPast")) return;
    const m = (state.settings.menu || []).find((x) => x.id === menuId);
    if (!m) return;
    const price = Number(m.price);
    if (!price) {
      toast(S("முதலில் விலையை அமைப்புகளில் போடவும்", "Set a price in Settings first"));
      return;
    }
    const name = m.nameTa || m.nameEn;
    const shown = curLang() === "en" ? (m.nameEn || name) : (curLang() === "ta" ? name : (L.itemLabel(m.nameTa, curLang()) !== m.nameTa ? L.itemLabel(m.nameTa, curLang()) : (m.nameEn || name)));
    const addQty = Math.max(1, Number(qtyOverride != null ? qtyOverride : 1) || 1);
    const existing = state.entries.find((e) =>
      e.date === state.date &&
      e.type === "income" &&
      e.item === name &&
      e.unitPrice === price &&
      L.payModeOf(e) === "cash" &&
      !e.creditPaid &&
      Number(e.amount) >= 0
    );
    const led = ledger();
    if (existing) {
      const prev = { qty: existing.qty, amount: existing.amount, unitPrice: existing.unitPrice, unit: existing.unit };
      const qty = (existing.qty || 1) + addQty;
      const result = led.edit(existing.id, { qty, amount: L.roundMoney(qty * price), unitPrice: price, unit: m.unit });
      state.undoAction = { kind: "revert", id: existing.id, prev };
      state.lastSavedIds = [existing.id];
      applyLedger(result, null, { skipToast: true });
      toast(savedToast(shown + " × " + qty), { undo: true, edit: true });
      return;
    }
    const result = led.add({
      type: "income",
      date: state.date,
      item: name,
      qty: addQty,
      unit: m.unit || "எண்ணிக்கை",
      unitPrice: price,
      amount: L.roundMoney(addQty * price),
      payMode: "cash"
    });
    if (result.ok && result.entry) {
      state.undoAction = { kind: "remove", id: result.entry.id };
      state.lastSavedIds = [result.entry.id];
    }
    applyLedger(result, null, { skipToast: true });
    toast(savedToast(shown + " × " + addQty), { undo: true, edit: true });
  }

  function setMenuQty(n) {
    const q = Math.max(1, Math.min(99, Math.round(Number(n) || 1)));
    state.menuQty = q;
    const val = document.getElementById("qtyVal");
    if (val) val.textContent = String(q);
    document.querySelectorAll("#qtyPick [data-setqty]").forEach((b) => {
      b.classList.toggle("on", Number(b.getAttribute("data-setqty")) === q);
    });
  }

  function hideQtyPick() {
    state.qtyForMenuId = null;
    const pick = document.getElementById("qtyPick");
    if (pick) pick.hidden = true;
    document.querySelectorAll(".menu-btn.on-qty").forEach((b) => b.classList.remove("on-qty"));
  }

  function showQtyPick(menuId) {
    state.qtyForMenuId = menuId;
    const pick = document.getElementById("qtyPick");
    if (pick) pick.hidden = false;
    setMenuQty(1);
    document.querySelectorAll(".menu-btn").forEach((b) => {
      b.classList.toggle("on-qty", b.getAttribute("data-menu") === menuId);
    });
  }

  function setAddMenuOpen(open) {
    const menu = document.getElementById("addMenu");
    const btn = document.getElementById("btnAdd");
    if (!menu) return;
    menu.hidden = !open;
    if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function changeQty(id, delta) {
    const entry = state.entries.find((e) => e.id === id);
    if (!entry || entry.unitPrice == null) return;
    if (gated("edit-entry", { entry }, () => changeQty(id, delta), "edit")) return;
    const qty = (entry.qty == null ? 1 : Number(entry.qty)) + delta;
    if (qty <= 0) {
      askDelete(id);
      return;
    }
    applyLedger(ledger().edit(id, { qty, amount: L.roundMoney(qty * Number(entry.unitPrice)) }));
  }

  /* ---------- Voice (one-shot) ---------- */
  function recLang() {
    return normalizeVoiceLang(state.settings.voiceLang, curLang());
  }

  function syncVoicePanel() {
    const panel = document.getElementById("voicePanel");
    if (!panel) return;
    const err = document.getElementById("voiceError");
    const note = document.getElementById("voiceNote");
    const open = !!(state.listening || (err && !err.hidden) || (note && !note.hidden));
    panel.classList.toggle("open", open);
  }

  function hideVoiceError() {
    const box = document.getElementById("voiceError");
    if (box) box.hidden = true;
    syncVoicePanel();
  }

  function showVoiceError(code) {
    const msg = L.voiceErrorMessage(code);
    const l = curLang();
    const primary = msg[l] || msg.en;
    const box = document.getElementById("voiceError");
    const line = l === "en" ? msg.en : primary + " / " + msg.en;
    if (l !== "en") PAIRS.set(line, [primary, msg.en]);
    if (!box) {
      toast(line);
      return;
    }
    document.getElementById("voiceErrorTa").textContent = primary;
    document.getElementById("voiceErrorEn").textContent = l === "en" ? "" : msg.en;
    box.hidden = false;
    syncVoicePanel();
    toast(line);
  }

  function syncMicLabel() {
    const ta = document.getElementById("micLabel");
    const en = document.getElementById("micLabelEn");
    if (!ta) return;
    let pair = ["பேசு", "Speak"];
    if (state.listening) pair = ["நிறுத்து", "Stop"];
    else if ((state.settings.voiceMode || "tap") === "hold") pair = ["பிடித்து பேசு", "Hold & speak"];
    ta.textContent = P(pair[0], pair[1]);
    if (en) {
      en.textContent = pair[1];
      en.hidden = curLang() === "en" || P(pair[0], pair[1]) === pair[1];
    }
  }

  /* ---------- v9: listening state (SpeechRecognition events only — no second mic stream) ---------- */
  const PHASES = {
    starting: ["மைக் திறக்கிறது… Chrome அனுமதி கேட்டால் Allow அழுத்துங்கள்", "Opening the mic… if Chrome asks, tap Allow"],
    listening: ["🔴 கேட்கிறேன்… இப்போது பேசுங்கள்", "🔴 Listening… speak now"],
    hearing: ["🔴 கேட்கிறது…", "🔴 Hearing you…"]
  };
  function setListenPhase(phase) {
    state.listenPhase = phase || "";
    const box = document.getElementById("listenState");
    const mic = document.getElementById("micBig");
    if (mic) mic.classList.toggle("hearing", phase === "hearing");
    const wrap = document.getElementById("levelWrap");
    if (wrap) wrap.hidden = !phase;
    const meter = document.getElementById("levelMeter");
    if (meter) {
      meter.hidden = state.settings.micPulse !== true;
      meter.classList.toggle("pulse", phase === "hearing");
    }
    if (!box) return;
    if (!phase) { box.hidden = true; box.innerHTML = ""; return; }
    const pair = PHASES[phase] || PHASES.listening;
    box.hidden = false;
    box.className = "listen-state " + phase;
    box.innerHTML = H(pair[0], pair[1]);
  }
  /** Of the recogniser's alternatives, keep the one that parses into the most sensible entries. */
  function bestHeardText() {
    try {
      const segs = state.finalAlts || [];
      const tail = state.interimText.trim();
      if (!segs.length || !segs.some((s) => s.length > 1)) return null;
      const maxK = Math.max.apply(null, segs.map((s) => s.length));
      const cands = [];
      for (let k = 0; k < maxK; k++) {
        const parts = segs.map((s) => (s[Math.min(k, s.length - 1)] || {}).transcript || "");
        const confs = segs.map((s) => (s[Math.min(k, s.length - 1)] || {}).confidence || 0);
        cands.push({ transcript: (parts.join(" ") + " " + tail).replace(/\s+/g, " ").trim(), confidence: confs.reduce((x, y) => x + y, 0) / confs.length });
      }
      const idx = L.pickBestAlternative(cands, { menu: state.settings.menu });
      return cands[idx] ? cands[idx].transcript : null;
    } catch (e) {
      return null;
    }
  }

  function showLive() {
    const box = document.getElementById("liveBox");
    const fin = escapeHtml(state.finalText.trim());
    const inter = escapeHtml(state.interimText.trim());
    if (!fin && !inter) {
      box.innerHTML = state.listening
        ? H("கேட்கிறேன்… ஒரே வாக்கியத்தில் சொல்லுங்கள்", "Listening… say it in one sentence")
        : H("பேசுங்கள் அல்லது ஒரு வரியில் எழுதுங்கள்", "Speak or type one line");
      return;
    }
    const label = state.listening ? "" : '<span class="heard-lab">' + TL("கேட்டது", "Heard") + ":</span> ";
    box.innerHTML = label + (fin ? fin + " " : "") + (inter ? '<span class="interim">' + inter + "</span>" : "");
  }

  function clearSilence() {
    if (state.silenceTimer) {
      clearInterval(state.silenceTimer);
      state.silenceTimer = null;
    }
  }

  function stopListen(reason) {
    const was = state.listening;
    state.stopRequested = true;
    state.listening = false;
    state.holding = false;
    clearSilence();
    if (state.recognition) {
      const rec = state.recognition;
      state.recognition = null;
      try { rec.onend = null; rec.onerror = null; rec.onresult = null; rec.stop(); } catch (e) { /* ignore */ }
    }
    document.getElementById("micBig").classList.remove("listening");
    setListenPhase("");
    syncMicLabel();
    syncVoicePanel();
    const best = bestHeardText();
    const text = best || (state.finalText + " " + state.interimText).replace(/\s+/g, " ").trim();
    if (best && best !== state.finalText.trim()) state.finalText = best;
    if (text) { state.finalText = text; state.interimText = ""; }
    showLive();
    if (!was) return;
    if (text) runCommand(text, { source: "voice", speechConfidence: state.speechConfidence });
    else if (reason && reason !== "user") showVoiceError(reason === true ? "no-speech" : reason);
  }

  /**
   * v9: the same simple path as v7 — SpeechRecognition only. No getUserMedia stream is ever opened,
   * so nothing competes with Chrome for the microphone (that was the v8 Android failure).
   */
  function startListen() {
    hideVoiceError();
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const unsup = L.unsupportedVoiceCode(navigator.userAgent || "", !!SR);
    if (unsup) {
      showVoiceError(unsup);
      document.getElementById("quickEntry").focus();
      return;
    }
    if (!SR) {
      showVoiceError("unsupported");
      document.getElementById("quickEntry").focus();
      return;
    }
    if (state.listening) {
      stopListen("user");
      return;
    }
    if (state.recognition) {
      try { state.recognition.onend = null; state.recognition.onerror = null; state.recognition.abort(); } catch (e) { /* ignore */ }
      state.recognition = null;
    }
    state.finalText = "";
    state.interimText = "";
    state.finalAlts = [];
    state.gotSpeech = false;
    state.audioStarted = false;
    state.tappedAt = Date.now();
    state.lastResultAt = Date.now();
    state.startedAt = Date.now();
    state.restartCount = 0;
    state.stopRequested = false;
    state.speechConfidence = null;
    state.listening = true;
    document.getElementById("micBig").classList.add("listening");
    syncMicLabel();
    setListenPhase("starting");
    syncVoicePanel();
    showLive();

    // Mic blocked for this site? Say how to allow it (read-only check, never opens the mic).
    try {
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: "microphone" }).then((p) => {
          if (p && p.state === "denied" && state.listening && !state.audioStarted) stopListen("not-allowed");
        }).catch(() => { /* not supported */ });
      }
    } catch (e) { /* ignore */ }

    const markAudio = () => {
      if (!state.audioStarted) {
        state.audioStarted = true;
        state.startedAt = Date.now(); // no-speech countdown starts only when the mic is really open
      }
      if (state.listenPhase === "starting") setListenPhase("listening");
    };

    const startRec = () => {
      if (!state.listening || state.stopRequested) return;
      let rec;
      try {
        rec = new SR();
        rec.lang = recLang();
        rec.continuous = true;
        rec.interimResults = true;
        rec.maxAlternatives = 5;
      } catch (e) {
        stopListen("failed");
        return;
      }
      rec.onstart = markAudio;
      rec.onaudiostart = markAudio;
      rec.onsoundstart = () => { markAudio(); setListenPhase("hearing"); };
      rec.onspeechstart = () => { markAudio(); setListenPhase("hearing"); };
      rec.onspeechend = () => { if (state.listening) setListenPhase("listening"); };
      rec.onresult = function (ev) {
        try {
          markAudio();
          state.lastResultAt = Date.now();
          state.gotSpeech = true;
          let interim = "";
          const confs = [];
          for (let i = ev.resultIndex; i < ev.results.length; i++) {
            const res = ev.results[i];
            const alt = res && res[0];
            const t = (alt && alt.transcript) || "";
            if (alt && typeof alt.confidence === "number" && alt.confidence > 0) confs.push(alt.confidence);
            if (res && res.isFinal) {
              state.finalText = (state.finalText + " " + t).replace(/\s+/g, " ").trim();
              const alts = [];
              for (let k = 0; k < (res.length || 0); k++) {
                const a = res[k];
                if (a && a.transcript) alts.push({ transcript: a.transcript, confidence: typeof a.confidence === "number" ? a.confidence : 0 });
              }
              state.finalAlts.push(alts.length ? alts : [{ transcript: t, confidence: 0 }]);
            } else interim += t;
          }
          if (confs.length) {
            const minC = Math.min.apply(null, confs);
            state.speechConfidence = state.speechConfidence == null ? minC : Math.min(state.speechConfidence, minC);
          }
          state.interimText = interim;
          showLive();
        } catch (e) { /* keep listening */ }
      };
      rec.onerror = function (ev) {
        const err = ev && ev.error;
        if (err === "no-speech" && (state.gotSpeech || state.holding)) return; // late no-speech after we heard something
        const code = L.voiceErrorCode(err);
        if (!code) return; // aborted (our own stop)
        if (code === "no-speech") {
          // Chrome gave up waiting; finish now with the clear message unless the timer already did.
          stopListen("no-speech");
          return;
        }
        stopListen(code);
      };
      rec.onend = function () {
        if (!state.listening || state.stopRequested) return;
        if (state.holding && state.restartCount < 30) {
          state.restartCount += 1;
          startRec();
          return;
        }
        if (L.shouldRestartRecognition({
          listening: state.listening,
          gotSpeech: state.gotSpeech,
          stopRequested: state.stopRequested,
          restartCount: state.restartCount
        })) {
          state.restartCount += 1;
          startRec();
          return;
        }
        if (state.gotSpeech) stopListen("user");
        else if (state.audioStarted) {
          // Some Android builds end a session early even in continuous mode: retry quietly within the window.
          if (Date.now() - state.startedAt < L.VOICE.INITIAL_TIMEOUT_MS && state.restartCount < L.VOICE.MAX_RESTARTS) {
            state.restartCount += 1;
            startRec();
            return;
          }
          stopListen("no-speech");
        }
        // If the mic never opened (permission prompt still showing), the start timer decides.
      };
      state.recognition = rec;
      try {
        rec.start();
      } catch (e) {
        state.recognition = null;
        const name = e && e.name;
        stopListen(name === "NotAllowedError" ? "not-allowed" : "failed");
      }
    };
    startRec();

    clearSilence();
    state.silenceTimer = setInterval(() => {
      const code = L.voiceTimeoutCode({
        listening: state.listening,
        holding: state.holding,
        audioStarted: state.audioStarted,
        gotSpeech: state.gotSpeech,
        tappedAt: state.tappedAt,
        startedAt: state.startedAt,
        lastResultAt: state.lastResultAt
      }, Date.now());
      if (!code) return;
      stopListen(code === "done" ? "user" : code);
    }, 200);
  }

  /* ---------- v7: one command → save directly, toast with Undo + Edit ---------- */
  function entryLine(e) {
    const sign = e.type === "income" ? "+" : "−";
    const amt = formatMoney(Math.abs(Number(e.amount)));
    let label = itemName(e.item) || "";
    if (e.qty != null && e.unit && e.unit !== "எண்ணிக்கை" && e.unit !== "கிளாஸ்" && e.item) label = label + " " + L.qtyUnitLabel(e, curLang());
    else if (e.qty != null && e.unitPrice != null && e.item) label = label + " ×" + e.qty;
    const who = e.customerName ? " · 👤 " + e.customerName : "";
    const pm = L.payModeOf(e);
    const pay = pm !== "cash" ? " · " + payLabel(pm) : "";
    return sign + amt + " " + label + who + pay;
  }

  /**
   * Parse a spoken / typed sentence and save every entry in it at once.
   * Only when no amount can be read at all do we open the editable sheet.
   */
  function knownNames() {
    const set = new Map();
    (state.settings.staff || []).forEach((m) => { if (m && m.name) set.set(m.name.toLowerCase(), m.name); });
    (state.entries || []).forEach((e) => {
      const n = String(e.customerName || "").trim();
      if (n && !set.has(n.toLowerCase())) set.set(n.toLowerCase(), n);
    });
    return Array.from(set.values());
  }

  /** Staff member this payment belongs to: a matching name, or the only staff for "வேலைக்காரன்" / wage words. */
  function staffFor(parsed) {
    if (!parsed || parsed.type !== "expense") return null;
    const staff = state.settings.staff || [];
    if (!staff.length) return null;
    const name = String(parsed.customerName || "").trim();
    const hit = name ? L.matchKnownName(name, staff.map((m) => m.name)) : "";
    if (hit) return staff.find((m) => m.name === hit) || null;
    if ((parsed.category === "wage" || parsed.staffHint) && staff.length === 1) return staff[0];
    return null;
  }

  /**
   * Parse a spoken / typed sentence and save every entry in it at once.
   * Only when no amount can be read at all do we open the editable sheet.
   */
  function runCommand(text, opts) {
    opts = opts || {};
    const raw = String(text || "").trim();
    if (!raw) return false;
    if (gated("add-entry", { date: state.date }, () => runCommand(text, opts), "addPast")) return false;
    const result = L.parseCommand(raw, { menu: state.settings.menu, speechConfidence: opts.speechConfidence });
    const q = document.getElementById("quickEntry");
    if (result.mathOnly && result.math) {
      if (q && opts.source !== "voice") q.value = "";
      showCalc(result.math);
      return false;
    }
    if (!result.ok || !result.entries.length) {
      const f = result.first || (result.failed || [])[0];
      if (f && f.qty != null && f.amount == null && f.unit) {
        // "ஒரு கிலோ தக்காளி": quantity + unit known — open the form with the unit chosen, ask the amount
        openForm({ mode: "add", type: f.type === "income" ? "income" : "expense", seed: Object.assign({}, f, { amount: null, unitPrice: null }) });
        setTimeout(() => { const a = document.getElementById("fldUnitPrice"); if (a) a.focus(); }, 120);
        toast(S("விலையைப் போடவும் (கிலோ விலை அல்லது மொத்தம்)", "Enter the price (per unit or total)"));
        return false;
      }
      openConfirmation(raw);
      return false;
    }
    const led = ledger();
    const ids = [];
    const wageIds = [];
    const saved = [];
    const staffLines = [];
    const skipped = (result.failed || []).map((f) => f.raw).filter(Boolean);
    const known = knownNames();
    let last = null;
    for (const parsed of result.entries) {
      if (parsed.customerName) {
        const canon = L.matchKnownName(parsed.customerName, known);
        if (canon) parsed.customerName = canon;
      }
      let data = L.parsedToEntry(parsed, state.date);
      const member = staffFor(parsed);
      if (member) {
        const wr = L.recordWage(state.settings.wages, state.settings.staff, {
          staffId: member.id,
          kind: parsed.wageKind === "advance" ? "advance" : "daily",
          amount: parsed.amount,
          date: state.date,
          note: raw,
          paid: true
        });
        if (wr.ok && wr.expense) {
          state.settings.wages = wr.wages;
          wageIds.push(wr.record.id);
          data = Object.assign({}, wr.expense, { customerName: member.name, calc: parsed.calc || "", note: wr.expense.note });
          staffLines.push("👷 " + member.name + " — " + S("பணியாளர் கணக்கில் சேர்ந்தது", "added to staff account"));
        }
      }
      const res = led.add(data);
      if (res.ok) {
        ids.push(res.entry.id);
        saved.push(res.entry);
        last = res;
      } else {
        skipped.push(parsed.raw || parsed.item || "");
      }
    }
    if (!ids.length) {
      openConfirmation(raw);
      return false;
    }
    state.undoEntry = null;
    state.undoAction = { kind: "removeMany", ids: ids.slice(), wageIds };
    state.lastSavedIds = ids.slice();
    state.entries = last.entries;
    saveStore();
    render();
    if (q && opts.source !== "voice") q.value = "";
    hideCalc();
    const head = H("சேமிக்கப்பட்டது ✓", "Saved ✓").replace(/✓/g, saved.length > 1 ? "✓ (" + saved.length + ")" : "✓");
    let html = head;
    html += saved.map((e) => '<span class="t-line">' + escapeHtml(entryLine(e)) + "</span>" + (e.calc ? '<span class="t-line">🧮 ' + escapeHtml(e.calc) + "</span>" : "")).join("");
    staffLines.forEach((l) => { html += '<span class="t-line">' + escapeHtml(l) + "</span>"; });
    if (result.paired && result.margin != null) {
      html += '<span class="t-line">' + escapeHtml(S(Number(result.margin) < 0 ? "நஷ்டம்" : "லாபம்", Number(result.margin) < 0 ? "Loss" : "Profit")) + " " + formatMoney(result.margin) + "</span>";
    }
    if (skipped.length) {
      html += '<span class="t-warn">' + escapeHtml(S("புரியவில்லை, சேமிக்கவில்லை", "Not understood, not saved")) + ": " + escapeHtml(skipped.join(" · ")) + "</span>";
    }
    toast(html, { html: true, undo: true, edit: true, ms: UNDO_MS });
    return true;
  }

  /* ---------- v8: calculator card (math with no add / expense word) ---------- */
  function showCalc(math) {
    state.pendingCalc = math;
    document.getElementById("calcExpr").textContent = math.expr + " =";
    document.getElementById("calcRes").textContent = formatMoney(math.result);
    document.getElementById("calcCard").hidden = false;
  }
  function hideCalc() {
    state.pendingCalc = null;
    const c = document.getElementById("calcCard");
    if (c) c.hidden = true;
  }
  function saveCalc(type) {
    const m = state.pendingCalc;
    if (!m) return;
    if (gated("add-entry", { date: state.date }, () => saveCalc(type), "addPast")) return;
    const amount = Math.abs(Number(m.result));
    const res = ledger().add({ type, date: state.date, item: type === "income" ? "வரவு" : "செலவு", amount, calc: m.text, payMode: "cash" });
    if (!res.ok) { toast(S("பதிவைச் சேமிக்க முடியவில்லை.", "Could not save this entry.")); return; }
    state.entries = res.entries;
    state.undoEntry = null;
    state.undoAction = { kind: "removeMany", ids: [res.entry.id] };
    state.lastSavedIds = [res.entry.id];
    saveStore();
    hideCalc();
    render();
    toast(H("சேமிக்கப்பட்டது ✓", "Saved ✓") + '<span class="t-line">' + escapeHtml(entryLine(res.entry)) + '</span><span class="t-line">🧮 ' + escapeHtml(m.text) + "</span>", { html: true, undo: true, edit: true, ms: UNDO_MS });
  }

  function editLastSaved() {
    const ids = (state.lastSavedIds || []).filter((id) => state.entries.some((e) => e.id === id));
    hideToast();
    if (!ids.length) return;
    if (ids.length === 1) {
      const entry = state.entries.find((e) => e.id === ids[0]);
      state.undoAction = null;
      openForm({ mode: "edit", type: entry.type, id: entry.id });
      return;
    }
    // Several saved at once: show them in the list and let the person tap ✏️ on the one to fix.
    state.tab = "Today";
    render();
    let first = null;
    ids.forEach((id) => {
      const row = document.querySelector('#entryList .row[data-id="' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"]');
      if (row) {
        row.classList.remove("flash");
        void row.offsetWidth;
        row.classList.add("flash");
        if (!first) first = row;
      }
    });
    if (first && first.scrollIntoView) first.scrollIntoView({ behavior: "smooth", block: "center" });
    toast(S("✏️ தட்டி திருத்துங்கள்", "Tap ✏️ on a row to edit it"));
  }

  /* ---------- Fallback sheet (only when no amount could be read) ---------- */
  function renderConfirmParsed(text) {
    const result = L.parseCommand(text, { menu: state.settings.menu });
    state.pendingParse = result;
    const err = document.getElementById("confirmError");
    if (err) err.textContent = "";
    const body = document.getElementById("confirmBody");
    const entries = (result && result.entries) || [];
    if (!result || !result.ok || !entries.length) {
      body.innerHTML = '<p class="help">' + H("தொகை புரியவில்லை. மேலே உள்ள வாக்கியத்தைத் திருத்துங்கள் (எ.கா. 100 டீ), அல்லது படிவத்தில் நிரப்புங்கள்.", "No amount found. Fix the sentence above (e.g. 100 tea), or fill the form.") + "</p>";
      return result;
    }
    body.innerHTML = '<div class="confirm-lines">' + entries.map((e) => '<div class="confirm-line">' + escapeHtml(entryLine(e)) + "</div>").join("") + "</div>";
    return result;
  }

  function openConfirmation(text) {
    const start = String(text || "").trim();
    const ta = document.getElementById("confirmTranscript");
    if (ta) ta.value = start;
    renderConfirmParsed(start);
    document.getElementById("confirmCard").hidden = false;
    document.getElementById("backdrop").hidden = false;
    setTimeout(() => {
      const t = document.getElementById("confirmTranscript");
      if (t && t.focus) t.focus({ preventScroll: true });
    }, 80);
  }

  function closeConfirm() {
    document.getElementById("confirmCard").hidden = true;
    state.pendingParse = null;
    if (document.getElementById("sheet").hidden && document.getElementById("modal").hidden && document.getElementById("settings").hidden) {
      document.getElementById("backdrop").hidden = true;
    }
  }

  function saveParsed() {
    const ta = document.getElementById("confirmTranscript");
    const text = ta ? ta.value : "";
    const result = L.parseCommand(text, { menu: state.settings.menu });
    const err = document.getElementById("confirmError");
    setMsg(err, "");
    if (!result.ok) {
      setMsg(err, S("முதலில் வாக்கியத்தில் தொகையைச் சேர்க்கவும் அல்லது படிவத்தில் நிரப்பவும்", "Add an amount to the sentence first, or fill the form"));
      return;
    }
    closeConfirm();
    runCommand(text, { source: "sheet" });
  }

  function editParsed() {
    const parsed = state.pendingParse;
    const first = parsed && parsed.first;
    const raw = (document.getElementById("confirmTranscript") || {}).value || (parsed && parsed.raw) || "";
    closeConfirm();
    const type = first && first.type === "expense" ? "expense" : "income";
    const seed = first ? Object.assign({}, first, { amount: first.amount }) : { item: "", note: raw };
    if (!first || !first.item || first.item === "வரவு" || first.item === "செலவு") seed.note = raw;
    openForm({ mode: "add", type, seed });
  }

  /* ---------- Form ---------- */
  function openForm(opts) {
    if (opts.mode === "edit") {
      const ent = state.entries.find((x) => x.id === opts.id);
      if (ent && gated("edit-entry", { entry: ent }, () => openForm(opts), "edit")) return;
    } else if (gated("add-entry", { date: state.date }, () => openForm(opts), "addPast")) return;
    stopListen(false);
    state.form = opts;
    state.amountManual = false;
    const sheet = document.getElementById("sheet");
    const type = opts.type;
    const seed = opts.seed || (opts.id ? state.entries.find((e) => e.id === opts.id) : null);
    document.getElementById("formTitle").innerHTML = opts.mode === "edit"
      ? (type === "income" ? H("வரவைத் திருத்து", "Edit income") : H("செலவைத் திருத்து", "Edit expense"))
      : type === "income" ? H("புதிய வரவு", "New income") : H("புதிய செலவு", "New expense");
    sheet.classList.toggle("expense", type === "expense");
    sheet.classList.toggle("income", type === "income");
    fillChips(type, seed && seed.item);
    document.getElementById("fldItem").value = seed ? seed.item || "" : "";
    document.getElementById("fldQty").value = seed && seed.qty != null ? String(seed.qty) : "";
    document.getElementById("fldUnit").value = seed && seed.unit ? seed.unit : (type === "income" ? "எண்ணிக்கை" : "கிலோ");
    renderUnitChips();
    document.getElementById("fldUnitPrice").value = seed && seed.unitPrice != null ? String(seed.unitPrice) : "";
    document.getElementById("fldRefQty").value = seed && seed.refQty != null ? String(seed.refQty) : "";
    document.getElementById("fldRefAmount").value = seed && seed.refAmount != null ? String(seed.refAmount) : "";
    document.getElementById("fldAmount").value = seed && seed.amount != null ? String(seed.amount) : "";
    document.getElementById("fldVehicle").value = seed && seed.vehicleNo ? seed.vehicleNo : "";
    document.getElementById("fldNote").value = seed && seed.note ? seed.note : "";
    document.getElementById("fldCustomer").value = seed && seed.customerName ? seed.customerName : "";
    const useBulk = !!(seed && seed.refQty && seed.refAmount);
    document.getElementById("bulkToggle").checked = useBulk;
    document.getElementById("bulkBox").hidden = !useBulk;
    document.getElementById("vehicleWrap").hidden = type !== "expense";
    state.formPay = seed ? L.payModeOf(seed) : "cash";
    syncPayChips();
    document.getElementById("formError").textContent = "";
    updateHints();
    updateCalcPreview();
    updateNoteRequirement();
    const needMore = !!(useBulk || (type === "expense" && seed && seed.vehicleNo) || (seed && seed.note) || (seed && Number(seed.amount) < 0));
    setMoreOpen(needMore);
    sheet.hidden = false;
    document.getElementById("backdrop").hidden = false;
    setTimeout(() => document.getElementById("fldItem").focus(), 50);
  }

  const UNIT_CHIPS = ["கிலோ", "கிராம்", "லிட்டர்", "பொட்டலம்", "டஜன்", "எண்ணிக்கை", "கிளாஸ்"];
  function renderUnitChips() {
    const box = document.getElementById("unitChips");
    if (!box) return;
    const cur = document.getElementById("fldUnit").value;
    box.innerHTML = UNIT_CHIPS.map((u) => {
      const main = curLang() === "ta" ? (u === "எண்ணிக்கை" ? "எண்ணம்" : u) : unitName(u);
      const en = L.unitLabel(u, "en");
      const sub = curLang() !== "en" && en !== main ? `<span class="en">${escapeHtml(en)}</span>` : "";
      return `<button type="button" data-unit="${escapeHtml(u)}" class="${u === cur ? "on" : ""}"><span class="bi" style="align-items:center"><span class="ta">${escapeHtml(main)}</span>${sub}</span></button>`;
    }).join("");
  }

  function closeForm() {
    document.getElementById("sheet").hidden = true;
    if (document.getElementById("modal").hidden && document.getElementById("settings").hidden && document.getElementById("confirmCard").hidden) {
      document.getElementById("backdrop").hidden = true;
    }
    state.form = null;
  }

  function fillChips(type, selected) {
    const items = type === "income" ? SALE_CHIPS : EXPENSE_CHIPS;
    document.getElementById("chips").innerHTML = items
      .map((c) => {
        const main = itemName(c);
        const en = itemEnSub(c);
        return `<button type="button" class="chip${c === selected ? " on" : ""}" data-chip="${escapeHtml(c)}"><span class="tl"><span class="ta">${escapeHtml(main)}</span>${en ? `<span class="en">${escapeHtml(en)}</span>` : ""}</span></button>`;
      })
      .join("");
  }

  function syncPayChips() {
    document.querySelectorAll("#payChips .pay-chip").forEach((b) => {
      b.classList.toggle("on", b.getAttribute("data-pay") === state.formPay);
    });
    const lab = document.getElementById("customerLabel");
    if (lab) lab.innerHTML = state.formPay === "credit" ? H("யாருக்குக் கடன்? (பெயர்)", "Who owes? (name)") : H("பெயர் (விருப்பம்)", "Name (optional)");
  }

  function updateHints() {
    parsedHint(document.getElementById("fldQty"), document.getElementById("hintQty"));
    parsedHint(document.getElementById("fldUnitPrice"), document.getElementById("hintUnitPrice"));
    parsedHint(document.getElementById("fldRefQty"), document.getElementById("hintRefQty"));
    parsedHint(document.getElementById("fldRefAmount"), document.getElementById("hintRefAmount"));
    parsedHint(document.getElementById("fldAmount"), document.getElementById("hintAmount"));
  }

  function updateCalcPreview() {
    const qty = fieldNumber("fldQty");
    const unitPrice = fieldNumber("fldUnitPrice");
    const refQty = fieldNumber("fldRefQty");
    const refAmount = fieldNumber("fldRefAmount");
    const useBulk = document.getElementById("bulkToggle").checked;
    const preview = document.getElementById("calcPreview");
    const calc = L.computeAmount({
      qty: qty.value,
      unitPrice: unitPrice.value,
      refQty: useBulk ? refQty.value : null,
      refAmount: useBulk ? refAmount.value : null
    });
    if (calc.amount != null) {
      preview.classList.remove("is-empty");
      preview.innerHTML = calc.source === "bulk"
        ? `<strong>${formatMoney(calc.amount)}</strong> — ${qty.value} ÷ ${refQty.value} × ${formatMoney(refAmount.value)}`
        : `<strong>${formatMoney(calc.amount)}</strong> — ${qty.value} × ${formatMoney(unitPrice.value)}`;
      if (!state.amountManual) {
        document.getElementById("fldAmount").value = String(calc.amount);
        parsedHint(document.getElementById("fldAmount"), document.getElementById("hintAmount"));
      }
    } else {
      preview.classList.add("is-empty");
      preview.textContent = "";
    }
    updateNoteRequirement();
  }

  function setMoreOpen(open) {
    const box = document.getElementById("moreFields");
    const btn = document.getElementById("moreToggle");
    if (!box || !btn) return;
    box.hidden = !open;
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function updateNoteRequirement() {
    const amt = fieldNumber("fldAmount");
    const need = !amt.empty && amt.value != null && amt.value < 0;
    document.getElementById("noteLabel").classList.toggle("required", need);
    document.getElementById("noteReqMsg").hidden = !need;
    if (need) setMoreOpen(true);
  }

  function readForm() {
    const type = state.form.type;
    const item = document.getElementById("fldItem").value.trim();
    const qtyF = fieldNumber("fldQty");
    const unitPriceF = fieldNumber("fldUnitPrice");
    const refQtyF = fieldNumber("fldRefQty");
    const refAmountF = fieldNumber("fldRefAmount");
    const amountF = fieldNumber("fldAmount");
    const useBulk = document.getElementById("bulkToggle").checked;
    if (!qtyF.empty && qtyF.value == null) return { ok: false, error: S("அளவு எண்ணைப் புரிந்துகொள்ளவில்லை", "Could not read quantity.") };
    if (!unitPriceF.empty && unitPriceF.value == null) return { ok: false, error: S("விலையைப் புரிந்துகொள்ளவில்லை", "Could not read unit price.") };
    if (useBulk && !refQtyF.empty && refQtyF.value == null) return { ok: false, error: S("குறிப்பு அளவைப் புரிந்துகொள்ளவில்லை", "Could not read reference qty.") };
    if (useBulk && !refAmountF.empty && refAmountF.value == null) return { ok: false, error: S("குறிப்பு விலையைப் புரிந்துகொள்ளவில்லை", "Could not read reference price.") };
    if (!amountF.empty && amountF.value == null) return { ok: false, error: S("தொகையைப் புரிந்துகொள்ளவில்லை (எ.கா. 150)", "Could not read the amount (try 150).") };
    let amount = amountF.value;
    let unitPrice = unitPriceF.value;
    const calc = L.computeAmount({
      qty: qtyF.value,
      unitPrice: unitPriceF.value,
      refQty: useBulk ? refQtyF.value : null,
      refAmount: useBulk ? refAmountF.value : null
    });
    if (amount == null && calc.amount != null) amount = calc.amount;
    if (unitPrice == null && calc.unitPrice != null) unitPrice = calc.unitPrice;
    return {
      ok: true,
      data: {
        type,
        date: state.date,
        item,
        qty: qtyF.empty ? "" : qtyF.value,
        unit: document.getElementById("fldUnit").value,
        unitPrice: unitPrice == null ? "" : unitPrice,
        refQty: useBulk && !refQtyF.empty ? refQtyF.value : "",
        refAmount: useBulk && !refAmountF.empty ? refAmountF.value : "",
        amount,
        vehicleNo: document.getElementById("fldVehicle").value.trim().toUpperCase(),
        note: document.getElementById("fldNote").value.trim(),
        payMode: state.formPay,
        customerName: document.getElementById("fldCustomer").value.trim()
      }
    };
  }

  function saveForm(ev) {
    if (ev) ev.preventDefault();
    const errBox = document.getElementById("formError");
    errBox.textContent = "";
    const isEdit = state.form && state.form.mode === "edit";
    const id = state.form && state.form.id;
    const read = readForm();
    if (!read.ok) { setMsg(errBox, read.error); return; }
    const result = isEdit ? ledger().edit(id, read.data) : ledger().add(read.data);
    if (!result.ok) {
      if (result.errors.indexOf("note-required-for-negative") !== -1) {
        setMsg(errBox, S("கழிவு / மைனஸ் தொகைக்குக் காரணக் குறிப்பு அவசியம்.", "A note is required for minus amounts."));
        document.getElementById("fldNote").focus();
        return;
      }
      if (result.errors.indexOf("customer-required-for-credit") !== -1) {
        setMsg(errBox, S("கடனுக்கு வாடிக்கையாளர் பெயர் தேவை.", "Credit needs the customer's name."));
        document.getElementById("fldCustomer").focus();
        return;
      }
      if (result.errors.indexOf("amount") !== -1) {
        setMsg(errBox, S("தொகையை எழுதவும்.", "Please enter an amount."));
        document.getElementById("fldAmount").focus();
        return;
      }
      setMsg(errBox, S("பதிவைச் சேமிக்க முடியவில்லை.", "Could not save this entry."));
      return;
    }
    applyLedger(result, savedToast());
    closeForm();
  }

  function askDelete(id) {
    const entry = state.entries.find((e) => e.id === id);
    if (!entry) return;
    if (gated("delete-entry", { entry }, () => askDelete(id), "delete")) return;
    state.pendingDeleteId = id;
    const kind = entry.type === "income" ? S("வரவு", "Income") : S("செலவு", "Expense");
    document.getElementById("modalBody").innerHTML =
      `<div class="modal-q">${H("இந்தப் பதிவை நீக்க வேண்டுமா?", "Delete this entry?")}</div>` +
      `<p class="modal-d"><strong>${escapeHtml(kind)} · ${escapeHtml(itemName(entry.item) || "—")}</strong><br>${formatMoney(entry.amount)}` +
      (entry.customerName ? `<br>👤 ${escapeHtml(entry.customerName)}` : "") +
      (entry.note ? `<br>${escapeHtml(S("குறிப்பு", "Note"))}: ${escapeHtml(entry.note)}` : "") +
      `</p><div class="modal-warn">${H("நீக்கிய பின் இன்றைய வரவு, செலவு, லாபம் மீண்டும் கணக்கிடப்படும்.", "Income, expense and profit will be recalculated.")}</div>`;
    document.getElementById("modal").hidden = false;
    document.getElementById("backdrop").hidden = false;
  }

  function confirmDelete() {
    if (!state.pendingDeleteId) return;
    const removed = state.entries.find((e) => e.id === state.pendingDeleteId);
    const result = ledger().remove(state.pendingDeleteId);
    closeModal();
    if (!result.ok) { toast(S("பதிவை நீக்க முடியவில்லை", "Could not delete")); return; }
    const copy = removed ? { ...removed } : (result.removed ? { ...result.removed } : null);
    state.undoEntry = copy;
    state.undoAction = copy ? { kind: "restore", entry: copy } : null;
    state.lastSavedIds = [];
    applyLedger(result, null);
    toast(S("அழிக்கப்பட்டது", "Deleted"), { undo: true });
  }

  function closeModal() {
    document.getElementById("modal").hidden = true;
    state.pendingDeleteId = null;
    state.pendingPaidName = null;
    if (document.getElementById("sheet").hidden && document.getElementById("settings").hidden && document.getElementById("confirmCard").hidden) {
      document.getElementById("backdrop").hidden = true;
    }
  }

  function askMarkPaid(name) {
    if (gated("mark-paid", {}, () => askMarkPaid(name), "paid")) return;
    state.pendingPaidName = name;
    document.getElementById("modalBody").innerHTML =
      `<div class="modal-q"><strong>${escapeHtml(name)}</strong> — ${H("கடன் முழுவதும் செலுத்திவிட்டாரா?", "Mark all of this credit as paid?")}</div>` +
      `<div class="modal-warn">${H("வரவு எண் மாறாது — கடன் மட்டும் முடியும்.", "Income total stays the same; the credit book is cleared.")}</div>`;
    const yes = document.getElementById("confirmDelete");
    yes.classList.remove("danger");
    yes.classList.add("ok");
    yes.innerHTML = H("ஆம், செலுத்தினார்", "Yes, paid");
    document.getElementById("modal").hidden = false;
    document.getElementById("backdrop").hidden = false;
  }

  function resetDeleteButtons() {
    const yes = document.getElementById("confirmDelete");
    yes.classList.add("danger");
    yes.classList.remove("ok");
    yes.innerHTML = H("ஆம், நீக்கு", "Yes, delete");
  }

  function openSettings() {
    renderPinSettings();
    renderBackupSettings();
    document.getElementById("setShopName").value = shopTitle();
    renderMenuEditor();
    document.getElementById("settings").hidden = false;
    document.getElementById("backdrop").hidden = false;
  }


  function renderStockAlert() {
    const box = document.getElementById("stockAlert");
    if (!box) return;
    const low = L.lowStockItems(state.settings.stock, state.settings.stockMoves);
    if (!low.length) {
      box.hidden = true;
      return;
    }
    const names = low.map((s) => stockName(s) + " (" + s.qty + " " + unitName(s.unit) + ")").join(", ");
    document.getElementById("stockAlertTa").textContent = P("குறைந்த இருப்பு", "Low stock") + ": " + names;
    document.getElementById("stockAlertEn").textContent = curLang() === "en" ? "" : "Low stock — please check";
    document.getElementById("stockAlertEn").hidden = curLang() === "en";
    box.hidden = false;
    box.onclick = () => {
      state.tab = "Shop";
      state.shopSection = "stock";
      render();
    };
  }

  function stockName(s) {
    const l = curLang();
    if (l === "en") return s.nameEn || s.nameTa;
    if (l === "ta") return s.nameTa || s.nameEn;
    const tr = L.itemLabel(s.nameTa, l);
    return tr !== s.nameTa ? tr : (s.nameEn || s.nameTa);
  }

  function menuName(m) {
    const l = curLang();
    if (l === "en") return m.nameEn || m.nameTa;
    if (l === "ta") return m.nameTa || m.nameEn;
    const tr = L.itemLabel(m.nameTa, l);
    return tr !== m.nameTa ? tr : (m.nameEn || m.nameTa);
  }

  function renderShop() {
    const section = state.shopSection || "stock";
    document.querySelectorAll("#shopSub [data-shop]").forEach((b) => {
      b.classList.toggle("on", b.getAttribute("data-shop") === section);
    });
    const locked = (section === "margins" || section === "staff") && L.pinRequiredFor(state.settings, section === "staff" ? "wages" : "margins", {}) && !pinSessionOk();
    document.getElementById("shopLock").hidden = !locked;
    document.getElementById("shopStock").hidden = section !== "stock";
    document.getElementById("shopRecipes").hidden = section !== "recipes";
    document.getElementById("shopMargins").hidden = locked || section !== "margins";
    document.getElementById("shopStaff").hidden = locked || section !== "staff";
    if (section === "stock") renderStock();
    if (section === "recipes") renderRecipes();
    if (section === "margins" && !locked) renderMargins();
    if (section === "staff" && !locked) renderStaff();
  }

  function renderStock() {
    const low = L.lowStockItems(state.settings.stock, state.settings.stockMoves);
    const box = document.getElementById("stockList");
    const items = state.settings.stock || [];
    if (!items.length) {
      box.innerHTML = "<p class='help'>" + H("இருப்புப் பொருள் இல்லை.", "No stock items yet.") + "</p>";
    } else {
      box.innerHTML = items.map((s) => {
        const tracked = Number(s.qty) !== 0 || (state.settings.stockMoves || []).some((m) => m.itemId === s.id);
        const isLow = tracked && Number(s.qty) <= Number(s.minAlert || 0);
        return `<div class="stock-item">
          <div>
            <strong>${escapeHtml(stockName(s))}</strong>
            ${curLang() !== "en" && s.nameEn && s.nameEn !== stockName(s) ? '<div class="en">' + escapeHtml(s.nameEn) + "</div>" : ""}
            <div class="help">${escapeHtml(S("குறைந்தபட்சம்", "Alert at"))} ${escapeHtml(String(s.minAlert))} ${escapeHtml(unitName(s.unit))}</div>
            ${Number(s.qty) < 0 ? `<div class="help" style="color:#9B1C1C;font-weight:700">${escapeHtml(S("இருப்பு குறைவாகப் பதிவானது — புதிய இருப்பைச் சேர்க்கவும்", "Sales used more than the counted stock — add your real stock"))}</div>` : ""}
          </div>
          <div style="text-align:right">
            <span class="badge ${Number(s.qty) < 0 ? "neg" : isLow ? "warn" : "ok"}">${escapeHtml(String(s.qty))} ${escapeHtml(unitName(s.unit))}</span>
          </div>
        </div>`;
      }).join("");
    }
    const alertBox = document.getElementById("stockAlertBox");
    if (low.length) {
      alertBox.innerHTML = escapeHtml(low.map((s) => stockName(s) + " " + s.qty + " " + unitName(s.unit)).join(", ")) + " — " + H("சரிபாருங்கள்", "Please check");
    } else {
      alertBox.innerHTML = H("அனைத்து பொருட்களும் போதிய அளவில் உள்ளன.", "All tracked items are above the alert level.");
    }
    const sel = document.getElementById("stockItemSel");
    if (sel) {
      const prev = sel.value;
      sel.innerHTML = items.map((s) => `<option value="${escapeHtml(s.id)}">${escapeHtml(stockName(s))}</option>`).join("");
      if (prev && items.some((s) => s.id === prev)) sel.value = prev;
    }
  }

  function openStockMove(kind) {
    document.getElementById("stockNewForm").hidden = true;
    const form = document.getElementById("stockMoveForm");
    form.hidden = false;
    document.getElementById("stockMoveKind").value = kind;
    document.getElementById("stockMoveError").textContent = "";
    document.getElementById("stockQty").value = "";
    document.getElementById("stockAmount").value = "";
    document.getElementById("stockNote").value = "";
    document.getElementById("stockLogExpense").checked = kind === "in";
    document.getElementById("stockAmtWrap").hidden = kind !== "in";
    document.getElementById("stockLogWrap").hidden = kind !== "in";
    renderStock();
    document.getElementById("stockQty").focus();
  }

  function submitStockMove() {
    const kind = document.getElementById("stockMoveKind").value;
    const itemId = document.getElementById("stockItemSel").value;
    const qty = L.parseTamilNumber(document.getElementById("stockQty").value);
    const err = document.getElementById("stockMoveError");
    err.textContent = "";
    if (!(qty > 0)) {
      setMsg(err, S("அளவைப் போடவும்", "Enter a quantity"));
      return;
    }
    if (kind === "out") {
      const res = L.useStock(state.settings.stock, state.settings.stockMoves, {
        itemId, qty, date: state.date, note: document.getElementById("stockNote").value
      });
      if (!res.ok) {
        setMsg(err, res.errors && res.errors[0] === "insufficient-stock"
          ? S("போதிய இருப்பு இல்லை", "Not enough stock")
          : S("பயன்படுத்த முடியவில்லை", "Could not use stock"));
        return;
      }
      state.settings.stock = res.stock;
      state.settings.stockMoves = res.stockMoves;
      saveStore();
      document.getElementById("stockMoveForm").hidden = true;
      render();
      toast(savedToast());
      return;
    }
    const amtRaw = document.getElementById("stockAmount").value.trim();
    const amount = amtRaw ? L.parseTamilNumber(amtRaw) : null;
    const logExpense = document.getElementById("stockLogExpense").checked;
    if (logExpense && !(amount > 0)) {
      setMsg(err, S("செலவுக்குத் தொகை தேவை", "Enter an amount to log the expense"));
      return;
    }
    const res = L.addStock(state.settings.stock, state.settings.stockMoves, {
      itemId, qty, date: state.date, note: document.getElementById("stockNote").value,
      amount: amount, logExpense: logExpense
    });
    if (!res.ok) {
      setMsg(err, S("சேர்க்க முடியவில்லை", "Could not add stock"));
      return;
    }
    state.settings.stock = res.stock;
    state.settings.stockMoves = res.stockMoves;
    if (res.expense) {
      const led = ledger().add(res.expense);
      if (!led.ok) {
        setMsg(err, S("செலவு சேரவில்லை", "Could not log expense"));
        saveStore();
        render();
        return;
      }
      state.entries = led.entries;
    }
    saveStore();
    document.getElementById("stockMoveForm").hidden = true;
    render();
    toast(savedToast());
  }

  function submitNewStock() {
    const res = L.upsertStockItem(state.settings.stock, {
      nameTa: document.getElementById("newStockTa").value,
      nameEn: document.getElementById("newStockEn").value,
      unit: document.getElementById("newStockUnit").value || "கிலோ",
      qty: 0,
      minAlert: L.parseTamilNumber(document.getElementById("newStockMin").value) || 0
    });
    if (!res.ok) {
      toast(S("பெயரைப் போடவும்", "Enter a name"));
      return;
    }
    state.settings.stock = res.stock;
    saveStore();
    document.getElementById("stockNewForm").hidden = true;
    document.getElementById("newStockTa").value = "";
    document.getElementById("newStockEn").value = "";
    render();
    toast(savedToast());
  }

  function renderMargins() {
    const day = L.dayItemProfits(state.entries, state.date, state.settings.menu);
    const dayBox = document.getElementById("dayMarginBox");
    if (!day.withSales.length) {
      dayBox.innerHTML = "<p class='help'>" + H("இன்று மெனு விற்பனை இல்லை.", "No menu sales today.") + "</p>";
    } else {
      const rows = day.withSales.map((r) => {
        const profit = r.profitTotal == null ? "—" : formatMoney(r.profitTotal);
        return `<div class="margin-item"><div><strong>${escapeHtml(menuName(r))}</strong><div class="help">${r.qtySold} × ${formatMoney(r.price)} − ${r.costPrice == null ? escapeHtml(S("செலவு இல்லை", "no cost set")) : formatMoney(r.costPrice)}</div></div><div style="text-align:right"><strong>${profit}</strong></div></div>`;
      }).join("");
      dayBox.innerHTML = rows + `<p style="margin:10px 0 0;font-weight:700">${TL("இன்று பொருள் லாபம்", "Today's item profit")}: ${formatMoney(day.totalProfit)}</p>`;
    }
    const list = document.getElementById("marginList");
    list.innerHTML = L.itemMargins(state.settings.menu).map((m, i) => {
      const profit = m.costMissing ? "—" : formatMoney(m.unitProfit);
      const pct = m.marginPct == null ? "" : ` (${m.marginPct}%)`;
      return `<div class="margin-item" data-idx="${i}">
        <div><strong>${escapeHtml(menuName(m))}</strong><div class="help">${escapeHtml(S("விலை", "Price"))} ${formatMoney(m.price)}</div></div>
        <div style="text-align:right">
          <label class="lab" style="margin:0;font-size:12px">${escapeHtml(S("செலவு", "Cost"))}</label>
          <input class="cost-in" data-cost="${escapeHtml(m.id)}" inputmode="decimal" value="${m.costMissing ? "" : escapeHtml(String(m.costPrice))}">
          <div style="font-weight:700;color:var(--income);margin-top:4px">${profit}${pct}</div>
        </div>
      </div>`;
    }).join("");
  }

  function saveMargins() {
    const menu = (state.settings.menu || []).map((m) => ({ ...m }));
    document.querySelectorAll("#marginList [data-cost]").forEach((el) => {
      const id = el.getAttribute("data-cost");
      const row = menu.find((m) => m.id === id);
      if (!row) return;
      const raw = el.value.trim();
      if (!raw) row.costPrice = null;
      else {
        const n = L.parseTamilNumber(raw);
        row.costPrice = n == null ? null : n;
      }
    });
    state.settings.menu = menu;
    saveStore();
    render();
    toast(savedToast());
  }

  function renderStaff() {
    const box = document.getElementById("staffList");
    const sums = L.staffSummaries(state.settings.staff, state.settings.wages);
    if (!sums.length) {
      box.innerHTML = "<p class='help'>" + H("பணியாளர் இல்லை.", "No staff added yet.") + "</p>";
      return;
    }
    box.innerHTML = sums.map((w) => {
      const bal = w.balanceOwed;
      const balLabel = bal > 0
        ? S("பாக்கி", "Owed to staff") + " " + formatMoney(bal)
        : bal < 0
          ? S("முன்பணம் மீதி", "Staff owes") + " " + formatMoney(-bal)
          : S("பாக்கி இல்லை", "Settled");
      const unpaidBtns = (state.settings.wages || []).filter((r) => r.staffId === w.id && !r.paid && r.kind !== "advance").map((r) =>
        `<button type="button" data-payunpaid="${escapeHtml(r.id)}">${H("பாக்கி செலுத்து", "Pay due")} ${formatMoney(r.amount)}</button>`
      ).join("");
      return `<div class="staff-item">
        <div style="flex:1">
          <strong>${escapeHtml(w.name)}</strong>
          <div class="help">${escapeHtml(S("தினம்", "Daily"))} ${formatMoney(w.dailyWage)} · ${escapeHtml(S("வாரம்", "Weekly"))} ${formatMoney(w.weeklyWage || 0)}</div>
          <div class="help">${escapeHtml(S("செலுத்திய கூலி", "Wages paid"))} ${formatMoney(w.wagesPaid)} · ${escapeHtml(S("முன்பணம்", "Advance"))} ${formatMoney(w.advances)}</div>
          <div style="font-weight:700;margin-top:4px">${escapeHtml(balLabel)}</div>
          <div class="shop-actions">
            <button type="button" data-wage="daily" data-staff="${escapeHtml(w.id)}">${H("இன்றைய கூலி", "Daily wage")}</button>
            <button type="button" data-wage="weekly" data-staff="${escapeHtml(w.id)}">${H("வாரக் கூலி", "Weekly wage")}</button>
            <button type="button" data-wage="advance" data-staff="${escapeHtml(w.id)}">${H("முன்பணம்", "Advance")}</button>
            ${unpaidBtns}
          </div>
        </div>
      </div>`;
    }).join("");
  }

  function openWageForm(staffId, kind) {
    const member = (state.settings.staff || []).find((s) => s.id === staffId);
    if (!member) return;
    document.getElementById("staffForm").hidden = true;
    const form = document.getElementById("wageForm");
    form.hidden = false;
    document.getElementById("wageStaffId").value = staffId;
    document.getElementById("wageKind").value = kind;
    document.getElementById("wageFormError").textContent = "";
    document.getElementById("wageNote").value = "";
    const paidWrap = document.getElementById("wagePaidWrap");
    const paid = document.getElementById("wagePaid");
    if (kind === "advance") {
      document.getElementById("wageFormTitle").textContent = member.name + " — " + S("முன்பணம்", "Advance");
      document.getElementById("wageAmount").value = "";
      paid.checked = true;
      paidWrap.hidden = true;
    } else if (kind === "weekly") {
      document.getElementById("wageFormTitle").textContent = member.name + " — " + S("வாரக் கூலி", "Weekly wage");
      document.getElementById("wageAmount").value = member.weeklyWage ? String(member.weeklyWage) : "";
      paid.checked = true;
      paidWrap.hidden = false;
    } else {
      document.getElementById("wageFormTitle").textContent = member.name + " — " + S("தினக்கூலி", "Daily wage");
      document.getElementById("wageAmount").value = member.dailyWage ? String(member.dailyWage) : "";
      paid.checked = true;
      paidWrap.hidden = false;
    }
    document.getElementById("wageAmount").focus();
  }

  function submitWage() {
    const err = document.getElementById("wageFormError");
    err.textContent = "";
    const res = L.recordWage(state.settings.wages, state.settings.staff, {
      staffId: document.getElementById("wageStaffId").value,
      kind: document.getElementById("wageKind").value,
      amount: L.parseTamilNumber(document.getElementById("wageAmount").value),
      date: state.date,
      note: document.getElementById("wageNote").value,
      paid: document.getElementById("wageKind").value === "advance" ? true : document.getElementById("wagePaid").checked
    });
    if (!res.ok) {
      setMsg(err, S("தொகையைப் போடவும்", "Enter an amount"));
      return;
    }
    state.settings.wages = res.wages;
    if (res.expense) {
      const led = ledger().add(res.expense);
      if (!led.ok) {
        setMsg(err, S("செலவு சேரவில்லை", "Could not add expense"));
        saveStore();
        return;
      }
      state.entries = led.entries;
    }
    saveStore();
    document.getElementById("wageForm").hidden = true;
    render();
    toast(savedToast());
  }

  function payUnpaidWage(recordId) {
    const res = L.payWageRecord(state.settings.wages, state.settings.staff, recordId);
    if (!res.ok || !res.expense) {
      toast(S("செலுத்த முடியவில்லை", "Could not pay"));
      return;
    }
    const led = ledger().add(res.expense);
    if (!led.ok) {
      toast(S("செலவு சேரவில்லை", "Could not add expense"));
      return;
    }
    state.settings.wages = res.wages;
    state.entries = led.entries;
    saveStore();
    render();
    toast(savedToast());
  }

  function submitStaffForm() {
    const err = document.getElementById("staffFormError");
    err.textContent = "";
    const res = L.addStaff(state.settings.staff, {
      name: document.getElementById("staffName").value,
      dailyWage: L.parseTamilNumber(document.getElementById("staffDaily").value) || 0,
      weeklyWage: L.parseTamilNumber(document.getElementById("staffWeekly").value) || 0
    });
    if (!res.ok) {
      setMsg(err, S("பெயரைப் போடவும்", "Enter a name"));
      return;
    }
    state.settings.staff = res.staff;
    saveStore();
    document.getElementById("staffForm").hidden = true;
    document.getElementById("staffName").value = "";
    document.getElementById("staffDaily").value = "";
    document.getElementById("staffWeekly").value = "";
    render();
    toast(savedToast());
  }

  function closeSettings() {
    document.getElementById("settings").hidden = true;
    if (document.getElementById("sheet").hidden && document.getElementById("modal").hidden && document.getElementById("confirmCard").hidden) {
      document.getElementById("backdrop").hidden = true;
    }
  }

  function renderMenuEditor() {
    const box = document.getElementById("menuEditor");
    box.innerHTML = (state.settings.menu || []).map((m, i) => `
      <div class="menu-edit" data-idx="${i}">
        <div class="lab mini-lab">${H("தமிழ் பெயர்", "Local name")}</div>
        <input data-k="nameTa" value="${escapeHtml(m.nameTa || "")}" placeholder="${escapeHtml(S("தமிழ் பெயர்", "Local name"))}">
        <div class="lab mini-lab">${H("ஆங்கிலப் பெயர்", "English name")}</div>
        <input data-k="nameEn" value="${escapeHtml(m.nameEn || "")}" placeholder="English name">
        <div class="lab mini-lab">${H("விலை", "Price")}</div>
        <input data-k="price" inputmode="decimal" value="${escapeHtml(String(m.price != null ? m.price : ""))}" placeholder="${escapeHtml(S("விலை", "Price"))}">
        <div class="lab mini-lab">${H("செய் செலவு", "Making cost")}</div>
        <input data-k="costPrice" inputmode="decimal" value="${escapeHtml(m.costPrice == null || m.costPrice === "" ? "" : String(m.costPrice))}" placeholder="${escapeHtml(S("செய் செலவு", "Making cost"))}">
        <button type="button" class="btn-del" data-remove="${i}">${H("நீக்கு", "Remove")}</button>
      </div>`).join("");
  }

  function readMenuEditor() {
    const rows = [...document.querySelectorAll("#menuEditor .menu-edit")];
    return rows.map((row, i) => {
      const prev = state.settings.menu[i] || {};
      const get = (k) => {
        const el = row.querySelector('[data-k="' + k + '"]');
        return el ? el.value.trim() : "";
      };
      return {
        id: prev.id || "item-" + Date.now() + "-" + i,
        nameTa: get("nameTa"),
        nameEn: get("nameEn"),
        price: L.parseTamilNumber(get("price")) || Number(get("price")) || 0,
        unit: prev.unit || "எண்ணிக்கை",
        costPrice: get("costPrice") === "" ? (prev.costPrice != null ? prev.costPrice : null) : (L.parseTamilNumber(get("costPrice")) || Number(get("costPrice")) || 0)
      };
    }).filter((m) => m.nameTa || m.nameEn);
  }

  function exportBackup() {
    backupNow("download");
  }

  function importBackup(file) {
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const data = JSON.parse(String(reader.result || ""));
        const entries = Array.isArray(data) ? data : data.entries;
        if (!Array.isArray(entries)) throw new Error("bad");
        if (!confirm(curLang() === "en" ? "Restore will replace current entries. Continue?" : P("இறக்குமதி செய்தால் தற்போதைய பதிவுகளின் மேல் எழுதப்படலாம். தொடரவா?", "Restore will replace current entries. Continue?") + "\nRestore will replace current entries. Continue?")) return;
        const keepPin = state.settings.pin; // the PIN belongs to this phone, not to the backup file
        state.entries = entries;
        if (data.settings) {
          applySettingsObject(data.settings);
        }
        state.settings.pin = keepPin || null;
        saveStore();
        render();
        closeSettings();
        toast(S("காப்பு மீட்கப்பட்டது", "Backup restored"));
      } catch (e) {
        toast(S("இந்தக் கோப்பைப் படிக்க முடியவில்லை", "Could not read that file"));
      }
    };
    reader.readAsText(file);
  }

  function downloadCsv() {
    const csv = L.toCSV(state.entries);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "kadai-tracker-" + L.todayISO() + ".csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast(S("CSV பதிவிறக்கம் ஆனது", "CSV downloaded"));
  }

  function shareWhatsApp() {
    if (gated("share-summary", {}, shareWhatsApp, "share")) return;
    const text = L.daySummaryTextLang(state.entries, state.date, shopTitle(), curLang());
    const url = "https://wa.me/?text=" + encodeURIComponent(text);
    window.open(url, "_blank");
  }

  /* =====================================================================
   * v10: owner PIN, recipes + automatic stock, backup reminder, PWA update / install
   * ===================================================================== */
  const PIN_REASONS = {
    settings: ["அமைப்புகளைத் திறக்க", "open Settings"],
    restore: ["காப்பை மீட்டெடுக்க", "restore a backup"],
    stock: ["இருப்பை மாற்ற", "change stock"],
    recipe: ["செய்முறையை மாற்ற", "change a recipe"],
    profit: ["லாபம், கூலி பார்க்க", "see profit and wages"],
    edit: ["பழைய பதிவைத் திருத்த", "edit a past entry"],
    "delete": ["பழைய பதிவை நீக்க", "delete a past entry"],
    addPast: ["பழைய தேதியில் பதிவு சேர்க்க", "add an entry to a past date"],
    share: ["சுருக்கத்தைப் பகிர (லாபம் உள்ளது)", "share the summary (it shows profit)"],
    paid: ["கடன் செலுத்தியதாகக் குறிக்க", "mark credit as paid"],
    pinchange: ["PIN-ஐ மாற்ற", "change the PIN"],
    pinoff: ["PIN-ஐ நிறுத்த", "turn off the PIN"]
  };
  const MASK = "₹ ••••";

  function pinOn() { return L.pinEnabled(state.settings); }
  function pinSessionOk() { return L.pinSessionValid(state.pinUnlockedAt); }
  function touchPinSession() {
    state.pinUnlockedAt = Date.now();
    clearTimeout(state.pinTimer);
    state.pinTimer = setTimeout(function relock() {
      if (L.pinSessionValid(state.pinUnlockedAt)) { state.pinTimer = setTimeout(relock, 5000); return; }
      state.pinUnlockedAt = 0;
      render();
    }, L.PIN_SESSION_MS + 300);
  }
  function lockNow() {
    state.pinUnlockedAt = 0;
    clearTimeout(state.pinTimer);
    const st = document.getElementById("settings");
    if (st && !st.hidden) closeSettings();
    render();
    toast(S("பூட்டப்பட்டது 🔒", "Locked 🔒"));
  }
  function profitHidden() {
    return L.pinRequiredFor(state.settings, "profit", {}) && !pinSessionOk();
  }
  function profitText(n) {
    return profitHidden() ? MASK : formatMoney(n);
  }
  /** true when the action must wait for the PIN (the PIN pad is opened and `retry` runs after it). */
  function gated(action, ctx, retry, reasonKey) {
    if (!L.pinRequiredFor(state.settings, action, ctx || {})) return false;
    if (pinSessionOk()) { touchPinSession(); return false; }
    openPin({ kind: "verify", cb: retry, reason: reasonKey || action });
    return true;
  }
  function withPin(action, ctx, fn, reasonKey) {
    if (!gated(action, ctx, fn, reasonKey)) fn();
  }

  let pinUi = null;
  function pinEl(id) { return document.getElementById(id); }
  function openPin(opts) {
    pinUi = Object.assign({ kind: "verify", step: "enter", buf: "", first: "", cb: null, reason: "settings", view: "pad" }, opts);
    if (pinUi.kind === "create" || pinUi.kind === "change" || pinUi.kind === "recover") pinUi.step = "new1";
    pinEl("pinModal").hidden = false;
    pinEl("backdrop").hidden = false;
    pinEl("pinAnswer").value = "";
    renderPin();
  }
  function closePin() {
    pinEl("pinModal").hidden = true;
    pinUi = null;
    const anyOpen = ["sheet", "settings", "confirmCard", "modal"].some((id) => pinEl(id) && !pinEl(id).hidden);
    if (!anyOpen) pinEl("backdrop").hidden = true;
  }
  function fmtWait(ms) {
    const s = Math.ceil(ms / 1000);
    if (s < 90) return s + " " + S("விநாடி", "sec");
    const m = Math.ceil(s / 60);
    if (m < 120) return m + " " + S("நிமிடம்", "min");
    const h = Math.floor(m / 60);
    return h + " " + S("மணி", "h") + " " + (m % 60) + " " + S("நிமிடம்", "min");
  }
  function renderPin() {
    if (!pinUi) return;
    const u = pinUi;
    const titles = {
      enter: H("PIN போடுங்கள்", "Enter PIN"),
      new1: u.kind === "recover" ? H("புதிய PIN தேர்ந்தெடுங்கள்", "Choose a new PIN") : H("4 இலக்க PIN தேர்ந்தெடுங்கள்", "Choose a 4-digit PIN"),
      new2: H("PIN-ஐ மீண்டும் போடுங்கள்", "Enter the PIN again")
    };
    pinEl("pinTitle").innerHTML = u.view === "forgot" ? H("PIN மீட்பு", "Recover PIN")
      : u.view === "reset" ? H("PIN நீக்கம்", "Remove PIN")
      : u.view === "setup" ? H("மீட்புக் கேள்வி", "Recovery question")
      : titles[u.step];
    const rk = PIN_REASONS[u.reason];
    pinEl("pinReason").innerHTML = rk && u.kind === "verify" && u.view === "pad" ? TL("இதற்கு PIN தேவை", "PIN needed to") + ": <strong>" + TL(rk[0], rk[1]) + "</strong>" : "";
    pinEl("pinViewPad").hidden = u.view !== "pad";
    pinEl("pinViewForgot").hidden = u.view !== "forgot";
    pinEl("pinViewReset").hidden = u.view !== "reset";
    pinEl("pinViewSetup").hidden = u.view !== "setup";
    pinEl("pinForgot").hidden = !(u.kind === "verify" && u.view === "pad");
    pinEl("pinLangRow").hidden = !(u.reason === "settings" && u.kind === "verify" && u.view === "pad");
    document.querySelectorAll("#pinLangRow [data-pinlang]").forEach((b) => b.classList.toggle("on", b.getAttribute("data-pinlang") === curLang()));
    document.querySelectorAll("#pinDots i").forEach((d, i) => d.classList.toggle("on", i < u.buf.length));
    if (u.view === "forgot") {
      const q = L.PIN_QUESTIONS.find((x) => x.id === (state.settings.pin && state.settings.pin.q)) || L.PIN_QUESTIONS[0];
      pinEl("pinQuestion").textContent = (q[curLang()] || q.en) + (curLang() === "en" ? "" : "  /  " + q.en);
    }
    if (u.view === "reset") renderPinReset();
    if (u.view === "setup") {
      const sel = pinEl("pinQSel");
      const keep = sel.value;
      sel.innerHTML = L.PIN_QUESTIONS.map((q) => `<option value="${q.id}">${escapeHtml((q[curLang()] || q.en) + (curLang() === "en" ? "" : "  /  " + q.en))}</option>`).join("");
      if (keep) sel.value = keep;
    }
  }
  function pinMsg(html) { pinEl("pinMsg").innerHTML = html || ""; }
  function pinPress(k) {
    if (!pinUi || pinUi.view !== "pad") return;
    if (k === "clear") pinUi.buf = "";
    else if (k === "back") pinUi.buf = pinUi.buf.slice(0, -1);
    else if (pinUi.buf.length < 4) pinUi.buf += k;
    pinMsg("");
    renderPin();
    if (pinUi.buf.length === 4) setTimeout(pinSubmit, 140);
  }
  function lockedMsg(ms) {
    return H("மிகவும் தவறான முயற்சிகள். காத்திருக்கவும்", "Too many wrong tries. Please wait") + ": " + fmtWait(ms);
  }
  function pinSubmit() {
    const u = pinUi;
    if (!u || u.buf.length !== 4) return;
    const code = u.buf;
    u.buf = "";
    if (u.step === "enter") {
      const res = L.verifyPin(state.settings.pin, code, Date.now());
      if (res.rec) { state.settings.pin = res.rec; try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings)); } catch (e) { /* ignore */ } }
      if (res.ok) {
        touchPinSession();
        const cb = u.cb;
        closePin();
        render();
        if (cb) cb();
        return;
      }
      pinMsg(res.locked ? lockedMsg(res.waitMs) : H("தவறான PIN", "Wrong PIN") + (res.triesLeft != null ? " — " + res.triesLeft + " " + S("முயற்சி மீதம்", "tries left") : ""));
      renderPin();
      return;
    }
    if (u.step === "new1") {
      u.first = code;
      u.step = "new2";
      pinMsg("");
      renderPin();
      return;
    }
    if (u.step === "new2") {
      if (code !== u.first) {
        u.step = "new1";
        u.first = "";
        pinMsg(H("இரண்டும் ஒன்றாக இல்லை — மீண்டும் தொடங்குங்கள்", "The two PINs did not match — start again"));
        renderPin();
        return;
      }
      if (u.kind === "create") {
        u.view = "setup";
        pinEl("pinASet").value = "";
        pinEl("pinSetupMsg").innerHTML = "";
        renderPin();
        setTimeout(() => pinEl("pinASet").focus(), 60);
        return;
      }
      const rp = L.replacePin(state.settings.pin, u.first);
      if (!rp.ok) { pinMsg(H("PIN சேமிக்க முடியவில்லை", "Could not save the PIN")); return; }
      state.settings.pin = rp.pin;
      saveStore();
      touchPinSession();
      closePin();
      render();
      renderPinSettings();
      toast(S("புதிய PIN சேமிக்கப்பட்டது ✓ — பதிவுகள் அப்படியே உள்ளன", "New PIN saved ✓ — your entries are untouched"));
    }
  }
  function pinSetupSave() {
    const u = pinUi;
    if (!u || u.kind !== "create") return;
    const res = L.createPinRecord(u.first, pinEl("pinQSel").value, pinEl("pinASet").value, Date.now());
    if (!res.ok) {
      pinEl("pinSetupMsg").innerHTML = H("பதில் குறைந்தது 2 எழுத்து வேண்டும்", "The answer needs at least 2 letters");
      return;
    }
    state.settings.pin = res.pin;
    saveStore();
    touchPinSession();
    closePin();
    render();
    renderPinSettings();
    toast(S("PIN அமைக்கப்பட்டது ✓", "PIN is on ✓"));
  }
  function renderPinReset() {
    const st = L.pinResetStatus(state.settings.pin, Date.now());
    pinEl("pinResetWarn").innerHTML = H("எச்சரிக்கை: PIN நீக்கினால் பூட்டு இல்லாமல் போகும். உங்கள் பதிவுகள், இருப்பு, அமைப்புகள் அழியாது. யாரும் உடனே நீக்கிவிடாமல் இருக்க 24 மணி நேரம் காத்திருக்க வேண்டும்.", "Warning: removing the PIN switches the lock off. Your entries, stock and settings are NOT deleted. To stop anyone doing it in a hurry, you must wait 24 hours first.");
    const go = pinEl("pinResetGo");
    if (!st.started) {
      pinEl("pinResetMsg").innerHTML = "";
      go.innerHTML = H("24 மணி நேரக் காத்திருப்பைத் தொடங்கு", "Start the 24-hour wait");
      go.disabled = false;
    } else if (!st.ready) {
      pinEl("pinResetMsg").innerHTML = H("மீதம்", "Time left") + ": <strong>" + escapeHtml(fmtWait(st.remainingMs)) + "</strong>";
      go.innerHTML = H("இன்னும் காத்திருக்கவும்", "Still waiting");
      go.disabled = true;
    } else {
      pinEl("pinResetMsg").innerHTML = H("காத்திருப்பு முடிந்தது.", "The wait is over.");
      go.innerHTML = H("PIN-ஐ இப்போது நீக்கு (பதிவுகள் இருக்கும்)", "Remove the PIN now (entries are kept)");
      go.disabled = false;
    }
  }
  function pinResetGo() {
    const st = L.pinResetStatus(state.settings.pin, Date.now());
    if (!st.started) {
      const r = L.startPinReset(state.settings.pin, Date.now());
      if (r.ok) { state.settings.pin = r.rec; saveStore(); }
      renderPinReset();
      return;
    }
    if (!st.ready) return;
    state.settings.pin = null;
    state.pinUnlockedAt = 0;
    saveStore();
    closePin();
    render();
    renderPinSettings();
    toast(S("PIN நீக்கப்பட்டது — பதிவுகள் பாதுகாப்பாக உள்ளன", "PIN removed — all your entries are safe"));
  }
  function bindPin() {
    pinEl("pinPad").addEventListener("click", (e) => {
      const b = e.target.closest("[data-pk]");
      if (b) pinPress(b.getAttribute("data-pk"));
    });
    pinEl("pinClose").addEventListener("click", closePin);
    pinEl("pinForgot").addEventListener("click", () => {
      if (!pinUi) return;
      pinUi.view = "forgot";
      pinEl("pinForgotMsg").innerHTML = "";
      renderPin();
    });
    pinEl("pinAnswerOk").addEventListener("click", () => {
      if (!pinUi) return;
      const res = L.verifyAnswer(state.settings.pin, pinEl("pinAnswer").value, Date.now());
      if (res.rec) { state.settings.pin = res.rec; try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings)); } catch (e) { /* ignore */ } }
      if (res.ok) {
        const cb = pinUi.cb;
        pinUi = Object.assign(pinUi, { kind: "recover", step: "new1", view: "pad", buf: "", first: "", cb });
        renderPin();
        return;
      }
      pinEl("pinForgotMsg").innerHTML = res.locked ? lockedMsg(res.waitMs) : H("பதில் தவறு", "That answer is not right");
    });
    pinEl("pinNoAnswer").addEventListener("click", () => { if (pinUi) { pinUi.view = "reset"; renderPin(); } });
    pinEl("pinResetGo").addEventListener("click", pinResetGo);
    pinEl("pinSetupSave").addEventListener("click", pinSetupSave);
    document.querySelectorAll("#pinLangRow [data-pinlang]").forEach((b) => {
      b.addEventListener("click", () => { setLanguage(b.getAttribute("data-pinlang")); renderPin(); });
    });
    pinEl("btnLock").addEventListener("click", lockNow);
    pinEl("shopUnlock").addEventListener("click", () => withPin("profit", {}, () => render(), "profit"));
    pinEl("btnPinSet").addEventListener("click", () => openPin({ kind: "create", reason: "settings" }));
    pinEl("btnPinChange").addEventListener("click", () => openPin({ kind: "verify", reason: "pinchange", cb: () => openPin({ kind: "change", reason: "pinchange" }) }));
    pinEl("btnPinOff").addEventListener("click", () => openPin({
      kind: "verify", reason: "pinoff",
      cb: () => { state.settings.pin = null; state.pinUnlockedAt = 0; saveStore(); render(); renderPinSettings(); toast(S("PIN நிறுத்தப்பட்டது", "PIN turned off")); }
    }));
    document.querySelector(".tot.profit").addEventListener("click", () => {
      if (profitHidden()) withPin("profit", {}, () => render(), "profit");
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { state.hiddenAt = Date.now(); return; }
      // away for more than a minute (phone locked, other app): lock again
      if (pinOn() && state.hiddenAt && Date.now() - state.hiddenAt > 60000) {
        state.pinUnlockedAt = 0;
        const st = document.getElementById("settings");
        if (st && !st.hidden) closeSettings();
      }
      render();
    });
  }
  function renderPinSettings() {
    const on = pinOn();
    pinEl("pinStatus").innerHTML = on
      ? "🔒 " + H("PIN இயக்கத்தில் உள்ளது", "PIN is ON")
      : "🔓 " + H("PIN இல்லை — யார் வேண்டுமானாலும் அமைப்புகளையும் பழைய பதிவுகளையும் மாற்றலாம்", "No PIN — anyone can change settings and past entries");
    pinEl("btnPinSet").hidden = on;
    pinEl("btnPinChange").hidden = !on;
    pinEl("btnPinOff").hidden = !on;
    pinEl("btnLock").hidden = !on;
  }

  /* ---------- v10: recipes ---------- */
  const SMALL_UNIT = { "கிலோ": { name: "கிராம்", f: 1000 }, "லிட்டர்": { name: "மிலி", f: 1000 } };
  function recipeQtyText(line) {
    const s = (state.settings.stock || []).find((x) => x.id === line.stockId);
    if (!s) return "";
    const small = SMALL_UNIT[s.unit];
    const q = Number(line.qty);
    const amt = small && q < 1 ? L.roundMoney(q * small.f) + " " + unitName(small.name) : q + " " + unitName(s.unit);
    return stockName(s) + " " + amt;
  }
  function renderRecipes() {
    const rec = L.normalizeRecipes(state.settings.recipes);
    const box = document.getElementById("recipeList");
    box.innerHTML = (state.settings.menu || []).map((m) => {
      const r = rec[m.id];
      const lines = r ? r.lines.map(recipeQtyText).filter(Boolean).join(" · ") : "";
      const sub = curLang() !== "en" && m.nameEn && m.nameEn !== menuName(m) ? `<div class="en">${escapeHtml(m.nameEn)}</div>` : "";
      return `<div class="stock-item">
        <div><strong>${escapeHtml(menuName(m))}</strong>${sub}
          <div class="help">${lines ? escapeHtml(lines) : escapeHtml(S("செய்முறை இல்லை", "No recipe yet"))}</div>
          ${r && r.since ? `<div class="help">${escapeHtml(S("கணக்கிடத் தொடங்கிய நாள்", "Counting sales since"))} ${escapeHtml(r.since)}</div>` : ""}
        </div>
        <button type="button" class="ghost" data-recipe="${escapeHtml(m.id)}" style="min-height:52px">${H("திருத்து", "Edit")}</button>
      </div>`;
    }).join("");
  }
  function recipeRowHtml(line, i) {
    const stock = state.settings.stock || [];
    const s = stock.find((x) => x.id === line.stockId) || stock[0];
    const small = s && SMALL_UNIT[s.unit];
    const units = s ? [s.unit].concat(small ? [small.name] : []) : [];
    return `<div class="rc-row" data-i="${i}">
      <select data-k="stock" aria-label="${escapeHtml(S("சரக்கு", "Ingredient"))}">${stock.map((x) => `<option value="${escapeHtml(x.id)}"${s && x.id === s.id ? " selected" : ""}>${escapeHtml(stockName(x))}</option>`).join("")}</select>
      <input data-k="qty" inputmode="decimal" value="${escapeHtml(line.qtyText == null ? "" : String(line.qtyText))}" placeholder="${escapeHtml(S("அளவு", "Qty"))}">
      <select data-k="unit">${units.map((u) => `<option value="${escapeHtml(u)}"${u === line.unit ? " selected" : ""}>${escapeHtml(unitName(u))}</option>`).join("")}</select>
      <button type="button" class="btn-del" data-rm="${i}" aria-label="${escapeHtml(S("நீக்கு", "Remove"))}">🗑️</button>
    </div>`;
  }
  function editorFromRecipe(menuId) {
    const r = L.normalizeRecipes(state.settings.recipes)[menuId];
    const stock = state.settings.stock || [];
    const lines = (r ? r.lines : []).map((l) => {
      const s = stock.find((x) => x.id === l.stockId);
      const small = s && SMALL_UNIT[s.unit];
      if (small && l.qty < 1) return { stockId: l.stockId, qtyText: String(L.roundMoney(l.qty * small.f)), unit: small.name };
      return { stockId: l.stockId, qtyText: String(l.qty), unit: s ? s.unit : "" };
    });
    if (!lines.length && stock.length) lines.push({ stockId: stock[0].id, qtyText: "", unit: stock[0].unit });
    return { menuId, lines };
  }
  function openRecipeEditor(menuId) {
    const m = (state.settings.menu || []).find((x) => x.id === menuId);
    if (!m) return;
    state.recipeEdit = editorFromRecipe(menuId);
    document.getElementById("recipeEditTitle").innerHTML = "🥣 " + escapeHtml(menuName(m)) + "<div>" + H("செய்முறை", "Recipe") + "</div>";
    document.getElementById("recipeError").textContent = "";
    document.getElementById("recipeEditCard").hidden = false;
    renderRecipeLines();
    document.getElementById("recipeEditCard").scrollIntoView({ block: "start" });
  }
  function renderRecipeLines() {
    const ed = state.recipeEdit;
    document.getElementById("recipeLines").innerHTML = ed ? ed.lines.map(recipeRowHtml).join("") : "";
  }
  function readRecipeRows() {
    const ed = state.recipeEdit;
    if (!ed) return [];
    const rows = [...document.querySelectorAll("#recipeLines .rc-row")];
    return rows.map((row, i) => {
      const prev = ed.lines[i] || {};
      const stockId = row.querySelector('[data-k="stock"]').value;
      const unit = row.querySelector('[data-k="unit"]').value;
      return { stockId, qtyText: row.querySelector('[data-k="qty"]').value.trim(), unit, prev };
    });
  }
  function syncRecipeEditorFromDom() {
    if (!state.recipeEdit) return;
    state.recipeEdit.lines = readRecipeRows().map((r) => ({ stockId: r.stockId, qtyText: r.qtyText, unit: r.unit }));
  }
  function saveRecipe() {
    const ed = state.recipeEdit;
    if (!ed) return;
    const stock = state.settings.stock || [];
    const lines = [];
    for (const r of readRecipeRows()) {
      if (!r.qtyText) continue;
      let q = L.parseTamilNumber(r.qtyText);
      if (!(q > 0)) q = Number(String(r.qtyText).replace(",", "."));
      if (!(q > 0)) { document.getElementById("recipeError").textContent = S("அளவு சரியாக இல்லை", "That quantity is not valid"); return; }
      const s = stock.find((x) => x.id === r.stockId);
      const small = s && SMALL_UNIT[s.unit];
      if (small && r.unit === small.name) q = q / small.f;
      lines.push({ stockId: r.stockId, qty: q });
    }
    withPin("recipe", {}, () => {
      state.settings.recipes = L.setRecipe(state.settings.recipes, ed.menuId, lines, L.todayISO());
      saveStore();
      document.getElementById("recipeEditCard").hidden = true;
      state.recipeEdit = null;
      render();
      toast(lines.length ? S("செய்முறை சேமிக்கப்பட்டது ✓ — இனி விற்பனை இருப்பைக் குறைக்கும்", "Recipe saved ✓ — sales now reduce the stock") : S("செய்முறை நீக்கப்பட்டது", "Recipe removed"));
    }, "recipe");
  }
  function bindRecipes() {
    document.getElementById("recipeList").addEventListener("click", (e) => {
      const b = e.target.closest("[data-recipe]");
      if (b) withPin("recipe", {}, () => openRecipeEditor(b.getAttribute("data-recipe")), "recipe");
    });
    const lines = document.getElementById("recipeLines");
    lines.addEventListener("change", (e) => {
      if (e.target.matches('[data-k="stock"]')) {
        syncRecipeEditorFromDom();
        const row = e.target.closest(".rc-row");
        const i = Number(row.getAttribute("data-i"));
        const s = (state.settings.stock || []).find((x) => x.id === e.target.value);
        if (state.recipeEdit && state.recipeEdit.lines[i] && s) state.recipeEdit.lines[i].unit = s.unit;
        renderRecipeLines();
      }
    });
    lines.addEventListener("click", (e) => {
      const rm = e.target.closest("[data-rm]");
      if (!rm || !state.recipeEdit) return;
      syncRecipeEditorFromDom();
      state.recipeEdit.lines.splice(Number(rm.getAttribute("data-rm")), 1);
      renderRecipeLines();
    });
    document.getElementById("recipeAddLine").addEventListener("click", () => {
      if (!state.recipeEdit) return;
      syncRecipeEditorFromDom();
      const s = (state.settings.stock || [])[0];
      if (s) state.recipeEdit.lines.push({ stockId: s.id, qtyText: "", unit: s.unit });
      renderRecipeLines();
    });
    document.getElementById("recipeSave").addEventListener("click", saveRecipe);
    document.getElementById("recipeCancel").addEventListener("click", () => { document.getElementById("recipeEditCard").hidden = true; state.recipeEdit = null; });
    document.getElementById("recipeClear").addEventListener("click", () => {
      if (!state.recipeEdit) return;
      document.querySelectorAll("#recipeLines .rc-row [data-k='qty']").forEach((i) => { i.value = ""; });
      saveRecipe();
    });
  }

  /* ---------- v10: backup reminder + one-tap share ---------- */
  function fmtDateTime(iso) {
    try {
      const loc = { ta: "ta-IN", en: "en-IN", hi: "hi-IN", mr: "mr-IN" }[curLang()] || "en-IN";
      return new Date(iso).toLocaleString(loc, { timeZone: "Asia/Calcutta", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
    } catch (e) { return String(iso); }
  }
  function markBackup() {
    state.settings.lastBackup = new Date().toISOString();
    state.settings.backupSnoozeUntil = null;
    saveStore();
    render();
    renderBackupSettings();
  }
  async function backupNow(mode) {
    const payload = L.buildBackupPayload(state.settings, state.entries, Date.now());
    const text = JSON.stringify(payload, null, 2);
    const name = L.backupFileName(L.todayISO());
    if (mode !== "download") {
      try {
        const file = new File([text], name, { type: "application/json" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: name, text: P("கடை கணக்கு காப்பு", "Kadai Tracker backup") });
          markBackup();
          toast(S("காப்பு பகிரப்பட்டது ✓", "Backup shared ✓"));
          return;
        }
      } catch (e) {
        if (e && e.name === "AbortError") return; // user closed the share sheet: not a backup
        /* any other share problem → download instead */
      }
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    markBackup();
    toast(S("காப்பு கோப்பு பதிவிறக்கம் ஆனது ✓", "Backup downloaded ✓"));
  }
  function renderBackupSettings() {
    const el = document.getElementById("lastBackupLine");
    if (!el) return;
    const last = state.settings.lastBackup;
    el.innerHTML = H("கடைசி காப்பு", "Last backup") + ": <strong>" + (last ? escapeHtml(fmtDateTime(last)) : escapeHtml(S("இன்னும் இல்லை", "never"))) + "</strong>";
  }
  function renderBanners() {
    const b = document.getElementById("backupBanner");
    if (!b) return;
    const due = L.backupReminderDue(state.settings, state.entries.length);
    // one nudge at a time: the backup reminder wins over the install offer (keeps the screen free for the shop)
    document.getElementById("installBanner").hidden = !(state.installEvt && state.installOffer) || due;
    if (!due) { b.hidden = true; b.innerHTML = ""; return; }
    const days = L.daysSinceBackup(state.settings);
    const info = days == null
      ? H("இன்னும் காப்பு இல்லை — பதிவுகள் இந்த போனில் மட்டும்", "No backup yet — entries are only on this phone")
      : H("இன்று காப்பு எடுக்கவில்லை", "No backup taken today") + `<div class="help">${escapeHtml(S("கடைசி காப்பு", "Last backup"))}: ${escapeHtml(fmtDateTime(state.settings.lastBackup))}</div>`;
    b.innerHTML = `<div class="sys-text" style="display:flex;gap:8px;align-items:flex-start"><span aria-hidden="true">📦</span><div>${info}</div></div>
      <div class="sys-btns">
        <button type="button" class="ok" id="backupNow">${H("இப்போது காப்பு", "Back up now")}</button>
        <button type="button" class="ghost" id="backupLater">${H("பிறகு", "Later")}</button>
      </div>`;
    b.hidden = false;
  }

  /* ---------- v10: installable app + update banner ---------- */
  function showUpdateBanner(worker) {
    state.updateWorker = worker || state.updateWorker || null;
    const el = document.getElementById("updateBanner");
    if (el) el.hidden = false;
  }
  function applyUpdate() {
    state.updating = true;
    const w = state.updateWorker;
    if (w && w.postMessage) {
      try { w.postMessage({ type: "SKIP_WAITING" }); } catch (e) { /* ignore */ }
      setTimeout(() => location.reload(), 1500); // fallback if controllerchange never fires
    } else {
      location.reload();
    }
  }
  function checkBuildNow() {
    if (!/^https?:$/.test(location.protocol) || !window.fetch) return;
    fetch(location.pathname + "?b=" + Date.now(), { cache: "no-store" }).then((r) => (r.ok ? r.text() : "")).then((t) => {
      const m = /window\.KADAI_BUILD\s*=\s*"([0-9a-f]{8})"/.exec(t || "");
      if (m && window.KADAI_BUILD && /^[0-9a-f]{8}$/.test(window.KADAI_BUILD) && m[1] !== window.KADAI_BUILD) showUpdateBanner(state.updateWorker);
    }).catch(() => { /* offline: nothing to check */ });
  }
  function setupPwa() {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      state.installEvt = e;
      let dismissed = 0;
      try { dismissed = Number(localStorage.getItem("kadai-install-dismissed") || 0); } catch (err) { /* ignore */ }
      state.installOffer = Date.now() - dismissed > 7 * 86400000;
      renderBanners();
    });
    window.addEventListener("appinstalled", () => { document.getElementById("installBanner").hidden = true; state.installEvt = null; });
    document.getElementById("installBtn").addEventListener("click", () => {
      const ev = state.installEvt;
      state.installOffer = false;
      document.getElementById("installBanner").hidden = true;
      if (ev && ev.prompt) { try { ev.prompt(); } catch (e) { /* ignore */ } }
      state.installEvt = null;
    });
    document.getElementById("installClose").addEventListener("click", () => {
      state.installOffer = false;
      document.getElementById("installBanner").hidden = true;
      try { localStorage.setItem("kadai-install-dismissed", String(Date.now())); } catch (e) { /* ignore */ }
    });
    document.getElementById("updateBtn").addEventListener("click", applyUpdate);
    if (!("serviceWorker" in navigator) || !/^https?:$/.test(location.protocol)) return;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (state.updating) location.reload(); // only after the user tapped the banner
    });
    navigator.serviceWorker.register("sw.js").then((reg) => {
      state.swReg = reg;
      if (reg.waiting && navigator.serviceWorker.controller) showUpdateBanner(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const w = reg.installing;
        if (!w) return;
        w.addEventListener("statechange", () => {
          if (w.state === "installed" && navigator.serviceWorker.controller) showUpdateBanner(w);
        });
      });
      const check = () => { try { reg.update().catch(() => { /* offline */ }); } catch (e) { /* ignore */ } checkBuildNow(); };
      document.addEventListener("visibilitychange", () => { if (!document.hidden) check(); });
      setInterval(check, 30 * 60 * 1000);
      setTimeout(checkBuildNow, 4000);
    }).catch(() => { /* the app works without it */ });
  }

  function bind() {
    paintChromeIcons();
    document.getElementById("dateInput").addEventListener("change", (e) => {
      state.date = L.normalizeDate(e.target.value);
      render();
    });
    document.getElementById("todayBtn").addEventListener("click", () => { state.date = L.todayISO(); render(); });
    document.getElementById("btnIncome").addEventListener("click", () => openForm({ mode: "add", type: "income" }));
    document.getElementById("btnExpense").addEventListener("click", () => openForm({ mode: "add", type: "expense" }));
    document.getElementById("btnSettings").addEventListener("click", () => withPin("settings", {}, openSettings, "settings"));
    document.getElementById("btnAdd").addEventListener("click", (e) => {
      e.stopPropagation();
      const menu = document.getElementById("addMenu");
      setAddMenuOpen(menu && menu.hidden);
    });
    document.addEventListener("click", (e) => {
      const menu = document.getElementById("addMenu");
      if (!menu || menu.hidden) return;
      if (e.target.closest("#addMenu") || e.target.closest("#btnAdd")) return;
      setAddMenuOpen(false);
    });
    document.getElementById("btnIncome").addEventListener("click", () => setAddMenuOpen(false));
    document.getElementById("btnExpense").addEventListener("click", () => setAddMenuOpen(false));
    document.getElementById("backdrop").addEventListener("click", () => {
      setAddMenuOpen(false);
      closeForm(); closeModal(); closeSettings(); closeConfirm(); resetDeleteButtons(); closePin();
    });
    document.getElementById("closeForm").addEventListener("click", closeForm);
    document.getElementById("entryForm").addEventListener("submit", saveForm);
    document.getElementById("moreToggle").addEventListener("click", () => {
      const box = document.getElementById("moreFields");
      setMoreOpen(box.hidden);
    });
    document.getElementById("toastUndo").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      undoDelete();
    });
    document.getElementById("toastEdit").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      editLastSaved();
    });
    document.querySelectorAll("[data-setlang]").forEach((b) => {
      b.addEventListener("click", () => setLanguage(b.getAttribute("data-setlang")));
    });
    document.querySelectorAll("[data-firstlang]").forEach((b) => {
      b.addEventListener("click", () => {
        setLanguage(b.getAttribute("data-firstlang"));
        document.getElementById("langFirst").hidden = true;
      });
    });
    document.getElementById("bulkToggle").addEventListener("change", () => {
      document.getElementById("bulkBox").hidden = !document.getElementById("bulkToggle").checked;
      state.amountManual = false;
      updateCalcPreview();
    });
    ["fldQty", "fldUnitPrice", "fldRefQty", "fldRefAmount"].forEach((id) => {
      document.getElementById(id).addEventListener("input", () => {
        state.amountManual = false;
        updateHints();
        updateCalcPreview();
      });
    });
    document.getElementById("fldAmount").addEventListener("input", () => {
      state.amountManual = true;
      updateHints();
      updateNoteRequirement();
    });
    document.getElementById("chips").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-chip]");
      if (!btn) return;
      const val = btn.getAttribute("data-chip");
      document.getElementById("fldItem").value = val === "பிற" ? "" : val;
      fillChips(state.form.type, val);
      if (val === "சரிகட்டு") { setMoreOpen(true); document.getElementById("fldNote").focus(); }
      else if (val === "பிற") document.getElementById("fldItem").focus();
      else document.getElementById("fldQty").focus();
    });
    document.getElementById("payChips").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-pay]");
      if (!btn) return;
      state.formPay = btn.getAttribute("data-pay");
      syncPayChips();
    });
    document.getElementById("entryList").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      const id = btn.getAttribute("data-id");
      const act = btn.getAttribute("data-act");
      if (act === "edit") {
        const entry = state.entries.find((x) => x.id === id);
        if (entry) openForm({ mode: "edit", type: entry.type, id });
      } else if (act === "delete") askDelete(id);
      else if (act === "qty") changeQty(id, Number(btn.getAttribute("data-delta")));
    });
    (function bindMenuGestures() {
      const grid = document.getElementById("menuGrid");
      let pressTimer = null;
      let pressBtn = null;
      function clearPress() {
        if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
        pressBtn = null;
      }
      function onDown(e) {
        const btn = e.target.closest("[data-menu]");
        if (!btn) return;
        pressBtn = btn;
        state.suppressMenuClick = false;
        pressTimer = setTimeout(() => {
          pressTimer = null;
          state.suppressMenuClick = true;
          showQtyPick(btn.getAttribute("data-menu"));
        }, 450);
      }
      function onUp() { clearPress(); }
      grid.addEventListener("pointerdown", onDown);
      grid.addEventListener("pointerup", onUp);
      grid.addEventListener("pointercancel", onUp);
      grid.addEventListener("pointerleave", (e) => {
        if (e.target === grid) clearPress();
      });
      grid.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-menu]");
        if (!btn) return;
        if (state.suppressMenuClick) {
          state.suppressMenuClick = false;
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        addMenuSale(btn.getAttribute("data-menu"), 1);
      });
    })();
    document.getElementById("cancelDelete").addEventListener("click", () => { closeModal(); resetDeleteButtons(); });
    document.getElementById("confirmDelete").addEventListener("click", () => {
      if (state.pendingPaidName) {
        const name = state.pendingPaidName;
        state.entries = L.markKadanPaid(state.entries, name);
        saveStore();
        closeModal();
        resetDeleteButtons();
        render();
        toast(name + " — " + S("கடன் முடிந்தது", "marked paid"));
        return;
      }
      confirmDelete();
      resetDeleteButtons();
    });
    document.getElementById("kadanList").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-paid]");
      if (btn) askMarkPaid(btn.getAttribute("data-paid"));
    });
    document.getElementById("closeSettings").addEventListener("click", closeSettings);
    document.getElementById("saveSettings").addEventListener("click", () => {
      const typedShop = document.getElementById("setShopName").value.trim();
      state.settings.shopName = isDefaultShopName(typedShop) ? DEFAULT_SHOP_TA : typedShop;
      state.settings.menu = L.normalizeMenu(readMenuEditor());
      saveStore();
      closeSettings();
      render();
      toast(savedToast());
    });
    document.getElementById("addMenuItem").addEventListener("click", () => {
      state.settings.menu = readMenuEditor().concat([{ id: "item-" + Date.now(), nameTa: "", nameEn: "", price: 0, unit: "எண்ணிக்கை" }]);
      renderMenuEditor();
    });
    document.getElementById("menuEditor").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-remove]");
      if (!btn) return;
      const idx = Number(btn.getAttribute("data-remove"));
      const cur = readMenuEditor();
      cur.splice(idx, 1);
      state.settings.menu = cur;
      renderMenuEditor();
    });
    document.getElementById("btnExport").addEventListener("click", exportBackup);
    document.getElementById("btnShareBackup").addEventListener("click", () => backupNow("share"));
    document.getElementById("sysBanners").addEventListener("click", (e) => {
      if (e.target.closest("#backupNow")) backupNow("share");
      else if (e.target.closest("#backupLater")) {
        state.settings.backupSnoozeUntil = new Date(Date.now() + 4 * 3600000).toISOString();
        saveStore();
        renderBanners();
      }
    });
    document.getElementById("importFile").addEventListener("click", (e) => {
      const input = e.currentTarget;
      if (gated("restore", {}, () => input.click(), "restore")) e.preventDefault();
    });
    document.getElementById("importFile").addEventListener("change", (e) => {
      const f = e.target.files && e.target.files[0];
      if (f) importBackup(f);
      e.target.value = "";
    });
    document.getElementById("fldVehicle").addEventListener("input", (e) => {
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      e.target.value = e.target.value.toUpperCase();
      try { e.target.setSelectionRange(start, end); } catch (err) { /* ignore */ }
    });
    // Tap mode (default): a click toggles listening — exactly the v7 path.
    // Hold mode: press starts, release stops; a quick tap (< 600 ms) keeps listening like tap mode.
    const isHold = () => (state.settings.voiceMode || "tap") === "hold" && speechSupported();
    const mic = document.getElementById("micBig");
    mic.addEventListener("click", (e) => {
      if (isHold() && state.holdHandled) { e.preventDefault(); state.holdHandled = false; return; }
      startListen();
    });
    const holdStart = (e) => {
      if (!isHold()) return;
      if (e.button != null && e.button > 0) return;
      state.holdHandled = true;
      if (state.listening) { stopListen("user"); return; }
      state.holdDownAt = Date.now();
      startListen();
      state.holding = state.listening;
    };
    const holdEnd = () => {
      if (!state.holding) return;
      state.holding = false;
      if (Date.now() - (state.holdDownAt || 0) < 600) return; // quick tap → behave like tap mode
      // short grace so the last words arrive as a final result
      setTimeout(() => { if (state.listening && !state.holding) stopListen("user"); }, 450);
    };
    mic.addEventListener("pointerdown", holdStart);
    mic.addEventListener("pointerup", holdEnd);
    mic.addEventListener("pointercancel", holdEnd);
    mic.addEventListener("contextmenu", (e) => { if (isHold()) e.preventDefault(); });
    document.getElementById("voiceModeGrid").addEventListener("click", (e) => {
      const b = e.target.closest("[data-voicemode]");
      if (!b) return;
      state.settings.voiceMode = b.getAttribute("data-voicemode") === "hold" ? "hold" : "tap";
      saveStore();
      render();
    });
    document.getElementById("setMicPulse").addEventListener("change", (e) => {
      state.settings.micPulse = !!e.target.checked;
      saveStore();
    });
    document.getElementById("calcClose").addEventListener("click", hideCalc);
    document.getElementById("calcIncome").addEventListener("click", () => saveCalc("income"));
    document.getElementById("calcExpense").addEventListener("click", () => saveCalc("expense"));
    document.getElementById("unitChips").addEventListener("click", (e) => {
      const b = e.target.closest("[data-unit]");
      if (!b) return;
      document.getElementById("fldUnit").value = b.getAttribute("data-unit");
      renderUnitChips();
      updateCalcPreview();
    });
    document.getElementById("fldUnit").addEventListener("change", renderUnitChips);
    const personClick = (e) => {
      const b = e.target.closest("[data-person]");
      if (b) setPersonFilter(b.getAttribute("data-person"));
    };
    document.getElementById("personCard").addEventListener("click", personClick);
    document.getElementById("personSumCard").addEventListener("click", personClick);
    document.getElementById("filterBar").addEventListener("click", (e) => {
      if (e.target.closest("#clearFilter")) { state.personFilter = ""; render(); }
    });
    document.getElementById("qtyPick").addEventListener("click", (e) => {
      const set = e.target.closest("[data-setqty]");
      if (set) {
        const n = Number(set.getAttribute("data-setqty"));
        setMenuQty(n);
        if (state.qtyForMenuId) {
          addMenuSale(state.qtyForMenuId, n);
          hideQtyPick();
        }
        return;
      }
      const d = e.target.closest("[data-qty-delta]");
      if (d) {
        setMenuQty((state.menuQty || 1) + Number(d.getAttribute("data-qty-delta")));
        if (state.qtyForMenuId) {
          addMenuSale(state.qtyForMenuId, state.menuQty);
          hideQtyPick();
        }
      }
    });
    document.getElementById("confirmTranscript").addEventListener("input", () => {
      if (document.getElementById("confirmCard").hidden) return;
      renderConfirmParsed(document.getElementById("confirmTranscript").value);
    });
    document.getElementById("langTog").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-lang]");
      if (!btn) return;
      state.settings.voiceLang = btn.getAttribute("data-lang");
      saveStore();
      render();
    });
    document.getElementById("quickBtn").addEventListener("click", () => {
      const text = document.getElementById("quickEntry").value.trim();
      if (!text) { toast(S("ஒரு வரியில் எழுதுங்கள்", "Type one line first")); return; }
      runCommand(text, { source: "typed" });
    });
    document.getElementById("quickEntry").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        document.getElementById("quickBtn").click();
      }
    });
    document.getElementById("confirmCancel").addEventListener("click", closeConfirm);
    document.getElementById("confirmEdit").addEventListener("click", editParsed);
    document.getElementById("confirmSave").addEventListener("click", saveParsed);
    document.querySelectorAll(".tabbar button").forEach((b) => {
      b.addEventListener("click", () => setTab(b.getAttribute("data-tab")));
    });
    document.getElementById("stockAlert").addEventListener("click", () => {
      state.tab = "Shop";
      state.shopSection = "stock";
      render();
    });
    document.getElementById("shopSub").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-shop]");
      if (!btn) return;
      state.shopSection = btn.getAttribute("data-shop");
      renderShop();
    });
    document.getElementById("btnStockIn").addEventListener("click", () => withPin("stock", {}, () => openStockMove("in"), "stock"));
    document.getElementById("btnStockOut").addEventListener("click", () => withPin("stock", {}, () => openStockMove("out"), "stock"));
    document.getElementById("btnStockNew").addEventListener("click", () => withPin("stock", {}, () => {
      document.getElementById("stockMoveForm").hidden = true;
      document.getElementById("stockNewForm").hidden = false;
      document.getElementById("newStockTa").focus();
    }, "stock"));
    document.getElementById("stockMoveCancel").addEventListener("click", () => { document.getElementById("stockMoveForm").hidden = true; });
    document.getElementById("stockNewCancel").addEventListener("click", () => { document.getElementById("stockNewForm").hidden = true; });
    document.getElementById("stockMoveForm").addEventListener("submit", (e) => { e.preventDefault(); withPin("stock", {}, submitStockMove, "stock"); });
    document.getElementById("stockNewForm").addEventListener("submit", (e) => { e.preventDefault(); withPin("stock", {}, submitNewStock, "stock"); });
    document.getElementById("saveMargins").addEventListener("click", saveMargins);
    document.getElementById("btnAddStaff").addEventListener("click", () => {
      document.getElementById("wageForm").hidden = true;
      document.getElementById("staffForm").hidden = false;
      document.getElementById("staffName").focus();
    });
    document.getElementById("staffFormCancel").addEventListener("click", () => { document.getElementById("staffForm").hidden = true; });
    document.getElementById("wageFormCancel").addEventListener("click", () => { document.getElementById("wageForm").hidden = true; });
    document.getElementById("staffForm").addEventListener("submit", (e) => { e.preventDefault(); submitStaffForm(); });
    document.getElementById("wageForm").addEventListener("submit", (e) => { e.preventDefault(); submitWage(); });
    document.getElementById("staffList").addEventListener("click", (e) => {
      const pay = e.target.closest("[data-payunpaid]");
      if (pay) { payUnpaidWage(pay.getAttribute("data-payunpaid")); return; }
      const wage = e.target.closest("[data-wage]");
      if (wage) openWageForm(wage.getAttribute("data-staff"), wage.getAttribute("data-wage"));
    });
    document.getElementById("btnWhatsApp").addEventListener("click", shareWhatsApp);
    document.getElementById("btnCsv").addEventListener("click", downloadCsv);

    const unsup = L.unsupportedVoiceCode(navigator.userAgent || "", speechSupported());
    if (unsup) {
      document.getElementById("micBig").classList.add("off");
      document.getElementById("voiceNote").hidden = false;
      const vn = document.getElementById("voiceNote");
      const msg = L.voiceErrorMessage(unsup);
      const l = curLang();
      vn.innerHTML = l === "en" ? '<span class="ta">' + msg.en + "</span>" : '<span class="ta">' + (msg[l] || msg.en) + '</span><br><span class="en">' + msg.en + "</span>";
      syncVoicePanel();
    }
    showLive();
    if (!state.settings.lang) document.getElementById("langFirst").hidden = false;
  }

  /* ---------- v7: language switch ---------- */
  function setLanguage(lang) {
    if (LANGS.indexOf(lang) === -1) return;
    state.settings.lang = lang;
    state.settings.voiceLang = L.speechLangFor(lang);
    saveStore();
    hideToast();
    render();
    if (!document.getElementById("settings").hidden) {
      renderMenuEditor();
      const inp = document.getElementById("setShopName");
      if (isDefaultShopName(inp.value)) inp.value = shopTitle();
    }
    showLive();
    syncMicLabel();
  }

  const PLACEHOLDERS = {
    quickEntry: {
      ta: "20000 போடு · 100 ரூபா டீ ரவி பேருக்கு",
      en: "20000 add · 100 tea Ravi's name · 50 minus",
      hi: "20000 डालो · रवि के नाम 100 चाय",
      mr: "20000 टाका · रवीच्या नावावर 100 चहा"
    },
    fldItem: { ta: "எ.கா. இட்லி, அரிசி, எண்ணெய்", en: "e.g. idli, rice, oil", hi: "जैसे इडली, चावल, तेल", mr: "उदा. इडली, तांदूळ, तेल" },
    fldQty: { ta: "3 / மூன்று / moonu", en: "3 / three", hi: "3 / तीन / teen", mr: "3 / तीन" },
    fldUnitPrice: { ta: "ஐம்பது / 50 / aimbadhu", en: "50 / fifty", hi: "50 / पचास / pachas", mr: "50 / पन्नास" },
    fldAmount: { ta: "நூற்றி ஐம்பது / 150", en: "150", hi: "150 / डेढ़ सौ", mr: "150 / दीडशे" },
    fldRefQty: { ta: "பத்து / 10 / pathu", en: "10 / ten", hi: "10 / दस", mr: "10 / दहा" },
    fldRefAmount: { ta: "நூறு / 100 / nooru", en: "100 / hundred", hi: "100 / सौ", mr: "100 / शंभर" },
    fldNote: { ta: "சரிகட்டு, கழிவு, அல்லது வேறு விவரம்", en: "Adjustment or other detail", hi: "समायोजन या कोई और बात", mr: "समायोजन किंवा इतर तपशील" },
    fldCustomer: { ta: "எ.கா. ரமேஷ் / Ramesh", en: "e.g. Ramesh", hi: "जैसे रमेश / Ramesh", mr: "उदा. रमेश / Ramesh" },
    staffName: { ta: "எ.கா. முருகன்", en: "e.g. Murugan", hi: "जैसे राजू", mr: "उदा. राजू" },
    stockAmount: { ta: "விருப்பம்", en: "optional", hi: "चाहें तो", mr: "हवे असल्यास" },
    stockNote: { ta: "விருப்பம்", en: "optional", hi: "चाहें तो", mr: "हवे असल्यास" }
  };

  /** Re-label the static page (Tamil originals stay in data-ta0 / data-en0). */
  function applyStaticLang() {
    const l = curLang();
    document.documentElement.lang = l;
    document.body.classList.remove("lang-ta", "lang-en", "lang-hi", "lang-mr");
    document.body.classList.add("lang-" + l);
    document.querySelectorAll(".bi").forEach((el) => {
      if (el.hasAttribute("data-dyn")) return;
      if (el.closest("#entryList, #kadanList, #eodCard, #weekCard, #monthCard, #topCard, #stockList, #staffList, #dayMarginBox, #marginList, #menuEditor, #confirmBody, #toastMsg, #liveBox, #menuGrid, #chips, #modalBody")) return;
      const ta = el.querySelector(":scope > .ta");
      const en = el.querySelector(":scope > .en");
      if (!ta || !en || ta.id || en.id) return;
      if (el.dataset.ta0 == null) {
        el.dataset.ta0 = ta.textContent;
        el.dataset.en0 = en.textContent;
      }
      const p = P(el.dataset.ta0, el.dataset.en0);
      ta.textContent = p;
      en.hidden = l === "en" || p === el.dataset.en0;
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      const parts = el.getAttribute("data-i18n-aria").split("|");
      el.setAttribute("aria-label", S(parts[0], parts[1]));
    });
    Object.keys(PLACEHOLDERS).forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.setAttribute("placeholder", PLACEHOLDERS[id][l] || PLACEHOLDERS[id].en);
    });
    document.querySelectorAll("#fldUnit option").forEach((o) => {
      if (o.dataset.u == null) o.dataset.u = o.value || o.textContent;
      o.value = o.dataset.u;
      o.textContent = l === "ta" ? o.dataset.u : unitName(o.dataset.u);
    });
    const sub = document.querySelector("header.top .sub");
    if (sub) sub.textContent = l === "ta" ? "இட்லி • தோசை • டீ — Mumbai" : [itemName("இட்லி"), itemName("தோசை"), itemName("டீ")].join(" • ") + " — Mumbai";
    const mic = document.getElementById("micLabel");
    if (mic && !state.listening) syncMicLabel();
    document.title = l === "ta" ? "கடை கணக்கு — Kadai Tracker" : P("கடை கணக்கு", "Kadai Tracker") + (l === "en" ? "" : " — Kadai Tracker");
  }

  loadStore();
  syncStock();
  if (state.settingsMigrated) {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings)); } catch (e) { /* ignore */ }
  }
  bind();
  bindPin();
  bindRecipes();
  setupPwa();
  render();
})();
