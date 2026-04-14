/**
 * js/sessions.js
 * ─────────────────────────────────────────────────────────────────
 * Manages the "Online Sessions" feature inside the Add/Edit Subject modal.
 *
 * HOW TO INCLUDE:
 *   Add this line to index.html BEFORE settings.js:
 *   <script src="js/sessions.js"></script>
 *
 * DATA SHAPE stored on each subject object:
 *   subject.onlineSessions = [
 *     {
 *       id:          "uuid-string",
 *       weekDay:     "Tuesday",          // full day name
 *       startTime:   "02:00 PM",
 *       endTime:     "04:00 PM",
 *       meetingLink: "https://meet.google.com/xxx"
 *     },
 *     ...
 *   ]
 * ─────────────────────────────────────────────────────────────────
 */

const Sessions = (() => {
  // ── Internal state for the currently open modal ───────────────
  let _rows = []; // array of session objects being edited

  const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

  // ── Tiny UUID helper (no dependency needed) ───────────────────
  function uid() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  // ── Convert "14:00" (input[type=time]) ↔ "02:00 PM" ─────────
  function to12h(val) {
    if (!val) return '';
    const [hStr, mStr] = val.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr;
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${String(h).padStart(2,'0')}:${m} ${ampm}`;
  }

  function to24h(val) {
    if (!val) return '';
    const match = val.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return val; // already 24h or invalid
    let [, h, m, ampm] = match;
    h = parseInt(h, 10);
    if (ampm.toUpperCase() === 'PM' && h !== 12) h += 12;
    if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2,'0')}:${m}`;
  }

  // ── Render the session rows inside the modal ──────────────────
  function render() {
    const list  = document.getElementById('ns-sessions-list');
    const empty = document.getElementById('ns-sessions-empty');
    if (!list) return;

    // Remove existing rows (keep the empty placeholder)
    list.querySelectorAll('.ns-session-row').forEach(r => r.remove());

    if (_rows.length === 0) {
      if (empty) empty.style.display = '';
      return;
    }
    if (empty) empty.style.display = 'none';

    _rows.forEach((sess, idx) => {
      const row = document.createElement('div');
      row.className = 'ns-session-row';
      row.dataset.id = sess.id;

      row.innerHTML = `
        <div class="nsr-fields">
          <select class="nsr-day sp-input" data-field="weekDay" title="Week day">
            ${DAYS.map(d => `<option value="${d}" ${sess.weekDay === d ? 'selected' : ''}>${d}</option>`).join('')}
          </select>
          <div class="nsr-time-group">
            <input type="time" class="nsr-time sp-input" data-field="startTime"
                   value="${to24h(sess.startTime)}" title="Start time">
            <span class="nsr-to">to</span>
            <input type="time" class="nsr-time sp-input" data-field="endTime"
                   value="${to24h(sess.endTime)}" title="End time">
          </div>
          <input type="url" class="nsr-link sp-input" data-field="meetingLink"
                 value="${sess.meetingLink || ''}" placeholder="https://meet.google.com/…"
                 title="Meeting link">
        </div>
        <button class="nsr-del" data-idx="${idx}" title="Remove session">✕</button>
      `;

      // Live-update _rows on change
      row.querySelectorAll('[data-field]').forEach(el => {
        el.addEventListener('change', e => {
          const field = e.target.dataset.field;
          const val   = e.target.value;
          if (field === 'startTime' || field === 'endTime') {
            _rows[idx][field] = to12h(val);
          } else {
            _rows[idx][field] = val;
          }
        });
      });

      // Delete button
      row.querySelector('.nsr-del').addEventListener('click', () => {
        _rows.splice(idx, 1);
        render();
      });

      list.appendChild(row);
    });
  }

  // ── Public API ────────────────────────────────────────────────

  /** Call when the modal opens. Pass existing sessions (or []) */
  function init(existingSessions = []) {
    _rows = existingSessions.map(s => ({ ...s })); // shallow copy
    render();
  }

  /** Wire up the "+ Add Session" button */
  function bindAddBtn() {
    const btn = document.getElementById('btn-add-session');
    if (!btn) return;
    btn.addEventListener('click', () => {
      _rows.push({
        id:          uid(),
        weekDay:     'Monday',
        startTime:   '09:00 AM',
        endTime:     '11:00 AM',
        meetingLink: ''
      });
      render();
    });
  }

  /** Returns the current sessions array (call before saving the subject) */
  function getSessions() {
    return _rows.map(s => ({ ...s }));
  }

  /** Renders a read-only sessions table for the subject card in settings */
  function renderReadOnly(sessions) {
    if (!sessions || sessions.length === 0) return '';
    const rows = sessions.map(s => {
      const link = s.meetingLink
        ? `<a href="${s.meetingLink}" target="_blank" rel="noopener" class="session-link">🔗 Join</a>`
        : '<span class="session-no-link">—</span>';
      return `
        <tr>
          <td>${s.weekDay}</td>
          <td>${s.startTime} – ${s.endTime}</td>
          <td>${link}</td>
        </tr>`;
    }).join('');

    return `
      <div class="subject-sessions-wrap">
        <div class="subject-sessions-title">📹 Online Sessions</div>
        <table class="subject-sessions-table">
          <thead>
            <tr><th>Day</th><th>Timing</th><th>Meeting</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  return { init, bindAddBtn, getSessions, renderReadOnly };
})();
