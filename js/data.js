// ============================================================
//  data.js  —  Master subject list, defaults, constants
// ============================================================

const DATA = (() => {

  // ── SUBJECT DEFINITIONS ──────────────────────────────────
  // type:  L=Language  T=Theory  P=Practical  M=Management
  // days:  1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat  (0=Sun skip)
  const DEFAULT_SUBJECTS = [
    // ── GROUP A : Mon / Wed / Fri ──
   
  ];

  // ── GLOBAL DEFAULTS ──────────────────────────────────────
  const DEFAULTS = {
    startDate:        "2026-03-12",   // ISO yyyy-mm-dd
    durationDays:     30,
    lecsPerDay:       2,              // global fallback lectures per subject per study day
    hoursPerLecture:  1.0,            // for daily hours estimator
  };

  // ── TYPE META ────────────────────────────────────────────
  const TYPE_META = {
    L: { label:"Language",   cssClass:"lang",      color:"#2563eb" },
    T: { label:"Theory",     cssClass:"theory",    color:"#7c3aed" },
    P: { label:"Practical",  cssClass:"practical", color:"#059669" },
    M: { label:"Management", cssClass:"mgt",       color:"#d97706" },
  };

  // ── DAY NAMES ────────────────────────────────────────────
  const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  return { DEFAULT_SUBJECTS, DEFAULTS, TYPE_META, DAY_NAMES };
})();
