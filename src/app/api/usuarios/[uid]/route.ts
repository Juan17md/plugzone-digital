import { NextRequest, NextResponse } from 'next/server';
import { obtenerAdmin } from '@/services/firebase-admin';
import { obtenerMensajeError, obtenerCodigoError } from '@/utils/errores';

const ESPERAR_MS = 500;
const REINTENTOS_MAX = 3;

// Firebase Auth tiene consistencia eventual: un usuario recién creado puede
// no estar aún propagado cuando se intenta eliminar de inmediato. Este helper
// reintenta deleteUser con un pequeño backoff para evitar fallos transitorios.
async function eliminarUsuarioDeAuthConReintento(uid: string) {
  const admin = obtenerAdmin();
  if (!admin) return;

  for (let intento = 1; intento <= REINTENTOS_MAX; intento++) {
    try {
      await admin.auth.deleteUser(uid);
      return;
    } catch (error) {
      const esUsuarioNoEncontrado = obtenerCodigoError(error) === 'auth/user-not-found';
      const esUltimoIntento = intento === REINTENTOS_MAX;
      if (esUsuarioNoEncontrado || esUltimoIntento) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, ESPERAR_MS * intento));
    }
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const admin = obtenerAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Admin SDK no configurado' }, { status: 500 });
    }

    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = await admin.auth.verifyIdToken(token);

    const adminDoc = await admin.db.collection('usuarios').doc(decoded.uid).get();
    if (!adminDoc.exists || adminDoc.data()?.rol !== 'admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { uid } = await params;

    if (uid === decoded.uid) {
      return NextResponse.json({ error: 'No puedes modificarte a ti mismo' }, { status: 400 });
    }

    const { bloqueado, rol, email, password } = await req.json();

    const datosActualizar: Record<string, string | boolean> = {};

    if (typeof bloqueado === 'boolean') {
      datosActualizar.bloqueado = bloqueado;

      if (bloqueado) {
        await admin.auth.updateUser(uid, { disabled: true });
      } else {
        await admin.auth.updateUser(uid, { disabled: false });
      }
    }

    if (rol === 'admin' || rol === 'operador') {
      datosActualizar.rol = rol;
    }

    if (email && typeof email === 'string') {
      await admin.auth.updateUser(uid, { email });
      datosActualizar.email = email;
    }

    if (password && typeof password === 'string') {
      await admin.auth.updateUser(uid, { password });
    }

    if (Object.keys(datosActualizar).length > 0) {
      await admin.db.collection('usuarios').doc(uid).update(datosActualizar);
    }

    return NextResponse.json({ successo: true });
  } catch (error) {
    if (obtenerCodigoError(error) === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Token expirado' }, { status: 401 });
    }
    return NextResponse.json({ error: obtenerMensajeError(error) }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const admin = obtenerAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Admin SDK no configurado' }, { status: 500 });
    }

    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = await admin.auth.verifyIdToken(token);

    const adminDoc = await admin.db.collection('usuarios').doc(decoded.uid).get();
    if (!adminDoc.exists || adminDoc.data()?.rol !== 'admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { uid } = await params;

    if (uid === decoded.uid) {
      return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 });
    }

    try {
      await eliminarUsuarioDeAuthConReintento(uid);
    } catch (error) {
      if (obtenerCodigoError(error) !== 'auth/user-not-found') {
        throw error;
      }
      // Si el usuario ya no existe en Auth, se continúa para limpiar Firestore.
    }

    await admin.db.collection('usuarios').doc(uid).delete();

    return NextResponse.json({ successo: true });
  } catch (error) {
    if (obtenerCodigoError(error) === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Token expirado' }, { status: 401 });
    }
    return NextResponse.json({ error: obtenerMensajeError(error) }, { status: 500 });
  }
}
