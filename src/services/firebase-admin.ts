import type { App } from 'firebase-admin/app';
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';

let adminApp: any, adminAuth: any, adminFirestore: any;
let appSingleton: App | null = null;

async function cargarAdminSdk() {
  if (!adminApp) {
    adminApp = await import('firebase-admin/app');
    adminAuth = await import('firebase-admin/auth');
    adminFirestore = await import('firebase-admin/firestore');
  }
}

function inicializarApp(): App | null {
  if (appSingleton && adminApp.getApps().length > 0) return appSingleton;

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!privateKey || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !process.env.FIREBASE_ADMIN_PROJECT_ID) {
    console.warn('⚠️ Credenciales Admin SDK no configuradas.');
    return null;
  }

  appSingleton = adminApp.initializeApp({
    credential: adminApp.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
  });

  return appSingleton;
}

export async function obtenerAdmin(): Promise<{ auth: Auth; db: Firestore } | null> {
  await cargarAdminSdk();

  const app = inicializarApp();
  if (!app) return null;

  return {
    auth: adminAuth.getAuth(app),
    db: adminFirestore.getFirestore(app),
  };
}
