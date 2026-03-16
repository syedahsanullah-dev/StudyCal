// ============================================================
//  firebase.js  —  Firebase Realtime Database integration
//  Project: studycal-19922
// ============================================================

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyCGD5ui8s7uOZv6h1S89duTrt3WfXRGIrc",
  authDomain:        "studycal-19922.firebaseapp.com",
  projectId:         "studycal-19922",
  storageBucket:     "studycal-19922.firebasestorage.app",
  messagingSenderId: "273363013361",
  appId:             "1:273363013361:web:00855f462bc5051609a350",
  databaseURL:       "https://studycal-19922-default-rtdb.asia-southeast1.firebasedatabase.app"
};

const FB_VER  = "12.10.0";
const DB_PATH = "studycal/main";   // path in Realtime DB

let _dbRef       = null;   // reference to our data node
let _unsubscribe = null;   // listener off-switch

// ── INIT ──────────────────────────────────────────────────────
async function fbInit(onRemoteUpdate) {
  try {
    const { initializeApp } = await import(
      `https://www.gstatic.com/firebasejs/${FB_VER}/firebase-app.js`
    );
    const { getDatabase, ref, set, get, onValue } = await import(
      `https://www.gstatic.com/firebasejs/${FB_VER}/firebase-database.js`
    );

    const app = initializeApp(FIREBASE_CONFIG);
    const db  = getDatabase(app);
    _dbRef    = ref(db, DB_PATH);

    // store helpers for save/load
    _dbRef._set = set;
    _dbRef._get = get;

    // Real-time listener — fires on any device change
    _unsubscribe = onValue(
      _dbRef,
      snapshot => {
        const remote = snapshot.val();
        if (remote && typeof remote === "object") {
          onRemoteUpdate(remote);
        }
      },
      err => console.warn("studycal: RTDB listener error", err)
    );

    console.log("studycal: Realtime DB connected ✓  (SDK v" + FB_VER + ")");
    return true;

  } catch (err) {
    console.warn("studycal: Firebase init failed — offline mode only", err);
    return false;
  }
}

// ── SAVE ──────────────────────────────────────────────────────
async function fbSave(stateObj) {
  if (!_dbRef?._set) return;
  try {
    await _dbRef._set(_dbRef, stateObj);
  } catch (err) {
    console.warn("studycal: RTDB save failed", err);
  }
}

// ── LOAD once ─────────────────────────────────────────────────
async function fbLoad() {
  if (!_dbRef?._get) return null;
  try {
    const snap = await _dbRef._get(_dbRef);
    return snap.exists() ? snap.val() : null;
  } catch (err) {
    console.warn("studycal: RTDB load failed", err);
    return null;
  }
}

// ── DESTROY ───────────────────────────────────────────────────
function fbDestroy() {
  if (_unsubscribe) _unsubscribe();
}

window.FB = { init: fbInit, save: fbSave, load: fbLoad, destroy: fbDestroy };