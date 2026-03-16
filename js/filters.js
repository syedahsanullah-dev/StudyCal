// ============================================================
//  filters.js  —  Filter bar, collapse/expand all, jump today
// ============================================================

const FILTERS = (() => {

  function init() {
    _initFilterBtns();
    _initCollapseExpand();
    _initJumpToday();
  }

  // ── FILTER BUTTONS ────────────────────────────────────────
  function _initFilterBtns() {
    const bar = document.getElementById("filter-bar");
    if (!bar) return;

    bar.querySelectorAll(".fbtn[data-filter]").forEach(btn => {
      btn.addEventListener("click", e => {
        // deactivate all, activate clicked
        bar.querySelectorAll(".fbtn").forEach(b => b.classList.remove("active"));
        e.currentTarget.classList.add("active");

        const f = e.currentTarget.dataset.filter;
        STATE.set({ filter: f });
        APP.refresh();
      });
    });

    // sync active state on re-render (in case filter was loaded from state)
    syncFilterBtns();
  }

  function syncFilterBtns() {
    const f   = STATE.get().filter;
    const bar = document.getElementById("filter-bar");
    if (!bar) return;

    bar.querySelectorAll(".fbtn[data-filter]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.filter === f);
    });
  }

  // ── COLLAPSE / EXPAND ALL ─────────────────────────────────
  function _initCollapseExpand() {
    document.getElementById("btn-collapse-all")?.addEventListener("click", () => {
      const plan = PLAN.build();
      RENDER.collapseAll(plan);
    });

    document.getElementById("btn-expand-all")?.addEventListener("click", () => {
      RENDER.expandAll();
    });
  }

  // ── JUMP TO TODAY ─────────────────────────────────────────
  function _initJumpToday() {
    document.getElementById("btn-jump-today")?.addEventListener("click", () => {
      RENDER.jumpToToday();
    });
  }

  return { init, syncFilterBtns };
})();
