import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { token: string } }) {
  try {
    const { token } = params;
    if (!token) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 400 });
    }

    const order = await prisma.productionOrder.findUnique({
      where: { clientReviewToken: token },
      include: {
        executive: { select: { id: true, name: true, email: true, phone: true } },
        creator: { select: { id: true, name: true, email: true, phone: true } },
        postProducer: { select: { id: true, name: true } },
        files: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            fileName: true,
            fileType: true,
            filePath: true,
            fileSize: true,
            fileMime: true,
            externalUrl: true,
            notes: true,
            version: true,
            createdAt: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Enlace de revisión no encontrado o expirado' }, { status: 404 });
    }

    // Filter delivery files
    const deliveryFiles = order.files.filter((f) => f.fileType.startsWith('OUTPUT'));

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        clientAgency: order.clientAgency,
        product: order.product,
        program: order.program,
        airDate: order.airDate,
        materialDeliveryDate: order.materialDeliveryDate,
        status: order.status,
        deliveryNotes: order.deliveryNotes,
        deliveredAt: order.deliveredAt,
        changeChecklist: order.changeChecklist,
        clientApprovedAt: order.clientApprovedAt,
        clientApprovedBy: order.clientApprovedBy,
        clientNotes: order.clientNotes,
        executive: order.executive || order.creator,
        postProducer: order.postProducer,
        deliveryFiles,
      },
    });
  } catch (error: any) {
    console.error('Error in review GET:', error);
    return NextResponse.json({ error: 'Error al cargar la orden de revisión' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { token: string } }) {
  try {
    const { token } = params;
    const body = await req.json();
    const { action, clientName, clientNotes, changeChecklist } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token no válido' }, { status: 400 });
    }

    if (!clientName || !clientName.trim()) {
      return NextResponse.json({ error: 'Por favor ingresa tu nombre o el de tu agencia' }, { status: 400 });
    }

    const order = await prisma.productionOrder.findUnique({
      where: { clientReviewToken: token },
      include: {
        creator: true,
        executive: true,
        postProducer: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    const trimmedClientName = clientName.trim();
    const targetExecutive = order.executive || order.creator;

    if (action === 'APPROVE') {
      const updated = await prisma.productionOrder.update({
        where: { id: order.id },
        data: {
          status: 'APROBADA',
          approved: true,
          approvedBy: `Cliente / Agencia (${trimmedClientName})`,
          approvedAt: new Date(),
          clientApprovedAt: new Date(),
          clientApprovedBy: trimmedClientName,
          clientNotes: clientNotes?.trim() || null,
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          orderId: order.id,
          userId: targetExecutive.id,
          action: 'APROBADA',
          details: `🎉 Comercial Aprobado directamente por el Cliente/Agencia (${trimmedClientName}). ${clientNotes ? 'Comentarios: "' + clientNotes + '"' : ''}`,
        },
      });

      // Notify executive
      await sendNotification({
        userId: targetExecutive.id,
        orderId: order.id,
        type: 'APPROVED',
        title: `✅ ¡Cliente aprobó ${order.orderNumber}!`,
        message: `${trimmedClientName} ha aprobado el comercial para ${order.product}. Ya está listo para salir al aire.`,
        userPhone: targetExecutive.phone,
        userEmail: targetExecutive.email,
        orderNumber: order.orderNumber,
      });

      // Notify post-producer if assigned
      if (order.postProducerId && order.postProducer) {
        await sendNotification({
          userId: order.postProducerId,
          orderId: order.id,
          type: 'APPROVED',
          title: `✅ ¡Material ${order.orderNumber} Aprobado por Cliente!`,
          message: `El cliente ${trimmedClientName} aprobó tu corte final para ${order.product}. ¡Excelente trabajo!`,
          userPhone: order.postProducer.phone,
          userEmail: order.postProducer.email,
          orderNumber: order.orderNumber,
        });
      }

      return NextResponse.json({ success: true, message: '¡Comercial aprobado exitosamente!', order: updated });
    }

    if (action === 'REQUEST_CHANGES') {
      if (!clientNotes || !clientNotes.trim()) {
        return NextResponse.json({ error: 'Por favor detalla los cambios o ajustes requeridos' }, { status: 400 });
      }

      const nextChangesCount = (order.changesCount || 0) + 1;
      const formattedChecklist = changeChecklist && Array.isArray(changeChecklist) && changeChecklist.length > 0
        ? JSON.stringify(changeChecklist)
        : order.changeChecklist;

      const updated = await prisma.productionOrder.update({
        where: { id: order.id },
        data: {
          status: 'CON_CAMBIOS',
          hasChanges: true,
          changesCount: nextChangesCount,
          changeNotes: `[Solicitado por Cliente ${trimmedClientName}]: ${clientNotes.trim()}`,
          changeChecklist: formattedChecklist,
          clientNotes: clientNotes.trim(),
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          orderId: order.id,
          userId: targetExecutive.id,
          action: 'CAMBIOS',
          details: `🔄 Ajustes solicitados por el Cliente/Agencia (${trimmedClientName}): "${clientNotes.trim()}" (Cambio #${nextChangesCount})`,
        },
      });

      // Notify post-producer
      if (order.postProducerId && order.postProducer) {
        await sendNotification({
          userId: order.postProducerId,
          orderId: order.id,
          type: 'CHANGES_REQUESTED',
          title: `🔄 Ajustes solicitados por Cliente en ${order.orderNumber}`,
          message: `El cliente ${trimmedClientName} ha solicitado cambios en ${order.product}: "${clientNotes.trim()}". Revisa el CRM para realizar los ajustes.`,
          userPhone: order.postProducer.phone,
          userEmail: order.postProducer.email,
          orderNumber: order.orderNumber,
        });
      }

      // Notify executive
      await sendNotification({
        userId: targetExecutive.id,
        orderId: order.id,
        type: 'CHANGES_REQUESTED',
        title: `⚠️ Solicitud de cambios de cliente: ${order.orderNumber}`,
        message: `El cliente ${trimmedClientName} ingresó observaciones en ${order.product}. La orden regresó a edición.`,
        userPhone: targetExecutive.phone,
        userEmail: targetExecutive.email,
        orderNumber: order.orderNumber,
      });

      return NextResponse.json({ success: true, message: 'Se enviaron las observaciones al equipo de post-producción.', order: updated });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in review POST:', error);
    return NextResponse.json({ error: 'Error al procesar la respuesta del cliente' }, { status: 500 });
  }
}
