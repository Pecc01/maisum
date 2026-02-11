import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import type { TrackingData } from "@/lib/tracking";

const FIREBASE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
const FIREBASE_AUTH_DOMAIN = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined;
const FIREBASE_PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;
const FIREBASE_STORAGE_BUCKET = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined;
const FIREBASE_MESSAGING_SENDER_ID = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined;
const FIREBASE_APP_ID = import.meta.env.VITE_FIREBASE_APP_ID as string | undefined;
const FIREBASE_MEASUREMENT_ID = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined;
const FIREBASE_COLLECTION = (import.meta.env.VITE_FIREBASE_COLLECTION as string | undefined) || "tracking";

export const firebaseEnabled = !!FIREBASE_API_KEY && !!FIREBASE_PROJECT_ID;

const app = firebaseEnabled
  ? initializeApp({
      apiKey: FIREBASE_API_KEY!,
      authDomain: FIREBASE_AUTH_DOMAIN,
      projectId: FIREBASE_PROJECT_ID!,
      storageBucket: FIREBASE_STORAGE_BUCKET,
      messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
      appId: FIREBASE_APP_ID,
      measurementId: FIREBASE_MEASUREMENT_ID,
    })
  : null;

const db = firebaseEnabled ? getFirestore(app!) : null;

export async function fbFetchTrackingByCode(code: string): Promise<TrackingData | null> {
  if (!firebaseEnabled || !db) return null;
  const id = code.toUpperCase();
  const ref = doc(db, FIREBASE_COLLECTION, id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const payload = snap.data() as any;
    return (payload?.data as TrackingData) ?? null;
  }
  const fallbackRef = doc(db, FIREBASE_COLLECTION === "tracking" ? "tracking_data" : "tracking", id);
  const snap2 = await getDoc(fallbackRef);
  if (!snap2.exists()) return null;
  const payload2 = snap2.data() as any;
  return (payload2?.data as TrackingData) ?? null;
}

export async function fbSaveTrackingToCloud(tracking: TrackingData): Promise<boolean> {
  if (!firebaseEnabled || !db) return false;
  const id = (tracking.code || "").toUpperCase();
  const ref = doc(db, FIREBASE_COLLECTION, id);
  await setDoc(ref, { data: tracking }, { merge: true });
  return true;
}
