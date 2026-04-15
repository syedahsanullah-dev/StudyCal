// // ============================================================
// //  main.js  —  Boot: Firebase init, wires all modules,
// //              dark mode, header buttons, sync indicator
// // ============================================================

// const APP = (() => {

//   // ── MAIN REFRESH ─────────────────────────────────────────
//   function refresh() {
//     const plan  = PLAN.build();
//     const stats = PLAN.computeStats(plan);

//     RENDER.updateHeaderRange();
//     STATS.updateStatsBar(stats);
//     STATS.renderProgressGrid(stats);
//     RENDER.renderCalendar(plan);
//     FILTERS.syncFilterBtns();
//   }

//   // ── SYNC STATUS INDICATOR ─────────────────────────────────
//   // Shows a small dot in the header: green=synced, yellow=saving, red=offline
//   function _setSyncStatus(status) {
//     const dot = document.getElementById("sync-dot");
//     const lbl = document.getElementById("sync-label");
//     if (!dot || !lbl) return;

//     const map = {
//       synced:  { color:"#16a34a", text:"Synced"  },
//       saving:  { color:"#d97706", text:"Saving…" },
//       offline: { color:"#dc2626", text:"Offline" },
//       init:    { color:"#9ca3af", text:"Connecting…" },
//     };
//     const m = map[status] || map.init;
//     dot.style.background = m.color;
//     lbl.textContent      = m.text;
//   }

//   // ── DARK MODE ─────────────────────────────────────────────
//   function _initDarkMode() {
//     const btn = document.getElementById("btn-dark");
//     if (!btn) return;
//     if (STATE.get().darkMode) {
//       document.body.classList.add("dark");
//       btn.textContent = "☀";
//     }
//     btn.addEventListener("click", () => {
//       const isDark = document.body.classList.toggle("dark");
//       btn.textContent = isDark ? "☀" : "🌙";
//       STATE.set({ darkMode: isDark });
//     });
//   }

//   // ── HEADER EXPORT / IMPORT / PRINT ────────────────────────
//   function _initHeaderActions() {
//     document.getElementById("btn-export")?.addEventListener("click", () => STATE.exportJSON());

//     const importTrigger = document.getElementById("btn-import-trigger");
//     const importInput   = document.getElementById("btn-import");
//     importTrigger?.addEventListener("click", () => importInput?.click());
//     importInput?.addEventListener("change", e => {
//       const file = e.target.files?.[0];
//       if (!file) return;
//       STATE.importJSON(file, () => refresh());
//       e.target.value = "";
//     });

//     document.getElementById("btn-print")?.addEventListener("click", () => window.print());
//   }

//   // ── BOOT ─────────────────────────────────────────────────
//   async function boot() {

//     // 1. Init Firebase and register remote-update callback
//     _setSyncStatus("init");
//     const fbOk = await FB.init((remoteData) => {
//       // called when another device saves data
//       _setSyncStatus("saving");
//       STATE.applyRemoteUpdate(remoteData);
//       _setSyncStatus("synced");
//     });

//     if (!fbOk) _setSyncStatus("offline");

//     // 2. Load state (localStorage instantly, then Firebase overwrites)
//     await STATE.load();
//     if (fbOk) _setSyncStatus("synced");

//     // 3. Wire up UI modules
//     _initDarkMode();
//     _initHeaderActions();
//     STATS.initProgressToggle();
//     SETTINGS.init();
//     FILTERS.init();

//     // 4. Initial render
//     refresh();

//     // 5. Patch save() to show sync indicator
//     const origSave = STATE.save;
//     // Monkey-patch to show "saving" during debounce window
//     const origSet  = STATE.set;
//     STATE.set = function(patch) {
//       _setSyncStatus("saving");
//       origSet.call(this, patch);
//       setTimeout(() => _setSyncStatus("synced"), 800);
//     };
//   }

//   if (document.readyState === "loading") {
//     document.addEventListener("DOMContentLoaded", boot);
//   } else {
//     boot();
//   }

//   return { refresh };
// })();
// ============================================================
//  main.js  —  Boot: Firebase init, wires all modules,
//              dark mode, header buttons, sync indicator
// ============================================================

const APP = (() => {

  // ── MAIN REFRESH ─────────────────────────────────────────
  function refresh() {
    const plan  = PLAN.build();
    const stats = PLAN.computeStats(plan);

    RENDER.updateHeaderRange();
    STATS.updateStatsBar(stats);
    STATS.renderProgressGrid(stats);
    RENDER.renderCalendar(plan);
    FILTERS.syncFilterBtns();
    
    // NEW: Render the dynamic accordion on the dashboard!
    SESSIONS.renderDashboardAccordion(); 
  }

  // ── SYNC STATUS INDICATOR ─────────────────────────────────
  // Shows a small dot in the header: green=synced, yellow=saving, red=offline
  function _setSyncStatus(status) {
    const dot = document.getElementById("sync-dot");
    const lbl = document.getElementById("sync-label");
    if (!dot || !lbl) return;

    const map = {
      synced:  { color:"#16a34a", text:"Synced"  },
      saving:  { color:"#d97706", text:"Saving…" },
      offline: { color:"#dc2626", text:"Offline" },
      init:    { color:"#9ca3af", text:"Connecting…" },
    };
    const m = map[status] || map.init;
    dot.style.background = m.color;
    lbl.textContent      = m.text;
  }

  // ── DARK MODE ─────────────────────────────────────────────
  function _initDarkMode() {
    const btn = document.getElementById("btn-dark");
    if (!btn) return;
    if (STATE.get().darkMode) {
      document.body.classList.add("dark");
      btn.textContent = "☀";
    }
    btn.addEventListener("click", () => {
      const isDark = document.body.classList.toggle("dark");
      btn.textContent = isDark ? "☀" : "🌙";
      STATE.set({ darkMode: isDark });
    });
  }

  // ── HEADER EXPORT / IMPORT / PRINT ────────────────────────
  function _initHeaderActions() {
    document.getElementById("btn-export")?.addEventListener("click", () => STATE.exportJSON());

    const importTrigger = document.getElementById("btn-import-trigger");
    const importInput   = document.getElementById("btn-import");
    importTrigger?.addEventListener("click", () => importInput?.click());
    importInput?.addEventListener("change", e => {
      const file = e.target.files?.[0];
      if (!file) return;
      STATE.importJSON(file, () => refresh());
      e.target.value = "";
    });

    document.getElementById("btn-print")?.addEventListener("click", () => window.print());
  }

  // ── BOOT ─────────────────────────────────────────────────
  async function boot() {

    // 1. Init Firebase and register remote-update callback
    _setSyncStatus("init");
    const fbOk = await FB.init((remoteData) => {
      // called when another device saves data
      _setSyncStatus("saving");
      STATE.applyRemoteUpdate(remoteData);
      _setSyncStatus("synced");
    });

    if (!fbOk) _setSyncStatus("offline");

    // 2. Load state (localStorage instantly, then Firebase overwrites)
    await STATE.load();
    if (fbOk) _setSyncStatus("synced");

    // 3. Wire up UI modules
    _initDarkMode();
    _initHeaderActions();
    STATS.initProgressToggle();
    SETTINGS.init();
    FILTERS.init();

    // 4. Initial render
    refresh();

    // 5. Patch save() to show sync indicator
    const origSave = STATE.save;
    // Monkey-patch to show "saving" during debounce window
    const origSet  = STATE.set;
    STATE.set = function(patch) {
      _setSyncStatus("saving");
      origSet.call(this, patch);
      setTimeout(() => _setSyncStatus("synced"), 800);
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  return { refresh };
})();