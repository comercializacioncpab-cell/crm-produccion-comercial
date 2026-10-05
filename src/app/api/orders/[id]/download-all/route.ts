import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import JSZip from 'jszip';
import path from 'path';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;
    const url = new URL(req.url);
    const filterType = url.searchParams.get('type') || 'ALL'; // 'INPUT', 'OUTPUT', 'ALL'

    const order = await prisma.productionOrder.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        files: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    let filesToZip = order.files;
    if (filterType === 'INPUT') {
      filesToZip = order.files.filter((f) => f.fileType.startsWith('INPUT'));
    } else if (filterType === 'OUTPUT') {
      filesToZip = order.files.filter((f) => f.fileType.startsWith('OUTPUT'));
    }

    // Filter to only files that have local filePath
    const localFiles = filesToZip.filter((f) => f.filePath);

    if (localFiles.length === 0) {
      return NextResponse.json({ error: 'No hay archivos locales disponibles para comprimir' }, { status: 400 });
    }

    const zip = new JSZip();
    let addedCount = 0;

    for (const file of localFiles) {
      // Remove leading slash if any
      const relativePath = file.filePath.replace(/^\//, '');
      const fullPath = path.join(process.cwd(), 'public', relativePath);

      if (existsSync(fullPath)) {
        try {
          const fileData = await readFile(fullPath);
          const zipFileName = file.fileName || path.basename(fullPath);
          zip.file(zipFileName, fileData);
          addedCount++;
        } catch (e) {
          console.error(`Error reading file ${fullPath}:`, e);
        }
      }
    }

    if (addedCount === 0) {
      return NextResponse.json({ error: 'No se pudieron leer los archivos en el servidor' }, { status: 404 });
    }

    const zipData = await zip.generateAsync({
      type: 'arraybuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const categoryPrefix = filterType === 'INPUT' ? 'Insumos' : filterType === 'OUTPUT' ? 'Entregables' : 'Archivos';
    const zipFileName = `${categoryPrefix}_${order.orderNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.zip`;

    return new Response(zipData, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFileName}"`,
        'Content-Length': String(zipData.byteLength),
      },
    });
  } catch (error: any) {
    console.error('Error generating zip:', error);
    return NextResponse.json({ error: 'Error al generar archivo ZIP' }, { status: 500 });
  }
}
