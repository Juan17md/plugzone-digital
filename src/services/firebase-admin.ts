import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let appSingleton: ReturnType<typeof initializeApp> | null = null;

function inicializarApp() {
  if (appSingleton && getApps().length > 0) return appSingleton;

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!privateKey || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !process.env.FIREBASE_ADMIN_PROJECT_ID) {
    console.warn('⚠️ Credenciales Admin SDK no configuradas.');
    return null;
  }

  appSingleton = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
  });

  return appSingleton;
}

export function obtenerAdmin() {
  const app = inicializarApp();
  if (!app) return null;
  return {
    auth: getAuth(app),
    db: getFirestore(app),
  };
}
