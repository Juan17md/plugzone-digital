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

// Las variables de entorno pueden llegar con comillas envolventes (al copiarlas
// desde .env.local al dashboard de Vercel), lo que rompe la autenticación OAuth.
const limpiarVariable = (valor: string | undefined): string | undefined =>
  valor?.trim().replace(/^"|"$/g, '');

// Client ID/secret compartido de rclone como fallback (mismo patrón que Muv).
// El client propio de la app OAuth está en modo Testing y sus refresh tokens
// expiran a los 7 días; el compartido de rclone está publicado y no expira.
const CLIENT_ID_COMPARTIDO_RCLONE = '202264815644.apps.googleusercontent.com';
const CLIENT_SECRET_COMPARTIDO_RCLONE = 'X4Z3ca8xfWDb1Voo-F9a7ZxJ';

function crearClienteDrive(): Auth.OAuth2Client | null {
  const clientId = limpiarVariable(process.env.GOOGLE_DRIVE_CLIENT_ID) || CLIENT_ID_COMPARTIDO_RCLONE;
  const clientSecret = limpiarVariable(process.env.GOOGLE_DRIVE_CLIENT_SECRET) || CLIENT_SECRET_COMPARTIDO_RCLONE;
  const refreshToken = limpiarVariable(process.env.GOOGLE_DRIVE_REFRESH_TOKEN);

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
