// ============================================================
//  plan.js  —  Builds the 30-day plan array from state
//  Features:
//   - Skips disabled dates (subjects push to next study day)
//   - Collects overdue unchecked items into next Sunday
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
  function todayISO() { return toISO(new Date()); }
  function addDays(date, n) {
    const d = new Date(date); d.setDate(d.getDate() + n); return d;
  }

  // ── MAIN PLAN BUILDER ────────────────────────────────────
  function build() {
    const s          = STATE.get();
    const startDate  = parseDate(s.startDate);
    const duration   = s.durationDays;
    const globalLPD  = s.lecsPerDay || 2;
    const today      = todayISO();
    const activeSubs = s.subjects.filter(sub => sub.active);
    const extras     = s.extras || {};
    const disabled   = s.disabledDates || {};

    // Progress pointer per subject (how many lectures assigned so far)
    const progress = {};
    activeSubs.forEach(sub => { progress[sub.id] = 0; });

    // First pass: build all day objects, skipping disabled dates
    const plan = [];

    for (let i = 0; i < duration; i++) {
      const date    = addDays(startDate, i);
      const iso     = toISO(date);
      const dow     = date.getDay();
      const isToday = iso === today;
      const isPast  = iso < today;
      const isSun   = dow === 0;
      const isDis   = !!disabled[iso];

      const dayObj = {
        date, iso, dayOfWeek: dow, dayIndex: i,
        isToday, isPast,
        isMissed:    STATE.isMissed(iso),
        isSunday:    isSun,
        isDisabled:  isDis,
        catchupItems: [],   // overdue items pushed here from prev days
        items: [],
      };

      // Sunday or disabled → no new lectures assigned
      // (disabled: subjects skip this day, progress pointer stays,
      //  so lectures naturally spill to their next study day)
      if (!isSun && !isDis) {
        const todaysSubs = activeSubs.filter(sub => sub.days.includes(dow));
        todaysSubs.forEach(sub => {
          const tgt = (sub.targetLecs || 20) + (extras[sub.id] || 0);
          if (progress[sub.id] >= tgt) return;

          const lpd   = sub.lecsPerDay || globalLPD;
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

    // Second pass: collect overdue unchecked items into next Sunday
    // An overdue day = isPast, not today, not Sunday, not disabled,
    //                  has unchecked items
    plan.forEach((day, idx) => {
      if (!day.isPast || day.isToday || day.isSunday || day.isDisabled) return;

      const overdueItems = day.items.filter(item => !item.isDone);
      if (overdueItems.length === 0) return;

      // Find the next Sunday in the plan after this day
      const nextSun = plan.find(
        (d, j) => j > idx && d.isSunday
      );
      if (!nextSun) return;

      // Add overdue items to that Sunday's catchupItems
      overdueItems.forEach(item => {
        // Avoid duplicates if already added
        const alreadyAdded = nextSun.catchupItems.some(
          c => c.checkKey === item.checkKey
        );
        if (!alreadyAdded) {
          nextSun.catchupItems.push({
            ...item,
            isCatchup: true,
            fromISO:   day.iso,
          });
        }
      });
    });

    return plan;
  }

  // ── OVERDUE CHECK ─────────────────────────────────────────
  function isOverdue(dayObj) {
    if (dayObj.isSunday || dayObj.isToday || !dayObj.isPast) return false;
    if (dayObj.isDisabled) return false;
    return dayObj.items.some(item => !item.isDone);
  }

  // ── STATS ────────────────────────────────────────────────
  function computeStats(plan) {
    const s          = STATE.get();
    const activeSubs = s.subjects.filter(sub => sub.active);

    const subStats = {};
    activeSubs.forEach(sub => {
      subStats[sub.id] = {
        sub,
        target:       (sub.targetLecs || 20) + (s.extras[sub.id] || 0),
        done:         0,
        plannedDates: [],
      };
    });

    plan.forEach(day => {
      day.items.forEach(item => {
        const ss = subStats[item.sub.id];
        if (!ss) return;
        ss.plannedDates.push(day.iso);
        if (item.isDone) ss.done += (item.endLec - item.startLec + 1);
      });
    });

    Object.values(subStats).forEach(ss => {
      const dates      = ss.plannedDates;
      ss.estCompletion = dates.length > 0 ? dates[dates.length-1] : null;
      ss.remaining     = Math.max(0, ss.target - ss.done);
      ss.pct           = ss.target > 0
        ? Math.min(100, Math.round((ss.done / ss.target) * 100))
        : 0;
    });

    let totalTarget = 0, totalDone = 0;
    Object.values(subStats).forEach(ss => {
      totalTarget += ss.target;
      totalDone   += ss.done;
    });
    const overallPct = totalTarget > 0
      ? Math.min(100, Math.round((totalDone/totalTarget)*100))
      : 0;

    const today         = todayISO();
    const remainingDays = plan.filter(
      d => d.iso >= today && !d.isSunday && !d.isDisabled
    ).length || 1;
    const hoursPerLec   = s.hoursPerLec || 1;
    const dailyHours    = (((totalTarget - totalDone) * hoursPerLec) / remainingDays).toFixed(1);

    return { subStats, totalTarget, totalDone, overallPct, dailyHours, remainingDays };
  }

  // ── REDISTRIBUTE missed ───────────────────────────────────
  function redistributeMissed(dayObj) {
    STATE.redistributeMissed(dayObj);
  }
  function undoRedistribute(dayObj) {
    STATE.undoRedistribute(dayObj);
  }

  return {
    build, isOverdue, computeStats,
    redistributeMissed, undoRedistribute,
    toISO, parseDate,
  };
})();
