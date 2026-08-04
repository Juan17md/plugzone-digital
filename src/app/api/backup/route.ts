import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { obtenerAdmin } from '@/services/firebase-admin';
import { subirBackupADrive, purgarBackupsAntiguos, crearClienteDriveParaPurgar, CARPETA_BACKUPS, serializarValor } from '@/services/drive-backup';

export const maxDuration = 300;

const COLECCIONES = ['productos', 'ventas', 'gastos', 'usuarios', 'config'];
const MAXIMO_BACKUPS = 7;

function verificarSecretoCron(req: NextRequest) {
  const secreto = process.env.BACKUP_CRON_SECRET;
  if (!secreto) return false;

  const autorizacion = req.headers.get('authorization');
  return autorizacion === `Bearer ${secreto}`;
}

export async function GET(req: NextRequest) {
  try {
    if (!verificarSecretoCron(req)) {
      const admin = obtenerAdmin();
      const token = req.headers.get('authorization')?.replace('Bearer ', '');

      if (!admin || !token) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }

      let decoded;
      try {
        decoded = await admin.auth.verifyIdToken(token);
      } catch {
        return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
      }

      const adminDoc = await admin.db.collection('usuarios').doc(decoded.uid).get();
      if (!adminDoc.exists || adminDoc.data()?.rol !== 'admin') {
        return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
      }
    }

    return NextResponse.json(
      { ok: true, mensaje: 'Endpoint de backup activo', ruta: 'POST /api/backup', colecciones: COLECCIONES, carpetaDrive: CARPETA_BACKUPS, retencion: `${MAXIMO_BACKUPS} backups` },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!verificarSecretoCron(req)) {
      const admin = obtenerAdmin();
      const token = req.headers.get('authorization')?.replace('Bearer ', '');

      if (!admin || !token) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }

      let decoded;
      try {
        decoded = await admin.auth.verifyIdToken(token);
      } catch {
        return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
      }

      const adminDoc = await admin.db.collection('usuarios').doc(decoded.uid).get();
      if (!adminDoc.exists || adminDoc.data()?.rol !== 'admin') {
        return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
      }
    }

    const admin = obtenerAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Admin SDK no configurado' }, { status: 500 });
    }

    const colecciones: Record<string, { id: string; data: Record<string, unknown> }[]> = {};

    for (const nombreColeccion of COLECCIONES) {
      const snapshot = await admin.db.collection(nombreColeccion).get();
      colecciones[nombreColeccion] = snapshot.docs.map(doc => ({
        id: doc.id,
        data: serializarValor(doc.data()) as Record<string, unknown>,
      }));
    }

    const backup = {
      creadoEn: new Date().toISOString(),
      proyecto: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'plugzone-digital',
      colecciones,
    };

    const resultado = await subirBackupADrive(backup);

    const clienteDrive = crearClienteDriveParaPurgar();
    let purgados: string[] = [];
    if (clienteDrive) {
      const drive = google.drive({ version: 'v3', auth: clienteDrive });
      purgados = await purgarBackupsAntiguos(drive, resultado.carpetaId, MAXIMO_BACKUPS);
    }

    const totalDocumentos = Object.values(colecciones).reduce((total, docs) => total + docs.length, 0);

    return NextResponse.json({
      ok: true,
      mensaje: 'Backup completado y subido a Google Drive',
      archivo: resultado.nombre,
      archivoId: resultado.id,
      carpetaDrive: CARPETA_BACKUPS,
      coleccionesRespaldo: Object.fromEntries(Object.entries(colecciones).map(([k, v]) => [k, v.length])),
      totalDocumentos,
      backupsAntiguosEliminados: purgados,
    });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
