import { NextRequest, NextResponse } from 'next/server'
import { imagekit } from '@/services/imagekit'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || '/logos'

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 })
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
