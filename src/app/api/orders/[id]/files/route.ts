import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;

    const order = await prisma.productionOrder.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (parseError: any) {
      console.error('Error parsing multipart formData:', parseError);
      return NextResponse.json(
        { error: 'El archivo excede el tamaño máximo permitido por el servidor web o la conexión se interrumpió. Para videos master o renders pesados, por favor utiliza un enlace en la nube (Drive/WeTransfer/Frame.io).' },
        { status: 413 }
      );
    }

    const file = formData.get('file') as File | null;
    const fileType = (formData.get('fileType') as string) || 'INPUT_ASSET';
    const notes = (formData.get('notes') as string) || '';
    const externalUrl = (formData.get('externalUrl') as string) || null;

    let savedFilePath = '';
    let fileName = '';
    let fileSize = 0;
    let fileMime = 'application/octet-stream';

    if (file && typeof file === 'object' && 'arrayBuffer' in file) {
      fileName = file.name;
      fileSize = Math.round(Number(file.size)) || 0;
      fileMime = file.type || 'application/octet-stream';

      // Check max size limit for direct upload (15MB)
      const MAX_DIRECT_UPLOAD_BYTES = 15 * 1024 * 1024;
      if (fileSize > MAX_DIRECT_UPLOAD_BYTES) {
        return NextResponse.json(
          {
            error: `El archivo "${fileName}" (${(fileSize / (1024 * 1024)).toFixed(1)} MB) excede el límite de subida directa (15 MB). Por favor pega un enlace en la nube (Google Drive, WeTransfer o Frame.io).`,
          },
          { status: 413 }
        );
      }

      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create uploads directory
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', `sp-${order.orderNumber}`);
        await mkdir(uploadDir, { recursive: true });

        const safeName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const fullPath = path.join(uploadDir, safeName);
        await writeFile(fullPath, buffer);

        savedFilePath = `/uploads/sp-${order.orderNumber}/${safeName}`;
      } catch (fsError: any) {
        console.warn('Filesystem write error (e.g. read-only environment or permissions):', fsError?.message);
        // Fallback for small files (<= 2.5MB) in serverless/read-only disk: store as data URI
        if (fileSize <= 2.5 * 1024 * 1024) {
          const bytes = await file.arrayBuffer();
          const base64 = Buffer.from(bytes).toString('base64');
          savedFilePath = `data:${fileMime};base64,${base64}`;
        } else {
          return NextResponse.json(
            { error: 'El servidor no permite almacenar archivos locales de este tamaño en su disco actual. Por favor ingresa el enlace de descarga en la nube (Google Drive, Frame.io o WeTransfer).' },
            { status: 500 }
          );
        }
      }
    } else if (externalUrl) {
      fileName = (formData.get('fileName') as string) || 'Enlace Externo (Drive/Frame.io)';
    } else {
      return NextResponse.json({ error: 'No se envió ningún archivo ni enlace' }, { status: 400 });
    }

    let fileVersion: number | null = null;
    if (fileType.startsWith('OUTPUT')) {
      const prevOutputsCount = await prisma.orderFile.count({
        where: { orderId: id, fileType: { startsWith: 'OUTPUT' } },
      });
      fileVersion = prevOutputsCount + 1;
    }

    const newFile = await prisma.orderFile.create({
      data: {
        orderId: id,
        uploaderId: user.id,
        fileType,
        fileName,
        filePath: savedFilePath,
        fileSize,
        fileMime,
        version: fileVersion || 1,
        externalUrl,
        notes,
      },
      include: {
        uploader: { select: { id: true, name: true, role: true } },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        orderId: id,
        userId: user.id,
        action: fileType.startsWith('OUTPUT') ? 'ENTREGADA' : 'COMENTARIO',
        details: `${user.name} subió el archivo: ${fileName}`,
      },
    });

    return NextResponse.json({ success: true, file: newFile }, { status: 201 });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al subir archivo. Si es un video pesado, por favor utiliza un enlace en la nube.' },
      { status: 500 }
    );
  }
}
