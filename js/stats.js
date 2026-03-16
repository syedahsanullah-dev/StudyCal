// ============================================================
//  stats.js  —  Stats bar + subject progress grid
// ============================================================

const STATS = (() => {

  // ── UPDATE TOP STATS BAR ─────────────────────────────────
  function updateStatsBar(stats) {
    const { totalDone, totalTarget, overallPct, dailyHours, remainingDays } = stats;

    document.getElementById("stat-done").textContent      = totalDone;
    document.getElementById("stat-remaining").textContent  = totalTarget - totalDone;
    document.getElementById("stat-pct").textContent        = overallPct + "%";
    document.getElementById("stat-hours").textContent      = dailyHours + "h";
    document.getElementById("stat-days").textContent       = remainingDays;

    const fill  = document.getElementById("overall-bar-fill");
    const label = document.getElementById("overall-bar-label");
    if (fill)  fill.style.width   = overallPct + "%";
    if (label) label.textContent  = overallPct + "%";
  }

  // ── RENDER SUBJECT PROGRESS GRID ─────────────────────────
  function renderProgressGrid(stats) {
    const grid = document.getElementById("progress-grid");
    if (!grid) return;

    const s      = STATE.get();
    const filter = s.filter;
    grid.innerHTML = "";

    Object.values(stats.subStats).forEach(ss => {
      const { sub, target, done, remaining, pct, estCompletion } = ss;
      const tc = RENDER.typeClass(sub.type);
      const tl = RENDER.typeLabel(sub.type);

      // dim card if filtered out
      const dimmed = filter !== "all" && filter !== sub.type && filter !== sub.id;

      const card = document.createElement("div");
      card.className = `prog-card ${dimmed ? "dimmed" : ""}`;

      // estimated completion display
      const estText = estCompletion
        ? RENDER.fmtISO(estCompletion)
        : "—";

      card.innerHTML = `
        <div class="prog-top">
          <span class="prog-name">${sub.name}</span>
          <span class="prog-badge ${tc}">${tl}</span>
        </div>
        <div class="prog-bar-wrap">
          <div class="prog-bar ${tc}" style="width:${pct}%"></div>
        </div>
        <div class="prog-meta">
          <span class="prog-counts">${done} / ${target} lecs</span>
          <span class="prog-pct">${pct}%</span>
        </div>
        <div class="prog-est">
          <span class="prog-est-label">Est. completion:</span>
          <span class="prog-est-date ${pct>=100 ? "est-done" : ""}">${pct >= 100 ? "✓ Done" : estText}</span>
        </div>
      `;

      grid.appendChild(card);
    });
  }

  // ── TOGGLE PROGRESS SECTION VISIBILITY ───────────────────
  function initProgressToggle() {
    const btn     = document.getElementById("btn-toggle-progress");
    const section = document.getElementById("progress-grid");
    if (!btn || !section) return;

    btn.addEventListener("click", () => {
      const hidden = section.classList.toggle("hidden");
      btn.textContent = hidden ? "Show" : "Hide";
    });
  }

  return { updateStatsBar, renderProgressGrid, initProgressToggle };
})();
