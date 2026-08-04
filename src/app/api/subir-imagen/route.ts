import { NextRequest, NextResponse } from 'next/server'
import { imagekit } from '@/services/imagekit'
import { obtenerAdmin } from '@/services/firebase-admin'

const CARPETAS_PERMITIDAS = ['/plugzone', '/logos']
const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024
const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(request: NextRequest) {
  try {
    const admin = obtenerAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Admin SDK no configurado' }, { status: 500 })
    }

    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    try {
      await admin.auth.verifyIdToken(token)
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || '/plugzone'

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 })
    }

    if (!TIPOS_IMAGEN.includes(file.type)) {
      return NextResponse.json({ error: 'Solo se permiten imágenes (JPEG, PNG, WebP o GIF)' }, { status: 400 })
    }

    if (file.size > TAMANO_MAXIMO_BYTES) {
      return NextResponse.json({ error: 'La imagen supera el tamaño máximo de 5 MB' }, { status: 400 })
    }

    if (!CARPETAS_PERMITIDAS.includes(folder)) {
      return NextResponse.json({ error: 'Carpeta no permitida' }, { status: 400 })
    }

    const imageFile = new File([await file.arrayBuffer()], file.name.replace(/\s+/g, '_'), { type: file.type })

    const result = await imagekit.files.upload({
      file: imageFile,
      fileName: imageFile.name,
      folder,
      useUniqueFileName: true,
    })

    return NextResponse.json({
      url: result.url,
      fileId: result.fileId,
      filePath: result.filePath,
      name: result.name,
    })
  } catch (error) {
    console.error('Error al subir imagen a ImageKit:', error)
    return NextResponse.json({ error: 'Error al subir la imagen' }, { status: 500 })
  }
}
