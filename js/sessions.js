// ============================================================
//  sessions.js  —  Manage dynamic online sessions & Accordion UI
// ============================================================

const SESSIONS = (() => {

  // ── SETTINGS MODAL LOGIC ─────────────────────────────────
  let _currentSessions = []; // Temp storage while editing a subject

  function init(sessionsData = []) {
    _currentSessions = [...sessionsData];
    _renderSessionList();
  }

  function getSessions() {
    return _currentSessions;
  }

  function addSession(weekName, sessionName, weekDay, startTime, meetingLink) {
    _currentSessions.push({
      id: "sess_" + Date.now(),
      weekName,
      sessionName,
      weekDay,
      startTime,
      meetingLink
    });
    _renderSessionList();
  }

  function removeSession(id) {
    _currentSessions = _currentSessions.filter(s => s.id !== id);
    _renderSessionList();
  }

  function bindAddBtn() {
    const btn = document.getElementById("btn-add-session");
    if (!btn) return;
    
    // Clone to remove old listeners
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener("click", () => {
      // Simple prompt interface (can be upgraded to a real modal later)
      const week = prompt("Enter Week (e.g., Week 3):");
      if (!week) return;
      const name = prompt("Enter Session Name (e.g., Lab 1 + Lab 2):");
      const day = prompt("Enter Day (e.g., Monday):");
      const time = prompt("Enter Time (e.g., 3:00 PM - 4:30 PM):");
      const link = prompt("Enter Meeting Link:");
      
      if (week && link) {
        addSession(week, name, day, time, link);
      }
    });
  }

  function _renderSessionList() {
    const container = document.getElementById("ns-sessions-list");
    if (!container) return;

    if (_currentSessions.length === 0) {
      container.innerHTML = '<p class="ns-sessions-empty">No online sessions added yet.</p>';
      return;
    }

    let html = '';
    _currentSessions.forEach(sess => {
      html += `
        <div class="ns-session-item">
          <div>
            <strong>${sess.weekName}</strong> | ${sess.sessionName}<br>
            <span style="font-size: 11px; color: var(--text-muted);">${sess.weekDay} @ ${sess.startTime}</span><br>
            <a href="${sess.meetingLink}" target="_blank" style="font-size: 11px; color: var(--accent);">Meeting Link</a>
          </div>
          <button type="button" class="ns-session-del" onclick="SESSIONS.removeSession('${sess.id}')">✕</button>
        </div>
      `;
    });
    container.innerHTML = html;
  }

  function renderReadOnly(sessionsArray) {
    if (!sessionsArray || sessionsArray.length === 0) return '';
    return `<div class="sp-sub-sessions-badge">📹 ${sessionsArray.length} Sessions attached</div>`;
  }

  // ── MAIN DASHBOARD ACCORDION UI ──────────────────────────
  
  // This is called by main.js during APP.refresh()
  function renderDashboardAccordion() {
    const container = document.getElementById("dashboard-sessions-container");
    if (!container) return;

    const s = STATE.get();
    
    // Find all active subjects that actually have sessions
    const subjectsWithSessions = s.subjects.filter(
      sub => sub.active && sub.onlineSessions && sub.onlineSessions.length > 0
    );

    if (subjectsWithSessions.length === 0) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';
    let html = `<h2 class="meetings-heading">Live Weekly Classes</h2><div class="accordion-group">`;

    subjectsWithSessions.forEach(sub => {
      const tc = RENDER.typeClass(sub.type); // Gets the color class (lang, theory, etc)
      
      html += `
        <div class="accordion-item">
          <button class="accordion-header ${tc}" onclick="SESSIONS.toggleAccordion(this)">
            <span class="acc-title">📹 ${sub.name}</span>
            <span class="acc-count">${sub.onlineSessions.length} Sessions <span>▼</span></span>
          </button>
          <div class="accordion-content">
            <div class="acc-table-wrap">
              <table class="acc-table">
                <thead>
                  <tr>
                    <th>Week</th>
                    <th>Session</th>
                    <th>Schedule</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
      `;

      sub.onlineSessions.forEach(sess => {
        html += `
                  <tr>
                    <td><strong>${sess.weekName}</strong></td>
                    <td>${sess.sessionName}</td>
                    <td>${sess.weekDay}<br><span class="acc-time">${sess.startTime}</span></td>
                    <td><a href="${sess.meetingLink}" target="_blank" class="acc-join-btn">Join Link</a></td>
                  </tr>
        `;
      });

      html += `
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
  }

  // Handle the expand/collapse animation on the dashboard
  function toggleAccordion(button) {
    const content = button.nextElementSibling;
    const icon = button.querySelector('.acc-count span');
    
    // Toggle active class
    button.classList.toggle('active');
    
    if (button.classList.contains('active')) {
      content.style.maxHeight = content.scrollHeight + "px";
      icon.style.transform = "rotate(180deg)";
    } else {
      content.style.maxHeight = null;
      icon.style.transform = "rotate(0deg)";
    }
  }

  // Expose methods
  return { 
    init, 
    getSessions, 
    bindAddBtn, 
    removeSession, 
    renderReadOnly,
    renderDashboardAccordion,
    toggleAccordion
  };
})();

// Expose globally so inline onclick events work
window.SESSIONS = SESSIONS;