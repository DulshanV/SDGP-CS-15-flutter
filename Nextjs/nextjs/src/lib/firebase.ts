import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

let popupInFlight = false;

export async function signInWithGoogle() {
  if (popupInFlight) {
    return null;
  }

  popupInFlight = true;
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (err: any) {
    const message = String(err?.message || '');
    const shouldFallbackToRedirect =
      err?.code === 'auth/internal-error' ||
      message.includes('Pending promise was never set');

    if (shouldFallbackToRedirect) {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }

    throw err;
  } finally {
    popupInFlight = false;
  }
}
