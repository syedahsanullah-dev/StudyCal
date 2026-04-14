# 📋 StudyCal – Online Sessions Feature: Integration Guide

## What you're adding
Each subject can now have **multiple weekly online session slots**, each with:
- **Week Day** (Monday–Sunday)
- **Time Range** (e.g. 02:00 PM to 04:00 PM)
- **Meeting Link** (Google Meet, Zoom, Teams, etc.)

---

## Step 1 — Add new files to your project

Copy these two new files into your project:

| File | Destination |
|------|------------|
| `sessions.js` | `js/sessions.js` |
| `sessions.css` | `css/sessions.css` |

---

## Step 2 — Update `index.html`

### 2a. Add CSS link in `<head>` (after the other CSS links):
```html
<link rel="stylesheet" href="css/sessions.css">
```

### 2b. Add JS script tag (BEFORE `settings.js`):
```html
<script src="js/sessions.js"></script>
<script src="js/settings.js"></script>   <!-- already there -->
```

### 2c. In the Add Subject modal, find this block (around line 168):
```html
<label class="sp-label">Target lectures
  <input type="number" id="ns-target" class="sp-input" value="20" min="1">
</label>
<div class="sp-footer">
```

Replace with:
```html
<label class="sp-label">Target lectures
  <input type="number" id="ns-target" class="sp-input" value="20" min="1">
</label>

<!-- ══ ONLINE SESSIONS ══════════════════════════════════════════ -->
<div class="sp-section-title">
  <span>📹 Online Sessions</span>
  <button type="button" class="btn-add-session" id="btn-add-session">+ Add Session</button>
</div>
<div class="ns-sessions-list" id="ns-sessions-list">
  <p class="ns-sessions-empty" id="ns-sessions-empty">No online sessions added yet.</p>
</div>

<div class="sp-footer">
```

---

## Step 3 — Update `js/settings.js`

### 3a. When the "Add Subject" modal opens:
Find the code that shows/opens the `add-sub-modal`. It likely looks like:
```js
document.getElementById('btn-add-subject').addEventListener('click', () => {
  // ... clears the form fields ...
  document.getElementById('add-sub-modal').classList.remove('hidden');
  document.getElementById('add-sub-overlay').classList.remove('hidden');
```

Add these two lines right after clearing the form (before showing the modal):
```js
  Sessions.init([]);           // clear sessions list
  Sessions.bindAddBtn();       // wire up the "+ Add Session" button
```

### 3b. When saving a new subject:
Find the code that reads form values and creates a new subject object. It will look something like:
```js
const newSubject = {
  id: ...,
  name: document.getElementById('ns-name').value.trim(),
  type: document.getElementById('ns-type').value,
  days: [...],
  target: parseInt(document.getElementById('ns-target').value),
  // ...
};
```

Add the sessions field to this object:
```js
const newSubject = {
  id: ...,
  name: document.getElementById('ns-name').value.trim(),
  type: document.getElementById('ns-type').value,
  days: [...],
  target: parseInt(document.getElementById('ns-target').value),
  onlineSessions: Sessions.getSessions(),   // ← ADD THIS LINE
  // ...
};
```

### 3c. When editing an existing subject (if you support editing):
When opening the edit modal, init sessions with existing data:
```js
Sessions.init(subject.onlineSessions || []);
Sessions.bindAddBtn();
```
And when saving, include:
```js
subject.onlineSessions = Sessions.getSessions();
```

---

## Step 4 — Show sessions in the subject card (settings panel)

In `js/settings.js` or wherever you render each subject row in the settings panel, find where you build the subject card HTML. Add the sessions table after the existing subject info:

```js
// Wherever you build subjectCardHTML:
const subjectCardHTML = `
  <div class="sp-subject-card">
    <!-- ... existing subject fields ... -->
    ${Sessions.renderReadOnly(subject.onlineSessions)}
  </div>
`;
```

---

## Step 5 — Optional: Show sessions on calendar day cards

In `js/render.js`, when rendering a day card that has a subject, you can show
a small "📹 Live today" badge if that day's weekday has an online session:

```js
function hasSessionToday(subject, dateStr) {
  if (!subject.onlineSessions || !subject.onlineSessions.length) return null;
  const dayName = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' });
  return subject.onlineSessions.find(s => s.weekDay === dayName) || null;
}

// Then in your cell render:
const session = hasSessionToday(subject, dayStr);
if (session) {
  html += `<a href="${session.meetingLink}" target="_blank" class="session-badge" title="${session.startTime} – ${session.endTime}">📹 Join</a>`;
}
```

Add this CSS to `sessions.css` for the badge:
```css
.session-badge {
  display: inline-block;
  font-size: 0.7rem;
  padding: 1px 7px;
  border-radius: 20px;
  background: var(--accent, #4f8ef7);
  color: #fff;
  text-decoration: none;
  margin-top: 4px;
  font-weight: 600;
}
.session-badge:hover { opacity: 0.85; }
```

---

## Data stored in Firebase

Each subject document will now include an `onlineSessions` array:
```json
{
  "name": "CS401 (Networks)",
  "type": "T",
  "onlineSessions": [
    {
      "id": "abc123",
      "weekDay": "Tuesday",
      "startTime": "02:00 PM",
      "endTime": "04:00 PM",
      "meetingLink": "https://meet.google.com/fdp-fekd-gpx"
    },
    {
      "id": "def456",
      "weekDay": "Wednesday",
      "startTime": "10:00 AM",
      "endTime": "12:00 PM",
      "meetingLink": "https://meet.google.com/fdp-fekd-gpx"
    }
  ]
}
```

Existing subjects without `onlineSessions` will simply show nothing (gracefully handled with `|| []`).