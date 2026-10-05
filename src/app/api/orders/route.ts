import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { sendNotification } from '@/lib/notifications';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');
    const scope = searchParams.get('scope'); // 'my_orders', 'assigned_to_me', 'all'

    const where: any = {};

    if (scope === 'my_orders' || user.role === 'SOLICITANTE') {
      where.OR = [
        { creatorId: user.id },
        { executiveId: user.id },
      ];
    } else if (scope === 'assigned_to_me' || user.role === 'POST_PRODUCTOR') {
      where.OR = [
        { postProducerId: user.id },
        { secondaryPostProducerId: user.id },
      ];
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (priority && priority !== 'ALL') {
      where.priority = priority;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { clientAgency: { contains: search, mode: 'insensitive' } },
        { product: { contains: search, mode: 'insensitive' } },
        { program: { contains: search, mode: 'insensitive' } },
        { executive: { name: { contains: search, mode: 'insensitive' } } },
        { creator: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const orders = await prisma.productionOrder.findMany({
      where,
      include: {
        creator: {
          select: { id: true, name: true, initials: true, email: true, phone: true },
        },
        executive: {
          select: { id: true, name: true, initials: true, email: true, phone: true },
        },
        postProducer: {
          select: { id: true, name: true, initials: true, email: true, phone: true },
        },
        secondaryPostProducer: {
          select: { id: true, name: true, initials: true, email: true, phone: true },
        },
        sourceDemo: {
          select: { id: true, orderNumber: true, clientAgency: true, product: true, isDemo: true, demoStatus: true },
        },
        convertedOrders: {
          select: { id: true, orderNumber: true, clientAgency: true, product: true, packageValue: true, createdAt: true },
        },
        files: {
          select: { id: true, fileName: true, fileType: true, filePath: true, externalUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error listing orders:', error);
    return NextResponse.json({ error: 'Error al listar órdenes' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Debes iniciar sesión para crear una SP' }, { status: 401 });
    }

    const body = await req.json();
    const {
      clientAgency,
      product,
      program,
      materialDeliveryDate,
      airDate,
      downloadUrl,
      materialNotes,
      hasBrief = true,
      sponsorshipTypes = [],
      customSponsorship,
      voiceoverType = 'GENERICA',
      voiceoverText,
      packageValue,
      priority = 'MEDIA',
      files = [],
      executiveId, // ID of the sales executive for the client
      isDemo = false,
      sourceDemoId,
    } = body;

    if (!clientAgency || !product) {
      return NextResponse.json({ error: 'Cliente/Agencia y Producto son obligatorios' }, { status: 400 });
    }

    const isDemoOrder = Boolean(isDemo);
    const parsedPackageValue = isDemoOrder 
      ? 0 
      : (packageValue !== undefined && packageValue !== null && packageValue !== ''
          ? parseFloat(String(packageValue).replace(/[^0-9.]/g, ''))
          : 0);

    // 👩‍💼 Resolve executive and initials
    let targetExecutive = null;
    if (executiveId) {
      targetExecutive = await prisma.user.findUnique({
        where: { id: executiveId },
      });
    }

    // Default to creator if they are SOLICITANTE or if no target executive
    if (!targetExecutive && user.role === 'SOLICITANTE') {
      targetExecutive = user;
    }

    const effectiveExecutiveId = targetExecutive ? targetExecutive.id : null;
    const userInitials = (targetExecutive?.initials || user.initials || 'SP').toUpperCase();

    // 🔢 Consecutive logic per executive prefix (e.g. SP-AR-001, SP-CM-001)
    const lastOrderForExecutive = await prisma.productionOrder.findFirst({
      where: {
        OR: [
          effectiveExecutiveId ? { executiveId: effectiveExecutiveId } : { creatorId: user.id },
          { orderNumber: { startsWith: `SP-${userInitials}-` } },
        ],
      },
      orderBy: { consecutive: 'desc' },
    });

    let nextConsecutive = (lastOrderForExecutive?.consecutive || 0) + 1;
    let paddedNumber = String(nextConsecutive).padStart(3, '0');
    let orderNumber = `SP-${userInitials}-${paddedNumber}`;

    // Ensure uniqueness across database
    const existingWithSameCode = await prisma.productionOrder.findUnique({
      where: { orderNumber },
    });
    if (existingWithSameCode) {
      const allWithPrefix = await prisma.productionOrder.count({
        where: { orderNumber: { startsWith: `SP-${userInitials}-` } },
      });
      nextConsecutive = allWithPrefix + 1;
      paddedNumber = String(nextConsecutive).padStart(3, '0');
      orderNumber = `SP-${userInitials}-${paddedNumber}`;
    }

    // Create the order in PostgreSQL database
    const newOrder = await prisma.productionOrder.create({
      data: {
        orderNumber,
        consecutive: nextConsecutive,
        clientAgency: clientAgency.trim(),
        product: product.trim(),
        program: program ? program.trim() : '',
        materialDeliveryDate: materialDeliveryDate || null,
        airDate: airDate || null,
        downloadUrl: downloadUrl ? downloadUrl.trim() : null,
        materialNotes: materialNotes || null,
        hasBrief: Boolean(hasBrief),
        sponsorshipTypes: JSON.stringify(sponsorshipTypes),
        customSponsorship: customSponsorship || null,
        voiceoverType,
        voiceoverText: voiceoverText || null,
        packageValue: isNaN(parsedPackageValue) ? 0 : parsedPackageValue,
        status: 'NUEVA',
        priority,
        creatorId: user.id,
        executiveId: effectiveExecutiveId,
        coordinatorId: (user.role === 'COORDINADOR' || user.role === 'ADMIN') ? user.id : null,
        isDemo: isDemoOrder,
        demoStatus: isDemoOrder ? 'PENDIENTE_VENTA' : null,
        sourceDemoId: sourceDemoId || null,
      },
    });

    // If this regular SP comes from a DEMO, mark the original DEMO as VENDIDO
    if (sourceDemoId && !isDemoOrder) {
      try {
        const sourceDemo = await prisma.productionOrder.findUnique({
          where: { id: sourceDemoId },
        });

        if (sourceDemo) {
          await prisma.productionOrder.update({
            where: { id: sourceDemoId },
            data: {
              demoStatus: 'VENDIDO',
              demoConvertedAt: new Date(),
            },
          });

          await prisma.activityLog.create({
            data: {
              orderId: sourceDemoId,
              userId: user.id,
              action: 'VENDIDO',
              details: `🎉 DEMO comercializado exitosamente en la Orden ${orderNumber} con valor de $${parsedPackageValue.toLocaleString('es-EC', { minimumFractionDigits: 2 })} USD por ${user.name}.`,
            },
          });
        }
      } catch (err) {
        console.error('Error linking source demo:', err);
      }
    }

    // Save input files if provided
    if (files && Array.isArray(files) && files.length > 0) {
      for (const f of files) {
        await prisma.orderFile.create({
          data: {
            orderId: newOrder.id,
            uploaderId: user.id,
            fileType: f.fileType || 'INPUT_BRIEF',
            fileName: f.fileName || 'Adjunto',
            filePath: f.filePath || '',
            fileSize: f.fileSize || 0,
            fileMime: f.fileMime || 'application/octet-stream',
            externalUrl: f.externalUrl || null,
            notes: f.notes || null,
          },
        });
      }
    }

    // Log activity
    const activityLogDetails = targetExecutive && targetExecutive.id !== user.id
      ? `Solicitud de producción ${orderNumber} ingresada por Coordinación (${user.name}) para la Ejecutiva ${targetExecutive.name}`
      : `Solicitud de producción ${orderNumber} creada por ${user.name} (${user.email})`;

    await prisma.activityLog.create({
      data: {
        orderId: newOrder.id,
        userId: user.id,
        action: 'CREADA',
        details: activityLogDetails,
      },
    });

    // 🔔 OBLIGATORY NOTIFICATION TO ALL COORDINATORS AND ADMINS
    const coordinators = await prisma.user.findMany({
      where: { role: { in: ['COORDINADOR', 'ADMIN'] } },
    });

    const executiveDisplayName = targetExecutive ? targetExecutive.name : user.name;

    for (const coord of coordinators) {
      await sendNotification({
        userId: coord.id,
        orderId: newOrder.id,
        type: 'NEW_SP',
        title: `📥 ¡Nueva SP Recibida! ${orderNumber}`,
        message: `${executiveDisplayName} ha emitido la orden ${orderNumber} para ${clientAgency} (${product}). Fecha al aire: ${airDate || 'Por definir'}. Entra al CRM para asignarla a un post-productor.`,
        userPhone: coord.phone,
        userEmail: coord.email,
        orderNumber,
      });
    }

    // Also notify executive if entered by coordinator
    if (targetExecutive && targetExecutive.id !== user.id) {
      await sendNotification({
        userId: targetExecutive.id,
        orderId: newOrder.id,
        type: 'NEW_SP',
        title: `📥 SP ${orderNumber} ingresada por Coordinación`,
        message: `Coordinación (${user.name}) ha registrado la orden ${orderNumber} para tu cliente ${clientAgency} (${product}).`,
        userPhone: targetExecutive.phone,
        userEmail: targetExecutive.email,
        orderNumber,
      });
    }

    return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Error al registrar la orden' }, { status: 500 });
  }
}
