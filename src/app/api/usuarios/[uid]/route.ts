import { NextRequest, NextResponse } from 'next/server';
import { obtenerAdmin } from '@/services/firebase-admin';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const admin = await obtenerAdmin();
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

    const datosActualizar: Record<string, any> = {};

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
  } catch (error: any) {
    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Token expirado' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const admin = await obtenerAdmin();
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

    await admin.auth.deleteUser(uid);

    await admin.db.collection('usuarios').doc(uid).delete();

    return NextResponse.json({ successo: true });
  } catch (error: any) {
    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Token expirado' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}
