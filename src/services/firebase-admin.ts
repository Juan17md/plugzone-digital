import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let appSingleton: ReturnType<typeof initializeApp> | null = null;

// Normaliza el private key sin importar el formato en el que se pegó en el entorno:
// JSON completo de la service account, comillas envolventes, \n literal o \\n doble-escapado.
function normalizarPrivateKey(valor: string): string {
  let limpio = valor.trim();

  if (limpio.startsWith('{')) {
    try {
      const parseado = JSON.parse(limpio) as { private_key?: string };
      if (parseado.private_key) limpio = parseado.private_key;
    } catch {
      // Si no es JSON válido, se continúa con el valor crudo
    }
  }

  return limpio
    .replace(/^"|"$/g, '')
    .replace(/\\\\n/g, '\n')
    .replace(/\\n/g, '\n');
}

function inicializarApp() {
  if (appSingleton && getApps().length > 0) return appSingleton;

  const privateKeyRaw = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const privateKey = privateKeyRaw ? normalizarPrivateKey(privateKeyRaw) : undefined;

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
