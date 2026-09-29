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
      where.creatorId = user.id;
    } else if (scope === 'assigned_to_me' || user.role === 'POST_PRODUCTOR') {
      where.postProducerId = user.id;
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
      ];
    }

    const orders = await prisma.productionOrder.findMany({
      where,
      include: {
        creator: {
          select: { id: true, name: true, initials: true, email: true, phone: true },
        },
        postProducer: {
          select: { id: true, name: true, initials: true, email: true, phone: true },
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
      materialNotes,
      hasBrief = true,
      sponsorshipTypes = [],
      customSponsorship,
      voiceoverType = 'GENERICA',
      voiceoverText,
      priority = 'MEDIA',
      files = [],
    } = body;

    if (!clientAgency || !product) {
      return NextResponse.json({ error: 'Cliente/Agencia y Producto son obligatorios' }, { status: 400 });
    }

    // Calculate sequential number
    const lastOrder = await prisma.productionOrder.findFirst({
      orderBy: { consecutive: 'desc' },
    });
    const nextConsecutive = (lastOrder?.consecutive || 1127) + 1;
    const userInitials = user.initials || 'SP';
    const orderNumber = `SP-${userInitials}-${nextConsecutive}`;

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
        materialNotes: materialNotes || null,
        hasBrief: Boolean(hasBrief),
        sponsorshipTypes: JSON.stringify(sponsorshipTypes),
        customSponsorship: customSponsorship || null,
        voiceoverType,
        voiceoverText: voiceoverText || null,
        status: 'NUEVA',
        priority,
        creatorId: user.id,
      },
    });

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
    await prisma.activityLog.create({
      data: {
        orderId: newOrder.id,
        userId: user.id,
        action: 'CREADA',
        details: `Solicitud de producción creada por ${user.name} (${user.email})`,
      },
    });

    // 🔔 OBLIGATORY NOTIFICATION TO ALL COORDINATORS AND ADMINS
    const coordinators = await prisma.user.findMany({
      where: { role: { in: ['COORDINADOR', 'ADMIN'] } },
    });

    for (const coord of coordinators) {
      await sendNotification({
        userId: coord.id,
        orderId: newOrder.id,
        type: 'NEW_SP',
        title: `📥 ¡Nueva SP Recibida! ${orderNumber}`,
        message: `${user.name} ha emitido una orden para ${clientAgency} (${product}). Fecha al aire: ${airDate || 'Por definir'}. Entra al CRM para asignarla a un post-productor.`,
        userPhone: coord.phone,
        orderNumber,
      });
    }

    return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Error al registrar la orden' }, { status: 500 });
  }
}
