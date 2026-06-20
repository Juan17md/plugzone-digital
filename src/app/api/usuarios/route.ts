import { NextRequest, NextResponse } from 'next/server';
import { obtenerAdmin } from '@/services/firebase-admin';
import { RolUsuario } from '@/types';

export async function GET(req: NextRequest) {
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

    const snapshot = await admin.db.collection('usuarios').orderBy('creadoEn', 'desc').get();
    const usuarios = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));

    return NextResponse.json({ usuarios });
  } catch (error: any) {
    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Token expirado' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const { email, password, rol } = await req.json();

    if (!email || !password || !rol) {
      return NextResponse.json({ error: 'Faltan campos requeridos: email, password, rol' }, { status: 400 });
    }

    const rolesValidos: RolUsuario[] = ['admin', 'operador'];
    if (!rolesValidos.includes(rol)) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });
    }

    const userRecord = await admin.auth.createUser({
      email,
      password,
      emailVerified: true,
    });

    await admin.db.collection('usuarios').doc(userRecord.uid).set({
      email: userRecord.email || email,
      rol,
      bloqueado: false,
      primerInicio: rol === 'operador',
      creadoEn: new Date().toISOString(),
    });

    return NextResponse.json({
      usuario: {
        uid: userRecord.uid,
        email: userRecord.email || email,
        rol,
        bloqueado: false,
        primerInicio: rol === 'operador',
        creadoEn: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json({ error: 'El email ya está en uso' }, { status: 409 });
    }
    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Token expirado' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}
