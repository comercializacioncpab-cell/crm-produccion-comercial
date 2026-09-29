import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

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

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const fileType = (formData.get('fileType') as string) || 'INPUT_ASSET';
    const notes = (formData.get('notes') as string) || '';
    const externalUrl = (formData.get('externalUrl') as string) || null;

    let savedFilePath = '';
    let fileName = '';
    let fileSize = 0;
    let fileMime = 'application/octet-stream';

    if (file && typeof file === 'object' && 'arrayBuffer' in file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      fileName = file.name;
      fileSize = file.size;
      fileMime = file.type || 'application/octet-stream';

      // Create uploads directory
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', `sp-${order.orderNumber}`);
      await mkdir(uploadDir, { recursive: true });

      const safeName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const fullPath = path.join(uploadDir, safeName);
      await writeFile(fullPath, buffer);

      savedFilePath = `/uploads/sp-${order.orderNumber}/${safeName}`;
    } else if (externalUrl) {
      fileName = (formData.get('fileName') as string) || 'Enlace Externo (Drive/Frame.io)';
    } else {
      return NextResponse.json({ error: 'No se envió ningún archivo ni enlace' }, { status: 400 });
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
    return NextResponse.json({ error: 'Error al subir archivo' }, { status: 500 });
  }
}
