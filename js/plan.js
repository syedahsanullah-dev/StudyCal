// ============================================================
//  plan.js  —  Builds the 30-day plan array from state
// ============================================================

const PLAN = (() => {

  // ── DATE HELPERS ─────────────────────────────────────────
  function parseDate(iso) {
    const [y,m,d] = iso.split("-").map(Number);
    return new Date(y, m-1, d);
  }

  function toISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth()+1).padStart(2,"0");
    const d = String(date.getDate()).padStart(2,"0");
    return `${y}-${m}-${d}`;
  }

  function todayISO() {
    return toISO(new Date());
  }

  function addDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
  }

  // ── MAIN PLAN BUILDER ────────────────────────────────────
  // Returns array of day-objects; one per calendar day.
  // Each day: { date, iso, dayOfWeek, dayIndex, isToday, isPast,
  //             isMissed, isSunday, items[] }
  // Each item: { sub, startLec, endLec, checkKey, isDone }
  function build() {
    const s          = STATE.get();
    const startDate  = parseDate(s.startDate);
    const duration   = s.durationDays;
    const globalLPD  = s.lecsPerDay;        // lectures per day (global)
    const today      = todayISO();

    // active subjects only
    const activeSubs = s.subjects.filter(sub => sub.active);

    // running lecture pointer per subject
    const progress = {};
    activeSubs.forEach(sub => { progress[sub.id] = 0; });

    // apply extras (from "missed + redistribute")
    // extras = { subId: extraLecCount } — tacked onto the end
    const extras = s.extras || {};

    const plan = [];

    for (let i = 0; i < duration; i++) {
      const date   = addDays(startDate, i);
      const iso    = toISO(date);
      const dow    = date.getDay();   // 0=Sun
      const isToday = iso === today;
      const isPast  = iso < today;

      const dayObj = {
        date, iso, dayOfWeek: dow, dayIndex: i,
        isToday, isPast,
        isMissed: STATE.isMissed(iso),
        isSunday: dow === 0,
        items: [],
      };

      if (dow !== 0) {
        const todaysSubs = activeSubs.filter(sub => sub.days.includes(dow));

        todaysSubs.forEach(sub => {
          const tgt = (sub.targetLecs || 20) + (extras[sub.id] || 0);
          if (progress[sub.id] >= tgt) return;

          const lpd   = sub.lecsPerDay || globalLPD || 2;
          const start = progress[sub.id] + 1;
          const end   = Math.min(progress[sub.id] + lpd, tgt);
          progress[sub.id] = end;

          const key = STATE.checkKey(sub.id, start);
          dayObj.items.push({
            sub,
            startLec: start,
            endLec:   end,
            checkKey: key,
            isDone:   STATE.isChecked(key),
          });
        });
      }

      plan.push(dayObj);
    }

    return plan;
  }

  // ── OVERDUE DETECTION ────────────────────────────────────
  // A day is overdue if: isPast && not Sunday && has unchecked items
  function isOverdue(dayObj) {
    if (dayObj.isSunday || dayObj.isToday || !dayObj.isPast) return false;
    return dayObj.items.some(item => !item.isDone);
  }

  // ── STATS ────────────────────────────────────────────────
  // Returns per-subject and overall stats given a built plan
  function computeStats(plan) {
    const s = STATE.get();
    const activeSubs = s.subjects.filter(sub => sub.active);

    // per-subject: total target, done so far
    const subStats = {};
    activeSubs.forEach(sub => {
      subStats[sub.id] = {
        sub,
        target: (sub.targetLecs || 20) + (s.extras[sub.id] || 0),
        done: 0,
        plannedDates: [],   // ISO dates this subject appears
      };
    });

    plan.forEach(day => {
      day.items.forEach(item => {
        const ss = subStats[item.sub.id];
        if (!ss) return;
        ss.plannedDates.push(day.iso);
        if (item.isDone) {
          ss.done += (item.endLec - item.startLec + 1);
        }
      });
    });

    // estimated completion date per subject
    // = last date that subject appears in plan (its final lecture day)
    Object.values(subStats).forEach(ss => {
      const dates = ss.plannedDates;
      ss.estCompletion = dates.length > 0 ? dates[dates.length - 1] : null;
      ss.remaining = Math.max(0, ss.target - ss.done);
      ss.pct = ss.target > 0 ? Math.min(100, Math.round((ss.done / ss.target) * 100)) : 0;
    });

    // overall
    let totalTarget = 0, totalDone = 0;
    Object.values(subStats).forEach(ss => {
      totalTarget += ss.target;
      totalDone   += ss.done;
    });
    const overallPct = totalTarget > 0 ? Math.min(100, Math.round((totalDone/totalTarget)*100)) : 0;

    // daily hours estimator
    // = (total remaining lectures) * hoursPerLec / remaining study days
    const today = todayISO();
    const remainingDays = plan.filter(d => d.iso >= today && !d.isSunday).length || 1;
    const totalRemaining = totalTarget - totalDone;
    const hoursPerLec = s.hoursPerLec || 1;
    const dailyHours = ((totalRemaining * hoursPerLec) / remainingDays).toFixed(1);

    return { subStats, totalTarget, totalDone, overallPct, dailyHours, remainingDays };
  }

  // ── REDISTRIBUTE missed-day lectures ─────────────────────
  // When a day is marked "missed", add its lectures to extras
  // so they get appended at the end of that subject's schedule
  function redistributeMissed(dayObj) {
    const s = STATE.get();
    const extras = { ...(s.extras || {}) };
    dayObj.items.forEach(item => {
      if (!item.isDone) {
        const count = item.endLec - item.startLec + 1;
        extras[item.sub.id] = (extras[item.sub.id] || 0) + count;
      }
    });
    STATE.set({ extras });
  }

  function undoRedistribute(dayObj) {
    const s = STATE.get();
    const extras = { ...(s.extras || {}) };
    dayObj.items.forEach(item => {
      const count = item.endLec - item.startLec + 1;
      extras[item.sub.id] = Math.max(0, (extras[item.sub.id] || 0) - count);
      if (extras[item.sub.id] === 0) delete extras[item.sub.id];
    });
    STATE.set({ extras });
  }

  return { build, isOverdue, computeStats, redistributeMissed, undoRedistribute, toISO, parseDate };
})();
