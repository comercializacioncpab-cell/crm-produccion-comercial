import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import path from 'path';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { id: string; fileId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id, fileId } = params;

    const fileRecord = await prisma.orderFile.findFirst({
      where: {
        id: fileId,
        orderId: id,
      },
    });

    if (!fileRecord) {
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
    }

    if (fileRecord.externalUrl && !fileRecord.filePath) {
      return NextResponse.redirect(fileRecord.externalUrl);
    }

    if (!fileRecord.filePath) {
      return NextResponse.json({ error: 'El registro no contiene un archivo físico en el servidor' }, { status: 404 });
    }

    const relativePath = fileRecord.filePath.replace(/^\//, '');
    const fullPath = path.join(process.cwd(), 'public', relativePath);

    if (!existsSync(fullPath)) {
      return NextResponse.json({ error: 'El archivo físico no se encuentra en el disco del servidor' }, { status: 404 });
    }

    const fileBuffer = await readFile(fullPath);
    const mimeType = fileRecord.fileMime || 'application/octet-stream';
    const safeName = (fileRecord.fileName || path.basename(fullPath)).replace(/[^a-zA-Z0-9._-]/g, '_');

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${safeName}"`,
        'Content-Length': String(fileBuffer.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Error downloading file:', error);
    return NextResponse.json({ error: 'Error al procesar la descarga del archivo' }, { status: 500 });
  }
}
