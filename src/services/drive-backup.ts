import { google, drive_v3, Auth } from 'googleapis';
import { Timestamp } from 'firebase-admin/firestore';

const CARPETA_BACKUPS = 'PlugZone-Backups';

interface DatosColeccion {
  id: string;
  data: Record<string, unknown>;
}

interface BackupGenerado {
  creadoEn: string;
  proyecto: string;
  colecciones: Record<string, DatosColeccion[]>;
}

export function serializarValor(valor: unknown): unknown {
  if (valor instanceof Timestamp) {
    return valor.toDate().toISOString();
  }
  if (valor instanceof Date) {
    return valor.toISOString();
  }
  if (Array.isArray(valor)) {
    return valor.map(serializarValor);
  }
  if (valor && typeof valor === 'object') {
    const resultado: Record<string, unknown> = {};
    for (const [clave, subValor] of Object.entries(valor as Record<string, unknown>)) {
      resultado[clave] = serializarValor(subValor);
    }
    return resultado;
  }
  return valor;
}

function crearClienteDrive(): Auth.OAuth2Client | null {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return null;
  }

  const cliente = new google.auth.OAuth2(clientId, clientSecret);
  cliente.setCredentials({ refresh_token: refreshToken });
  return cliente;
}

async function obtenerOCrearCarpeta(drive: drive_v3.Drive) {
  const lista = await drive.files.list({
    q: `name = '${CARPETA_BACKUPS}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  const existente = lista.data.files?.[0];
  if (existente) {
    return existente.id!;
  }

  const creada = await drive.files.create({
    requestBody: {
      name: CARPETA_BACKUPS,
      mimeType: 'application/vnd.google-apps.folder',
    },
    fields: 'id',
  });

  return creada.data.id!;
}

export async function subirBackupADrive(backup: BackupGenerado) {
  const credenciales = crearClienteDrive();
  if (!credenciales) {
    throw new Error('Credenciales de Google Drive (GOOGLE_DRIVE_CLIENT_ID / GOOGLE_DRIVE_CLIENT_SECRET / GOOGLE_DRIVE_REFRESH_TOKEN) no configuradas.');
  }

  const auth = credenciales;
  const drive = google.drive({ version: 'v3', auth });

  const carpetaId = await obtenerOCrearCarpeta(drive);
  const nombreArchivo = `backup-plugzone-${backup.creadoEn.replace(/[:.]/g, '-')}.json`;

  const contenido = JSON.stringify(backup, null, 2);

  const resultado = await drive.files.create({
    requestBody: {
      name: nombreArchivo,
      parents: [carpetaId],
      mimeType: 'application/json',
    },
    media: {
      mimeType: 'application/json',
      body: contenido,
    },
    fields: 'id, name, createdTime',
  });

  return {
    id: resultado.data.id!,
    nombre: resultado.data.name!,
    creadoEn: resultado.data.createdTime!,
    carpetaId,
  };
}

export async function purgarBackupsAntiguos(drive: drive_v3.Drive, carpetaId: string, maximoBackups: number) {
  const lista = await drive.files.list({
    q: `'${carpetaId}' in parents and trashed = false`,
    fields: 'files(id, name, createdTime)',
    orderBy: 'createdTime desc',
    spaces: 'drive',
  });

  const archivos = lista.data.files ?? [];
  const excedentes = archivos.slice(maximoBackups);

  for (const archivo of excedentes) {
    if (!archivo.id) continue;
    await drive.files.delete({ fileId: archivo.id });
  }

  return excedentes.filter(a => a.name).map(a => a.name as string);
}

export function crearClienteDriveParaPurgar() {
  return crearClienteDrive();
}

export { CARPETA_BACKUPS };
