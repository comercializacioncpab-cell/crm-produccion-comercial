import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { sendNotification } from '@/lib/notifications';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;

    const order = await prisma.productionOrder.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        creator: {
          select: { id: true, name: true, initials: true, email: true, phone: true, role: true },
        },
        postProducer: {
          select: { id: true, name: true, initials: true, email: true, phone: true, role: true },
        },
        files: {
          include: {
            uploader: { select: { id: true, name: true, role: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        activityLogs: {
          include: {
            user: { select: { id: true, name: true, role: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error getting order:', error);
    return NextResponse.json({ error: 'Error al obtener orden' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { action } = body;

    const order = await prisma.productionOrder.findUnique({
      where: { id },
      include: {
        creator: true,
        postProducer: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    let updatedOrder;

    // 1. ACTION: ASSIGN POST-PRODUCER (Coordinator / Admin)
    if (action === 'ASSIGN') {
      const { postProducerId, priority } = body;
      const targetPost = await prisma.user.findUnique({ where: { id: postProducerId } });
      if (!targetPost) {
        return NextResponse.json({ error: 'Post-Productor no encontrado' }, { status: 400 });
      }

      updatedOrder = await prisma.productionOrder.update({
        where: { id },
        data: {
          postProducerId,
          coordinatorId: user.id,
          status: 'ASIGNADA',
          ...(priority && { priority }),
        },
        include: { creator: true, postProducer: true, files: true, activityLogs: true },
      });

      await prisma.activityLog.create({
        data: {
          orderId: id,
          userId: user.id,
          action: 'ASIGNADA',
          details: `Asignada por ${user.name} a ${targetPost.name}`,
        },
      });

      // 🔔 NOTIFY 1: Post-Productor (New work assigned)
      await sendNotification({
        userId: targetPost.id,
        orderId: id,
        type: 'ASSIGNED',
        title: `🎯 Tienes una nueva asignación: ${order.orderNumber}`,
        message: `${user.name} te ha asignado la orden ${order.orderNumber} (${order.clientAgency} - ${order.product}). Fecha al aire: ${order.airDate || 'Por definir'}.`,
        userPhone: targetPost.phone,
        userEmail: targetPost.email,
        orderNumber: order.orderNumber,
      });

      // 🔔 NOTIFY 2: Ejecutiva Solicitante (Let her know WHO was assigned)
      await sendNotification({
        userId: order.creatorId,
        orderId: id,
        type: 'ASSIGNED',
        title: `📋 Tu Solicitud ${order.orderNumber} ha sido Asignada`,
        message: `Tu orden ${order.orderNumber} (${order.product}) fue asignada al post-productor ${targetPost.name} para su edición.`,
        userPhone: order.creator.phone,
        userEmail: order.creator.email,
        orderNumber: order.orderNumber,
      });

      return NextResponse.json({ success: true, order: updatedOrder });
    }

    // 2. ACTION: START PRODUCTION (Post-Producer)
    if (action === 'START_WORK') {
      updatedOrder = await prisma.productionOrder.update({
        where: { id },
        data: { status: 'EN_PROCESO' },
      });

      await prisma.activityLog.create({
        data: {
          orderId: id,
          userId: user.id,
          action: 'EN_PRODUCCION',
          details: `${user.name} inició los trabajos de post-producción.`,
        },
      });

      // 🔔 NOTIFY: Ejecutiva Solicitante (Work is in progress)
      await sendNotification({
        userId: order.creatorId,
        orderId: id,
        type: 'IN_PROGRESS',
        title: `⏳ ${order.orderNumber} en Post-Producción`,
        message: `El post-productor ${user.name} ha iniciado los trabajos de edición de tu orden ${order.orderNumber} (${order.product}).`,
        userPhone: order.creator.phone,
        userEmail: order.creator.email,
        orderNumber: order.orderNumber,
      });

      return NextResponse.json({ success: true, order: updatedOrder });
    }

    // 3. ACTION: RESOLVE / DELIVER COMPLETED MATERIAL (Post-Producer)
    if (action === 'RESOLVE_DELIVERY') {
      const { deliveryNotes, fileUrl, fileName, externalUrl } = body;

      updatedOrder = await prisma.productionOrder.update({
        where: { id },
        data: {
          status: 'RESUELTA',
          deliveryNotes: deliveryNotes || null,
          deliveredAt: new Date(),
        },
        include: { creator: true, postProducer: true, files: true, activityLogs: true },
      });

      if (fileName || externalUrl) {
        await prisma.orderFile.create({
          data: {
            orderId: id,
            uploaderId: user.id,
            fileType: 'OUTPUT_DELIVERY',
            fileName: fileName || 'Entregable Final',
            filePath: fileUrl || '',
            fileSize: 0,
            fileMime: 'video/mp4',
            externalUrl: externalUrl || null,
            notes: deliveryNotes || 'Material final entregado',
          },
        });
      }

      await prisma.activityLog.create({
        data: {
          orderId: id,
          userId: user.id,
          action: 'ENTREGADA',
          details: `Material final subido y entregado por ${user.name}. Listo para revisión.`,
        },
      });

      // 🔔 NOTIFY 1: Solicitante (Order is resolved and deliverable is ready)
      await sendNotification({
        userId: order.creatorId,
        orderId: id,
        type: 'RESOLVED',
        title: `✨ ¡Tu Solicitud ${order.orderNumber} ha sido Resuelta y Atendida!`,
        message: `${user.name} ha terminado el trabajo de producción para ${order.product} y subió el material requerido. Ya puedes descargarlo y aprobarlo.`,
        userPhone: order.creator.phone,
        userEmail: order.creator.email,
        orderNumber: order.orderNumber,
      });

      // 🔔 NOTIFY 2: Coordinadoras
      const coordinators = await prisma.user.findMany({ where: { role: 'COORDINADOR' } });
      for (const coord of coordinators) {
        await sendNotification({
          userId: coord.id,
          orderId: id,
          type: 'RESOLVED',
          title: `✅ SP ${order.orderNumber} Entregada por ${user.name}`,
          message: `${user.name} ha completado y subido la entrega para ${order.clientAgency} (${order.product}).`,
          userPhone: coord.phone,
          userEmail: coord.email,
          orderNumber: order.orderNumber,
        });
      }

      return NextResponse.json({ success: true, order: updatedOrder });
    }

    // 4. ACTION: REQUEST CHANGES (Solicitante / Coordinador)
    if (action === 'REQUEST_CHANGES') {
      const { changeNotes } = body;

      if (!changeNotes) {
        return NextResponse.json({ error: 'Debes especificar las correcciones solicitadas' }, { status: 400 });
      }

      updatedOrder = await prisma.productionOrder.update({
        where: { id },
        data: {
          status: 'CON_CAMBIOS',
          hasChanges: true,
          changeNotes,
        },
      });

      await prisma.activityLog.create({
        data: {
          orderId: id,
          userId: user.id,
          action: 'CAMBIOS',
          details: `Solicitud de cambios por ${user.name}: "${changeNotes}"`,
        },
      });

      if (order.postProducerId) {
        await sendNotification({
          userId: order.postProducerId,
          orderId: id,
          type: 'CHANGES_REQUESTED',
          title: `⚠️ Cambios Solicitados en ${order.orderNumber}`,
          message: `${user.name} ha solicitado ajustes en ${order.product}: "${changeNotes}". Por favor revisa y vuelve a entregar.`,
          userPhone: order.postProducer?.phone,
          userEmail: order.postProducer?.email,
          orderNumber: order.orderNumber,
        });
      }

      return NextResponse.json({ success: true, order: updatedOrder });
    }

    // 5. ACTION: APPROVE ORDER (Solicitante / Coordinador)
    if (action === 'APPROVE') {
      updatedOrder = await prisma.productionOrder.update({
        where: { id },
        data: {
          status: 'APROBADA',
          approved: true,
          approvedBy: user.name,
          approvedAt: new Date(),
        },
      });

      await prisma.activityLog.create({
        data: {
          orderId: id,
          userId: user.id,
          action: 'APROBADA',
          details: `Orden aprobada satisfactoriamente por ${user.name}`,
        },
      });

      if (order.postProducerId) {
        await sendNotification({
          userId: order.postProducerId,
          orderId: id,
          type: 'APPROVED',
          title: `🎉 ¡Orden Aprobada para Salir al Aire! ${order.orderNumber}`,
          message: `La orden ${order.orderNumber} (${order.product}) fue aprobada por ${user.name}.`,
          userPhone: order.postProducer?.phone,
          userEmail: order.postProducer?.email,
          orderNumber: order.orderNumber,
        });
      }

      return NextResponse.json({ success: true, order: updatedOrder });
    }

    // 6. ACTION: MARK AS ON AIR (AL_AIRE)
    if (action === 'SET_ON_AIR') {
      updatedOrder = await prisma.productionOrder.update({
        where: { id },
        data: { status: 'AL_AIRE' },
      });

      await prisma.activityLog.create({
        data: {
          orderId: id,
          userId: user.id,
          action: 'AL_AIRE',
          details: `Marcada como emitida / Al aire por ${user.name}`,
        },
      });

      return NextResponse.json({ success: true, order: updatedOrder });
    }

    // Generic update
    const {
      clientAgency,
      product,
      program,
      materialDeliveryDate,
      airDate,
      materialNotes,
      hasBrief,
      sponsorshipTypes,
      customSponsorship,
      voiceoverType,
      voiceoverText,
      packageValue,
      priority,
      status,
    } = body;

    const parsedPackageValue = packageValue !== undefined && packageValue !== null && packageValue !== ''
      ? parseFloat(String(packageValue).replace(/[^0-9.]/g, ''))
      : undefined;

    updatedOrder = await prisma.productionOrder.update({
      where: { id },
      data: {
        ...(clientAgency && { clientAgency: clientAgency.trim() }),
        ...(product && { product: product.trim() }),
        ...(program !== undefined && { program: program.trim() }),
        ...(materialDeliveryDate !== undefined && { materialDeliveryDate }),
        ...(airDate !== undefined && { airDate }),
        ...(materialNotes !== undefined && { materialNotes }),
        ...(hasBrief !== undefined && { hasBrief: Boolean(hasBrief) }),
        ...(sponsorshipTypes && { sponsorshipTypes: JSON.stringify(sponsorshipTypes) }),
        ...(customSponsorship !== undefined && { customSponsorship }),
        ...(voiceoverType && { voiceoverType }),
        ...(voiceoverText !== undefined && { voiceoverText }),
        ...(parsedPackageValue !== undefined && { packageValue: isNaN(parsedPackageValue) ? 0 : parsedPackageValue }),
        ...(priority && { priority }),
        ...(status && { status }),
      },
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error('Update order error:', error);
    return NextResponse.json({ error: 'Error al actualizar la orden' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo los Administradores pueden eliminar solicitudes de producción' }, { status: 403 });
    }

    const { id } = params;

    await prisma.notification.deleteMany({ where: { orderId: id } });
    await prisma.activityLog.deleteMany({ where: { orderId: id } });
    await prisma.orderFile.deleteMany({ where: { orderId: id } });

    await prisma.productionOrder.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Orden eliminada correctamente' });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json({ error: 'Error al eliminar la orden' }, { status: 500 });
  }
}
