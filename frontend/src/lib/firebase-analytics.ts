/**
 * Firebase Analytics — initialised lazily on the client only.
 *
 * Auth + Firestore have been replaced by Supabase. This file exists solely
 * to keep Firebase Analytics (= GA4) wired up for page-view + event tracking.
 * The Firebase config below is the public web app config (safe to expose).
 */

import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { type Analytics, getAnalytics, isSupported, logEvent } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "",
};

let app: FirebaseApp | null = null;
let analyticsPromise: Promise<Analytics | null> | null = null;

function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined") return null;
  if (!firebaseConfig.apiKey || !firebaseConfig.measurementId) return null;
  if (app) return app;
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  return app;
}

/**
 * Resolves to a ready Analytics instance (or null if unavailable).
 * Idempotent — repeated calls reuse the same instance.
 */
export function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (analyticsPromise) return analyticsPromise;
  analyticsPromise = (async () => {
    const fbApp = getFirebaseApp();
    if (!fbApp) return null;
    try {
      const supported = await isSupported();
      if (!supported) return null;
      return getAnalytics(fbApp);
    } catch (err) {
      console.warn("Firebase Analytics init failed:", err);
      return null;
    }
  })();
  return analyticsPromise;
}

/**
 * Log a custom event. Fails open if analytics isn't initialised.
 */
export async function track(
  eventName: string,
  params?: Record<string, unknown>,
): Promise<void> {
  try {
    const analytics = await getFirebaseAnalytics();
    if (!analytics) return;
    logEvent(analytics, eventName, params ?? {});
  } catch {
    // Swallow — analytics errors must never break the app.
  }
}
