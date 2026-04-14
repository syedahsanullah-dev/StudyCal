// ============================================================
//  settings.js  —  Settings modal (Schedule / Subjects / Data)
// ============================================================

const SETTINGS = (() => {

  // ── OPEN / CLOSE ─────────────────────────────────────────
  function open() {
    _populateScheduleTab();
    _populateSubjectsTab();
    document.getElementById("settings-panel").classList.remove("hidden");
    document.getElementById("settings-overlay").classList.remove("hidden");
    // activate first tab
    _switchTab("schedule");
  }

  function close() {
    document.getElementById("settings-panel").classList.add("hidden");
    document.getElementById("settings-overlay").classList.add("hidden");
  }

  // ── TABS ─────────────────────────────────────────────────
  function _switchTab(name) {
    document.querySelectorAll(".sp-tab").forEach(t =>
      t.classList.toggle("active", t.dataset.tab === name)
    );
    document.querySelectorAll(".sp-body").forEach(b => {
      b.classList.toggle("hidden", b.id !== `tab-${name}`);
    });
  }

  function _initTabs() {
    document.querySelectorAll(".sp-tab").forEach(btn => {
      btn.addEventListener("click", () => _switchTab(btn.dataset.tab));
    });
  }

  // ── SCHEDULE TAB ─────────────────────────────────────────
  function _populateScheduleTab() {
    const s = STATE.get();
    document.getElementById("cfg-start-date").value = s.startDate;
    document.getElementById("cfg-duration").value   = s.durationDays;
    document.getElementById("cfg-lpd").value        = s.lecsPerDay;
    document.getElementById("cfg-hpl").value        = s.hoursPerLec;
  }

  function _readScheduleTab() {
    return {
      startDate:    document.getElementById("cfg-start-date").value || DATA.DEFAULTS.startDate,
      durationDays: Math.max(7, Math.min(120, parseInt(document.getElementById("cfg-duration").value) || 30)),
      lecsPerDay:   Math.max(1, Math.min(10,  parseInt(document.getElementById("cfg-lpd").value)      || 2)),
      hoursPerLec:  Math.max(0.25, Math.min(4, parseFloat(document.getElementById("cfg-hpl").value)   || 1)),
    };
  }

  // ── SUBJECTS TAB ─────────────────────────────────────────
  function _populateSubjectsTab() {
    const grid = document.getElementById("sp-subjects-grid");
    grid.innerHTML = "";
    const s = STATE.get();

    s.subjects.forEach((sub, idx) => {
      const row = document.createElement("div");
      row.className = "sp-sub-row";
      row.dataset.idx = idx;

      const tc = RENDER.typeClass(sub.type);

      // day checkboxes html
      const dayLabels = ["M","T","W","T","F","S"];
      const dayVals   = [1,2,3,4,5,6];
      const dayBoxes  = dayVals.map((v,i) => `
        <label class="sp-day-cb" title="${DATA.DAY_NAMES[v]}">
          <input type="checkbox" class="sub-day" data-day="${v}"
            ${sub.days.includes(v) ? "checked" : ""}> ${dayLabels[i]}
        </label>`).join("");

      row.innerHTML = `
        <div class="sp-sub-top">
          <label class="sp-active-toggle" title="Active">
            <input type="checkbox" class="sub-active" ${sub.active ? "checked" : ""}>
          </label>
          <span class="sp-sub-name-wrap">
            <input type="text" class="sub-name sp-inline-input" value="${sub.name}" placeholder="Subject name">
          </span>
          <select class="sub-type sp-select">
            ${Object.entries(DATA.TYPE_META).map(([k,v]) =>
              `<option value="${k}" ${sub.type===k?"selected":""}>${v.label}</option>`
            ).join("")}
          </select>
          <button class="sp-del-btn" data-idx="${idx}" title="Remove subject">✕</button>
        </div>
        <div class="sp-sub-bottom">
          <label class="sp-sub-field">
            <span>Target lecs</span>
            <input type="number" class="sub-target sp-num-input" value="${sub.targetLecs || 20}" min="1" max="200">
          </label>
          <label class="sp-sub-field">
            <span>Lecs/day <small>(blank=global)</small></span>
            <input type="number" class="sub-lpd sp-num-input" value="${sub.lecsPerDay || ""}" min="1" max="10" placeholder="—">
          </label>
          <div class="sp-sub-days">${dayBoxes}</div>
        </div>`;

      grid.appendChild(row);
    });

    // delete buttons
    grid.querySelectorAll(".sp-del-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        const idx = parseInt(e.currentTarget.dataset.idx);
        const s2  = STATE.get();
        const updated = s2.subjects.filter((_, i) => i !== idx);
        STATE.setSubjects(updated);
        _populateSubjectsTab();
      });
    });
  }

  function _readSubjectsTab() {
    const rows = document.querySelectorAll(".sp-sub-row");
    const updated = [];

    rows.forEach(row => {
      const idx   = parseInt(row.dataset.idx);
      const orig  = STATE.get().subjects[idx];
      if (!orig) return;

      const days = [];
      row.querySelectorAll(".sub-day:checked").forEach(cb => days.push(parseInt(cb.dataset.day)));

      const lpdRaw = row.querySelector(".sub-lpd")?.value;
      const lpd    = lpdRaw ? Math.max(1, parseInt(lpdRaw)) : null;

      updated.push({
        ...orig,
        name:       row.querySelector(".sub-name")?.value.trim()  || orig.name,
        type:       row.querySelector(".sub-type")?.value          || orig.type,
        active:     row.querySelector(".sub-active")?.checked      ?? orig.active,
        targetLecs: Math.max(1, parseInt(row.querySelector(".sub-target")?.value) || 20),
        lecsPerDay: lpd,
        days:       days.length > 0 ? days : orig.days,
      });
    });

    return updated;
  }

  // ── ADD SUBJECT MODAL ─────────────────────────────────────
  function _initAddSubject() {
    const openBtn  = document.getElementById("btn-add-subject");
    const modal    = document.getElementById("add-sub-modal");
    const overlay  = document.getElementById("add-sub-overlay");
    const closeBtn = document.getElementById("btn-close-add-sub");
    const cancelBtn= document.getElementById("btn-cancel-add-sub");
    const confirmBtn=document.getElementById("btn-confirm-add-sub");

    function openModal() {
      // clear fields
      document.getElementById("ns-name").value   = "";
      document.getElementById("ns-target").value = "20";
      document.querySelectorAll("#ns-days input").forEach(cb => { cb.checked = false; });
      modal.classList.remove("hidden");
      overlay.classList.remove("hidden");
      document.getElementById("ns-name").focus();
    }
    function closeModal() {
      modal.classList.add("hidden");
      overlay.classList.add("hidden");
    }

    openBtn?.addEventListener("click",   openModal);
    closeBtn?.addEventListener("click",  closeModal);
    cancelBtn?.addEventListener("click", closeModal);
    overlay?.addEventListener("click",   closeModal);

    confirmBtn?.addEventListener("click", () => {
      const name = document.getElementById("ns-name").value.trim();
      if (!name) { alert("Please enter a subject name."); return; }

      const days = [];
      document.querySelectorAll("#ns-days input:checked").forEach(cb => days.push(parseInt(cb.value)));
      if (days.length === 0) { alert("Please select at least one study day."); return; }

      const newSub = {
        id:         "sub_" + Date.now(),
        name,
        type:       document.getElementById("ns-type").value,
        days,
        targetLecs: Math.max(1, parseInt(document.getElementById("ns-target").value) || 20),
        lecsPerDay: null,
        active:     true,
      };

      const s = STATE.get();
      STATE.setSubjects([...s.subjects, newSub]);
      closeModal();
      _populateSubjectsTab();   // refresh grid
    });
  }

  // ── SAVE ─────────────────────────────────────────────────
  function _save() {
    // read schedule tab
    const schedPatch = _readScheduleTab();

    // read subjects tab
    const updatedSubs = _readSubjectsTab();

    STATE.set(schedPatch);
    STATE.setSubjects(updatedSubs);
    close();
    APP.refresh();
  }

  // ── DATA TAB ─────────────────────────────────────────────
  function _initDataTab() {
    // export
    document.getElementById("sp-export")?.addEventListener("click", () => STATE.exportJSON());

    // import (inside settings panel)
    const spImportTrigger = document.getElementById("sp-import-trigger");
    const spImportFile    = document.getElementById("sp-import-file");
    spImportTrigger?.addEventListener("click", () => spImportFile?.click());
    spImportFile?.addEventListener("change", e => {
      const file = e.target.files?.[0];
      if (!file) return;
      STATE.importJSON(file, () => { close(); APP.refresh(); });
      e.target.value = "";
    });

    // reset
    document.getElementById("sp-reset")?.addEventListener("click", () => {
      if (confirm("Reset ALL progress (checked lectures, notes, missed days)? This cannot be undone.")) {
        STATE.reset();
        close();
        APP.refresh();
      }
    });
  }

  // ── INIT ─────────────────────────────────────────────────
  function init() {
    _initTabs();
    _initAddSubject();
    _initDataTab();

    // open button (header)
    document.getElementById("btn-settings")?.addEventListener("click", open);

    // close / cancel
    document.getElementById("btn-close-settings")?.addEventListener("click", close);
    document.getElementById("btn-cancel-settings")?.addEventListener("click", close);
    document.getElementById("settings-overlay")?.addEventListener("click", close);

    // save
    document.getElementById("btn-save-settings")?.addEventListener("click", _save);
  }

  return { init, open, close };
})();

