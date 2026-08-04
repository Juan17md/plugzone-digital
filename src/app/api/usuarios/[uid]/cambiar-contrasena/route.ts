import { NextRequest, NextResponse } from 'next/server';
import { obtenerAdmin } from '@/services/firebase-admin';
import { obtenerMensajeError, obtenerCodigoError } from '@/utils/errores';

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
    const { uid } = await params;

    if (decoded.uid !== uid) {
      return NextResponse.json({ error: 'Solo puedes cambiar tu propia contraseña' }, { status: 403 });
    }

    const { password } = await req.json();

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    await admin.auth.updateUser(uid, { password });

    await admin.db.collection('usuarios').doc(uid).update({ primerInicio: false });

    return NextResponse.json({ successo: true });
  } catch (error) {
    if (obtenerCodigoError(error) === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Sesión expirada. Vuelve a iniciar sesión.' }, { status: 401 });
    }
    return NextResponse.json({ error: obtenerMensajeError(error) }, { status: 500 });
  }
}
