// ============================================================
//  state.js  —  Central state
//  Primary store: Firebase Realtime DB
//  Fallback:      localStorage (offline)
// ============================================================

const STATE = (() => {

  let s = {
    startDate:      DATA.DEFAULTS.startDate,
    durationDays:   DATA.DEFAULTS.durationDays,
    lecsPerDay:     DATA.DEFAULTS.lecsPerDay,
    hoursPerLec:    DATA.DEFAULTS.hoursPerLecture,

    subjects: DATA.DEFAULT_SUBJECTS.map(sub => ({
      ...sub,
      targetLecs: 20,
      lecsPerDay: null,
      active:     true,
    })),

    checked:       {},   // { [checkKey]: true }
    notes:         {},   // { [dateISO]: "string" }
    missed:        {},   // { [dateISO]: true }
    extras:        {},   // { [subjectId]: extraLecs }
    collapsed:     {},   // { [dateISO]: true }
    disabledDates: {},   // { [dateISO]: true }  ← NEW
    darkMode:      false,
    filter:        "all",
  };

  let _firebaseReady = false;
  let _saveDebounce  = null;
  const LS_KEY       = "studycal_v2";

  function _merge(remote) {
    if (!remote || typeof remote !== "object") return;
    Object.keys(s).forEach(k => { if (k in remote) s[k] = remote[k]; });
  }

  // ── LOAD ─────────────────────────────────────────────────
  async function load() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) _merge(JSON.parse(raw));
    } catch(e) {}

    const remote = await FB.load();
    if (remote) {
      _merge(remote);
      try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch(_) {}
    }
    _firebaseReady = true;
  }

  // ── SAVE ─────────────────────────────────────────────────
  function save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch(_) {}
    clearTimeout(_saveDebounce);
    _saveDebounce = setTimeout(async () => {
      if (_firebaseReady) await FB.save(s);
    }, 600);
  }

  function applyRemoteUpdate(remote) {
    _merge(remote);
    try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch(_) {}
    if (typeof APP !== "undefined") APP.refresh();
  }

  // ── GET / SET ────────────────────────────────────────────
  function get()           { return s; }
  function set(patch)      { Object.assign(s, patch); save(); }
  function setSubjects(a)  { s.subjects = a; save(); }

  // ── CHECKED ──────────────────────────────────────────────
  function checkKey(subId, startLec) { return `${subId}-${startLec}`; }
  function toggleCheck(key) {
    if (s.checked[key]) delete s.checked[key];
    else s.checked[key] = true;
    save();
  }
  function isChecked(key) { return !!s.checked[key]; }

  // ── NOTES ────────────────────────────────────────────────
  function setNote(iso, text) {
    if (text.trim() === "") delete s.notes[iso];
    else s.notes[iso] = text;
    save();
  }
  function getNote(iso) { return s.notes[iso] || ""; }

  // ── MISSED ───────────────────────────────────────────────
  function toggleMissed(iso) {
    if (s.missed[iso]) delete s.missed[iso];
    else s.missed[iso] = true;
    save();
  }
  function isMissed(iso) { return !!s.missed[iso]; }

  // ── DISABLED DATES ────────────────────────────────────── NEW
  function toggleDisabledDate(iso) {
    if (s.disabledDates[iso]) delete s.disabledDates[iso];
    else s.disabledDates[iso] = true;
    save();
  }
  function isDisabledDate(iso) { return !!s.disabledDates[iso]; }

  // ── COLLAPSE ─────────────────────────────────────────────
  function toggleCollapse(iso) {
    if (s.collapsed[iso]) delete s.collapsed[iso];
    else s.collapsed[iso] = true;
    save();
  }
  function isCollapsed(iso) { return !!s.collapsed[iso]; }

  // ── REDISTRIBUTE missed-day lectures ─────────────────────
  function redistributeMissed(dayObj) {
    const extras = { ...(s.extras || {}) };
    dayObj.items.forEach(item => {
      if (!item.isDone) {
        const count = item.endLec - item.startLec + 1;
        extras[item.sub.id] = (extras[item.sub.id] || 0) + count;
      }
    });
    set({ extras });
  }
  function undoRedistribute(dayObj) {
    const extras = { ...(s.extras || {}) };
    dayObj.items.forEach(item => {
      const count = item.endLec - item.startLec + 1;
      extras[item.sub.id] = Math.max(0, (extras[item.sub.id] || 0) - count);
      if (extras[item.sub.id] === 0) delete extras[item.sub.id];
    });
    set({ extras });
  }

  // ── JSON EXPORT / IMPORT ─────────────────────────────────
  function exportJSON() {
    const blob = new Blob([JSON.stringify(s, null, 2)], { type:"application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `studycal-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  function importJSON(file, onDone) {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const imported = JSON.parse(e.target.result);
        if (!imported.subjects || !Array.isArray(imported.subjects)) {
          alert("Invalid backup file."); return;
        }
        _merge(imported); save();
        if (onDone) onDone();
      } catch(err) { alert("Failed to parse: " + err.message); }
    };
    reader.readAsText(file);
  }

  // ── RESET ────────────────────────────────────────────────
  function reset() {
    s.checked = {}; s.notes = {}; s.missed = {};
    s.extras  = {}; s.collapsed = {}; s.disabledDates = {};
    save();
  }

  return {
    load, save, get, set, setSubjects,
    applyRemoteUpdate,
    checkKey, toggleCheck, isChecked,
    setNote, getNote,
    toggleMissed, isMissed,
    toggleDisabledDate, isDisabledDate,
    toggleCollapse, isCollapsed,
    redistributeMissed, undoRedistribute,
    exportJSON, importJSON, reset,
  };
})();
