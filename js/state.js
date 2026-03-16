// ============================================================
//  state.js  —  Central state
//  Primary store: Firebase Firestore
//  Fallback:      localStorage (offline / Firebase unavailable)
// ============================================================

const STATE = (() => {

  // ── LIVE STATE OBJECT ────────────────────────────────────
  let s = {
    startDate:    DATA.DEFAULTS.startDate,
    durationDays: DATA.DEFAULTS.durationDays,
    lecsPerDay:   DATA.DEFAULTS.lecsPerDay,
    hoursPerLec:  DATA.DEFAULTS.hoursPerLecture,

    subjects: DATA.DEFAULT_SUBJECTS.map(sub => ({
      ...sub,
      targetLecs: 20,
      lecsPerDay: null,
      active:     true,
    })),

    checked:   {},   // { [checkKey]: true }
    notes:     {},   // { [dateISO]: "string" }
    missed:    {},   // { [dateISO]: true }
    extras:    {},   // { [subjectId]: extraLecs }
    collapsed: {},   // { [dateISO]: true }
    darkMode:  false,
    filter:    "all",
  };

  // ── FLAGS ─────────────────────────────────────────────────
  let _firebaseReady  = false;
  let _saveDebounce   = null;
  const LS_KEY        = "studycal_v2";

  // ── MERGE helper — safe-merge remote into s ───────────────
  function _merge(remote) {
    if (!remote || typeof remote !== "object") return;
    Object.keys(s).forEach(k => {
      if (k in remote) s[k] = remote[k];
    });
  }

  // ── LOAD ─────────────────────────────────────────────────
  // 1. Load from localStorage immediately (instant UI)
  // 2. Then load from Firebase and overwrite (authoritative)
  async function load() {
    // Step 1: localStorage for instant render
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) _merge(JSON.parse(raw));
    } catch(e) {
      console.warn("studycal: localStorage load failed", e);
    }

    // Step 2: Firebase (authoritative, may overwrite local)
    const remote = await FB.load();
    if (remote) {
      _merge(remote);
      // sync localStorage with Firebase data
      try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch(_) {}
    }

    _firebaseReady = true;
  }

  // ── SAVE ─────────────────────────────────────────────────
  // Debounced: waits 600ms after last change before writing
  // Writes to both localStorage (instant) and Firebase (cloud)
  function save() {
    // localStorage — immediate
    try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch(_) {}

    // Firebase — debounced to avoid hammering on rapid changes
    clearTimeout(_saveDebounce);
    _saveDebounce = setTimeout(async () => {
      if (_firebaseReady) {
        await FB.save(s);
      }
    }, 600);
  }

  // ── REMOTE UPDATE (from Firestore real-time listener) ─────
  // Called when another device saves — update state + re-render
  function applyRemoteUpdate(remote) {
    _merge(remote);
    try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch(_) {}
    // re-render UI with new data
    if (typeof APP !== "undefined") APP.refresh();
  }

  // ── GET / SET ────────────────────────────────────────────
  function get()          { return s; }
  function set(patch)     { Object.assign(s, patch); save(); }
  function setSubjects(a) { s.subjects = a; save(); }

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
  function isMissed(iso)    { return !!s.missed[iso]; }

  // ── COLLAPSE ─────────────────────────────────────────────
  function toggleCollapse(iso) {
    if (s.collapsed[iso]) delete s.collapsed[iso];
    else s.collapsed[iso] = true;
    save();
  }
  function isCollapsed(iso) { return !!s.collapsed[iso]; }

  // ── JSON EXPORT ──────────────────────────────────────────
  function exportJSON() {
    const blob = new Blob([JSON.stringify(s, null, 2)], { type:"application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `studycal-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── JSON IMPORT ──────────────────────────────────────────
  function importJSON(file, onDone) {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const imported = JSON.parse(e.target.result);
        if (!imported.subjects || !Array.isArray(imported.subjects)) {
          alert("Invalid backup file — missing subjects array."); return;
        }
        _merge(imported);
        save();
        if (onDone) onDone();
      } catch(err) {
        alert("Failed to parse JSON file: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  // ── RESET ────────────────────────────────────────────────
  function reset() {
    s.checked = {}; s.notes = {}; s.missed = {};
    s.extras  = {}; s.collapsed = {};
    save();
  }

  return {
    load, save, get, set, setSubjects,
    applyRemoteUpdate,
    checkKey, toggleCheck, isChecked,
    setNote, getNote,
    toggleMissed, isMissed,
    toggleCollapse, isCollapsed,
    exportJSON, importJSON, reset,
  };
})();
