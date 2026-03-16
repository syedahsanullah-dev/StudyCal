// ============================================================
//  render.js  —  Calendar cards, checkboxes, notes, missed,
//                collapse/expand, overdue highlights
// ============================================================

const RENDER = (() => {

  // ── HELPERS ──────────────────────────────────────────────
  function typeClass(type) {
    return DATA.TYPE_META[type]?.cssClass || "";
  }

  function typeLabel(type) {
    return DATA.TYPE_META[type]?.label || type;
  }

  function fmt(date) {
    return date.toLocaleDateString("en-GB", {
      weekday:"short", day:"numeric", month:"short"
    });
  }

  function fmtISO(iso) {
    if (!iso) return "—";
    const [y,m,d] = iso.split("-");
    const date = new Date(Number(y), Number(m)-1, Number(d));
    return date.toLocaleDateString("en-GB", { day:"numeric", month:"short" });
  }

  // ── BUILD ONE DAY CARD ────────────────────────────────────
  function buildCard(dayObj) {
    const { iso, date, isToday, isPast, isMissed, isSunday, items } = dayObj;
    const isOverdue   = PLAN.isOverdue(dayObj);
    const isCollapsed = STATE.isCollapsed(iso);
    const note        = STATE.getNote(iso);
    const s           = STATE.get();
    const filter      = s.filter;

    // ── card wrapper ──
    const card = document.createElement("div");
    card.className = [
      "day-card",
      isToday    ? "is-today"   : "",
      isPast && !isToday ? "is-past" : "",
      isOverdue  ? "is-overdue" : "",
      isMissed   ? "is-missed"  : "",
      isCollapsed ? "is-collapsed" : "",
    ].filter(Boolean).join(" ");
    card.dataset.iso = iso;
    if (isToday) card.id = "today-card";

    // ── day count done / total ──
    const total    = items.length;
    const doneCount = items.filter(i => i.isDone).length;
    const dayPct   = total > 0 ? Math.round((doneCount / total) * 100) : null;

    // ── HEADER ──
    const header = document.createElement("div");
    header.className = "dc-header";
    header.innerHTML = `
      <div class="dc-date-wrap">
        <span class="dc-date">${fmt(date)}</span>
        ${isToday   ? '<span class="dc-badge today-badge">Today</span>'   : ""}
        ${isOverdue ? '<span class="dc-badge overdue-badge">Overdue</span>' : ""}
        ${isMissed  ? '<span class="dc-badge missed-badge">Missed</span>'  : ""}
      </div>
      <div class="dc-header-right">
        ${total > 0 ? `<span class="dc-pct ${dayPct===100 ? "pct-done":""}">${dayPct}%</span>` : ""}
        <button class="dc-collapse-btn" data-iso="${iso}" title="${isCollapsed ? "Expand":"Collapse"}">
          ${isCollapsed ? "▶" : "▼"}
        </button>
      </div>
    `;
    card.appendChild(header);

    // ── COLLAPSIBLE BODY ──
    const body = document.createElement("div");
    body.className = "dc-body" + (isCollapsed ? " hidden" : "");

    // ── day progress bar ──
    if (total > 0) {
      const barWrap = document.createElement("div");
      barWrap.className = "dc-bar-wrap";
      barWrap.innerHTML = `<div class="dc-bar" style="width:${dayPct}%"></div>`;
      body.appendChild(barWrap);
    }

    // ── subject list ──
    const ul = document.createElement("ul");
    ul.className = "dc-list";

    if (isSunday) {
      ul.innerHTML = `
        <li class="dc-revision">
          <span class="dc-rev-icon">🔄</span>
          <div><strong>Revision Day</strong><br>
          <small>Review code, notes &amp; catch up</small></div>
        </li>`;
    } else if (total === 0) {
      ul.innerHTML = `<li class="dc-complete">🎉 All lectures for these subjects complete!</li>`;
    } else {
      // apply filter
      let visible = items;
      if (filter !== "all") {
        visible = items.filter(it =>
          filter.length === 1
            ? it.sub.type === filter
            : it.sub.id   === filter
        );
      }

      if (visible.length === 0) {
        ul.innerHTML = `<li class="dc-no-match">No matching subjects today</li>`;
      } else {
        visible.forEach(item => {
          const tc     = typeClass(item.sub.type);
          const isDone = item.isDone;
          const li     = document.createElement("li");
          li.className = `dc-item ${tc} ${isDone ? "dc-done" : ""}`;
          li.innerHTML = `
            <label class="dc-check-label">
              <input type="checkbox"
                     class="dc-checkbox"
                     data-key="${item.checkKey}"
                     ${isDone ? "checked" : ""}>
              <span class="dc-item-text">
                <span class="dc-sub-name">${item.sub.name}</span>
                <span class="dc-lec-range">Lec ${item.startLec}–${item.endLec}</span>
              </span>
            </label>`;
          ul.appendChild(li);
        });
      }
    }

    body.appendChild(ul);

    // ── missed toggle (non-sunday, non-future days only) ──
    if (!isSunday && (isPast || isToday)) {
      const missedWrap = document.createElement("div");
      missedWrap.className = "dc-missed-wrap";
      missedWrap.innerHTML = `
        <label class="dc-missed-label">
          <input type="checkbox" class="dc-missed-cb" data-iso="${iso}" ${isMissed ? "checked" : ""}>
          <span>Mark as missed &amp; redistribute lectures</span>
        </label>`;
      body.appendChild(missedWrap);
    }

    // ── notes field ──
    const notesWrap = document.createElement("div");
    notesWrap.className = "dc-notes-wrap";
    notesWrap.innerHTML = `
      <textarea class="dc-notes"
                data-iso="${iso}"
                placeholder="Add notes…"
                rows="2">${note}</textarea>`;
    body.appendChild(notesWrap);

    card.appendChild(body);
    return card;
  }

  // ── RENDER FULL CALENDAR ──────────────────────────────────
  function renderCalendar(plan) {
    const calDiv = document.getElementById("calendar");
    calDiv.innerHTML = "";

    plan.forEach(dayObj => {
      calDiv.appendChild(buildCard(dayObj));
    });

    _attachCalendarListeners(calDiv, plan);
  }

  // ── ATTACH EVENT LISTENERS ────────────────────────────────
  function _attachCalendarListeners(calDiv, plan) {

    // checkboxes
    calDiv.querySelectorAll(".dc-checkbox").forEach(cb => {
      cb.addEventListener("change", e => {
        STATE.toggleCheck(e.target.dataset.key);
        APP.refresh();
      });
    });

    // collapse buttons
    calDiv.querySelectorAll(".dc-collapse-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        STATE.toggleCollapse(e.currentTarget.dataset.iso);
        APP.refresh();
      });
    });

    // missed checkboxes
    calDiv.querySelectorAll(".dc-missed-cb").forEach(cb => {
      cb.addEventListener("change", e => {
        const iso = e.target.dataset.iso;
        const dayObj = plan.find(d => d.iso === iso);
        if (!dayObj) return;

        if (e.target.checked) {
          PLAN.redistributeMissed(dayObj);
          STATE.toggleMissed(iso);
        } else {
          PLAN.undoRedistribute(dayObj);
          STATE.toggleMissed(iso);
        }
        APP.refresh();
      });
    });

    // notes — save on blur (avoid saving on every keystroke)
    calDiv.querySelectorAll(".dc-notes").forEach(ta => {
      ta.addEventListener("blur", e => {
        STATE.setNote(e.target.dataset.iso, e.target.value);
      });
      // also save on Enter+Shift
      ta.addEventListener("keydown", e => {
        if (e.key === "Enter" && e.shiftKey) {
          STATE.setNote(e.target.dataset.iso, e.target.value);
        }
      });
    });
  }

  // ── COLLAPSE / EXPAND ALL ─────────────────────────────────
  function collapseAll(plan) {
    const patch = {};
    plan.forEach(d => { if (!d.isSunday) patch[d.iso] = true; });
    STATE.set({ collapsed: patch });
    APP.refresh();
  }

  function expandAll() {
    STATE.set({ collapsed: {} });
    APP.refresh();
  }

  // ── JUMP TO TODAY ─────────────────────────────────────────
  function jumpToToday() {
    const el = document.getElementById("today-card");
    if (el) {
      // expand it first if collapsed
      const s = STATE.get();
      const iso = el.dataset.iso;
      if (s.collapsed[iso]) {
        STATE.toggleCollapse(iso);
        APP.refresh();
        setTimeout(() => {
          document.getElementById("today-card")
            ?.scrollIntoView({ behavior:"smooth", block:"center" });
        }, 80);
      } else {
        el.scrollIntoView({ behavior:"smooth", block:"center" });
      }
    }
  }

  // ── UPDATE HEADER RANGE ───────────────────────────────────
  function updateHeaderRange() {
    const s = STATE.get();
    const start = PLAN.parseDate(s.startDate);
    const end   = new Date(start);
    end.setDate(start.getDate() + s.durationDays - 1);
    const fmt = d => d.toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" });
    document.getElementById("header-range").textContent = `${fmt(start)} – ${fmt(end)}`;
  }

  return {
    renderCalendar,
    collapseAll,
    expandAll,
    jumpToToday,
    updateHeaderRange,
    typeClass,
    typeLabel,
    fmtISO,
  };
})();
