import sharp from 'sharp';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '..', 'public', 'icons');
if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });

const IMAGEN_ORIGEN = 'https://ik.imagekit.io/h5w0cdkit/plugzone/icono_sin_fondo_e9DNtxsHd.PNG';
const FONDO = '#080C14';
const PADDING_PCT = 0.22;
const TAMANOS = [48, 72, 96, 144, 192, 512];

async function generarIcono(tamanio) {
  const inputBuffer = await fetch(IMAGEN_ORIGEN).then(r => r.arrayBuffer());
  const contenido = Math.round(tamanio * (1 - PADDING_PCT * 2));

  const resultado = await sharp({
    create: {
      width: tamanio,
      height: tamanio,
      channels: 4,
      background: FONDO,
    },
  })
    .composite([
      {
        input: await sharp(inputBuffer)
          .resize(contenido, contenido, { fit: 'inside' })
          .toBuffer(),
        gravity: 'center',
      },
    ])
    .png()
    .toBuffer();

  const nombre = `icono-${tamanio}x${tamanio}.png`;
  const ruta = resolve(publicDir, nombre);
  writeFileSync(ruta, resultado);
  console.log(`  ✓ ${nombre} (${(resultado.length / 1024).toFixed(1)} KB)`);
}

console.log(`\nGenerando iconos con ${PADDING_PCT * 100}% padding...\n`);
await Promise.all(TAMANOS.map(generarIcono));
console.log(`\nIconos generados en public/icons/\n`);
