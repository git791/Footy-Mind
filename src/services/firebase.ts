import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, sendEmailVerification } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, Timestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize only if config is somewhat valid to avoid crash without keys
const hasKeys = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== "your_firebase_api_key";
const app = hasKeys ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;

export { app, auth, db };

// Mock storage for local dev when Firebase isn't configured
export const mockStorage = {
  xp: 0,
  quiz: null as any,
  lastQuizDone: "",
  predictions: {} as Record<number, any>,
  name: "Guest",
  photoURL: "",
  favTeams: [] as string[],
  loggedIn: false
};

// Auth state observer
export function subscribeToAuth(callback: (user: any) => void) {
  if (!auth) {
    if (mockStorage.loggedIn) {
      callback({ uid: "local-dev-user", displayName: "Local Dev" });
    } else {
      callback(null);
    }
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function registerUser(email:string, pass:string, name:string) {
  if (!auth || !db) {
    mockStorage.loggedIn = true;
    return { uid: "local-dev-user" };
  }
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  await updateProfile(cred.user, { displayName: name });
  await sendEmailVerification(cred.user);
  await setDoc(doc(db, "users", cred.user.uid), {
    name,
    xp: 0,
    email
  }, { merge: true });
  return cred.user;
}

export async function loginWithEmail(email:string, pass:string) {
  if (!auth) {
    mockStorage.loggedIn = true;
    return { uid: "local-dev-user" };
  }
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  return cred.user;
}

export async function logoutUser() {
  if (!auth) {
    mockStorage.loggedIn = false;
    return;
  }
  await signOut(auth);
}

export async function getUserData(uid: string) {
  if (!db) return { xp: mockStorage.xp, lastQuizDone: mockStorage.lastQuizDone, predictions: mockStorage.predictions, name: mockStorage.name, favTeams: mockStorage.favTeams };
  const d = await getDoc(doc(db, "users", uid));
  if (d.exists()) {
    const data = d.data();
    
    // Fetch predictions subcollection
    const preds: Record<number, any> = {};
    const predsSnap = await getDocs(collection(db, `users/${uid}/predictions`));
    predsSnap.forEach(docSnap => {
      preds[Number(docSnap.id)] = docSnap.data();
    });

    return {
      xp: data.xp || 0,
      lastQuizDone: data.lastQuizDone || "",
      predictions: preds,
      name: data.name || "Fan",
      favTeams: data.favTeams || []
    };
  }
  return { xp: 0, lastQuizDone: "", predictions: {}, name: "Fan", favTeams: [] };
}

export async function getUserXP(uid: string) {
  const data = await getUserData(uid);
  return data.xp;
}

export async function addUserXP(uid: string, xpToAdd: number) {
  if (!db) {
    mockStorage.xp += xpToAdd;
    return mockStorage.xp;
  }
  const current = await getUserXP(uid);
  const newXP = current + xpToAdd;
  await setDoc(doc(db, "users", uid), { xp: newXP }, { merge: true });
  return newXP;
}

export async function saveQuizCompletion(uid: string, dateStr: string) {
  if (!db) {
    mockStorage.lastQuizDone = dateStr;
    return;
  }
  await setDoc(doc(db, "users", uid), { lastQuizDone: dateStr }, { merge: true });
}

export async function saveMatchPrediction(uid: string, fixtureId: number, prediction: { home: number, away: number }) {
  if (!db) {
    mockStorage.predictions[fixtureId] = { ...prediction, predicted: true, timestamp: new Date().toISOString() };
    return;
  }
  await setDoc(doc(db, `users/${uid}/predictions/${fixtureId}`), {
    ...prediction,
    predicted: true,
    timestamp: new Date().toISOString()
  }, { merge: true });
}

export async function updatePredictionResult(uid: string, fixtureId: number, isCorrect: boolean) {
  if (!db) {
    if (mockStorage.predictions[fixtureId]) {
      mockStorage.predictions[fixtureId].resultProcessed = true;
      mockStorage.predictions[fixtureId].correct = isCorrect;
    }
    return;
  }
  await setDoc(doc(db, `users/${uid}/predictions/${fixtureId}`), {
    resultProcessed: true,
    correct: isCorrect
  }, { merge: true });
}

export async function saveUserFavorites(uid: string, favTeams: string[]) {
  if (!db) {
    mockStorage.favTeams = favTeams;
    return;
  }
  await setDoc(doc(db, "users", uid), { favTeams }, { merge: true });
}
