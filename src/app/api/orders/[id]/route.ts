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
        executive: {
          select: { id: true, name: true, initials: true, email: true, phone: true, role: true },
        },
        postProducer: {
          select: { id: true, name: true, initials: true, email: true, phone: true, role: true },
        },
        secondaryPostProducer: {
          select: { id: true, name: true, initials: true, email: true, phone: true, role: true },
        },
        sourceDemo: {
          select: { id: true, orderNumber: true, clientAgency: true, product: true, isDemo: true, demoStatus: true, createdAt: true },
        },
        convertedOrders: {
          select: { id: true, orderNumber: true, clientAgency: true, product: true, packageValue: true, status: true, createdAt: true },
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
        executive: true,
        postProducer: true,
        secondaryPostProducer: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    let updatedOrder;

    // 1. ACTION: ASSIGN POST-PRODUCER (Coordinator / Admin)
    if (action === 'ASSIGN') {
      const { postProducerId, secondaryPostProducerId, priority } = body;
      const targetPost = await prisma.user.findUnique({ where: { id: postProducerId } });
      if (!targetPost) {
        return NextResponse.json({ error: 'Post-Productor principal no encontrado' }, { status: 400 });
      }

      let targetSecondary = null;
      if (secondaryPostProducerId) {
        targetSecondary = await prisma.user.findUnique({ where: { id: secondaryPostProducerId } });
      }

      updatedOrder = await prisma.productionOrder.update({
        where: { id },
        data: {
          postProducerId,
          secondaryPostProducerId: secondaryPostProducerId || null,
          coordinatorId: user.id,
          status: 'ASIGNADA',
          ...(priority && { priority }),
        },
        include: { creator: true, postProducer: true, secondaryPostProducer: true, files: true, activityLogs: true },
      });

      const assignDetails = targetSecondary
        ? `Asignada por ${user.name} a ${targetPost.name} (Principal / Seguimiento) y ${targetSecondary.name} (Editor Adicional).`
        : `Asignada por ${user.name} a ${targetPost.name} (Principal).`;

      await prisma.activityLog.create({
        data: {
          orderId: id,
          userId: user.id,
          action: 'ASIGNADA',
          details: assignDetails,
        },
      });

      // 🔔 NOTIFY 1: Post-Productor Principal (Lead tracker)
      await sendNotification({
        userId: targetPost.id,
        orderId: id,
        type: 'ASSIGNED',
        title: `🎯 Tienes una nueva asignación: ${order.orderNumber}`,
        message: `${user.name} te ha asignado como Editor Principal de la orden ${order.orderNumber} (${order.clientAgency} - ${order.product}). Fecha al aire: ${order.airDate || 'Por definir'}.${targetSecondary ? ` Editor Adicional asignado: ${targetSecondary.name}.` : ''}`,
        userPhone: targetPost.phone,
        userEmail: targetPost.email,
        orderNumber: order.orderNumber,
      });

      // 🔔 NOTIFY 2: Editor Adicional (if assigned)
      if (targetSecondary) {
        await sendNotification({
          userId: targetSecondary.id,
          orderId: id,
          type: 'ASSIGNED',
          title: `🎯 Asignación como Editor Adicional: ${order.orderNumber}`,
          message: `${user.name} te ha asignado como Editor Adicional para apoyar en la orden estratégica ${order.orderNumber} (${order.clientAgency} - ${order.product}). Editor Principal (a cargo del seguimiento): ${targetPost.name}. Fecha al aire: ${order.airDate || 'Por definir'}.`,
          userPhone: targetSecondary.phone,
          userEmail: targetSecondary.email,
          orderNumber: order.orderNumber,
        });
      }

      // 🔔 NOTIFY 3: Ejecutiva Solicitante
      await sendNotification({
        userId: order.creatorId,
        orderId: id,
        type: 'ASSIGNED',
        title: `📋 Tu Solicitud ${order.orderNumber} ha sido Asignada`,
        message: `Tu orden ${order.orderNumber} (${order.product}) fue asignada al post-productor ${targetPost.name}${targetSecondary ? ` y al editor adicional ${targetSecondary.name}` : ''} para su edición.`,
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
          details: `Orden recibida e iniciados los trabajos de post-producción por ${user.name}.`,
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

      // Only create orderFile if an external link is provided and no file was already uploaded via /api/orders/[id]/files
      if (externalUrl && !fileUrl) {
        await prisma.orderFile.create({
          data: {
            orderId: id,
            uploaderId: user.id,
            fileType: 'OUTPUT_DELIVERY',
            fileName: fileName || 'Enlace Master (Nube)',
            filePath: '',
            fileSize: 0,
            fileMime: 'text/html',
            externalUrl: externalUrl,
            notes: deliveryNotes || 'Material final entregado en enlace externo',
          },
        });
      }

      await prisma.activityLog.create({
        data: {
          orderId: id,
          userId: user.id,
          action: 'ENTREGADA',
          details: `Material final entregado por ${user.name}. Listo para revisión.`,
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
      const { changeNotes, acceptExtraCost } = body;

      if (!changeNotes) {
        return NextResponse.json({ error: 'Debes especificar las correcciones solicitadas' }, { status: 400 });
      }

      const currentCount = order.changesCount || 0;
      const nextCount = currentCount + 1;

      // Check if this is the 4th or subsequent change and cost wasn't accepted yet
      if (nextCount >= 4 && !acceptExtraCost) {
        return NextResponse.json({
          error: 'Esta es la 4ª (o superior) solicitud de cambio. A partir de este cambio cuenta con un costo adicional de $200 USD por cada cambio. Debes aceptar el costo adicional para continuar.',
          requiresCostApproval: true,
          nextCount,
          costPerChange: 200,
        }, { status: 400 });
      }

      updatedOrder = await prisma.productionOrder.update({
        where: { id },
        data: {
          status: 'CON_CAMBIOS',
          hasChanges: true,
          changeNotes,
          changesCount: nextCount,
          extraCostAccepted: nextCount >= 4 ? true : order.extraCostAccepted,
        },
      });

      const costNotice = nextCount >= 4 ? ' [⚠️ Aceptó Costo Adicional de $200 USD por 4°+ cambio]' : '';

      await prisma.activityLog.create({
        data: {
          orderId: id,
          userId: user.id,
          action: 'CAMBIOS',
          details: `Solicitud de Cambio #${nextCount} por ${user.name}: "${changeNotes}"${costNotice}`,
        },
      });

      if (order.postProducerId) {
        await sendNotification({
          userId: order.postProducerId,
          orderId: id,
          type: 'CHANGES_REQUESTED',
          title: `⚠️ Solicitud de Cambio #${nextCount} en ${order.orderNumber}`,
          message: `${user.name} ha solicitado el cambio #${nextCount} en ${order.product}: "${changeNotes}".${nextCount >= 4 ? ' (Cuenta con costo adicional de $200 USD aceptado por el cliente).' : ''}`,
          userPhone: order.postProducer?.phone,
          userEmail: order.postProducer?.email,
          orderNumber: order.orderNumber,
        });
      }

      if (order.secondaryPostProducerId && order.secondaryPostProducerId !== user.id) {
        await sendNotification({
          userId: order.secondaryPostProducerId,
          orderId: id,
          type: 'CHANGES_REQUESTED',
          title: `⚠️ Solicitud de Cambio #${nextCount} en ${order.orderNumber}`,
          message: `${user.name} ha solicitado el cambio #${nextCount} en ${order.product}: "${changeNotes}".`,
          userPhone: order.secondaryPostProducer?.phone,
          userEmail: order.secondaryPostProducer?.email,
          orderNumber: order.orderNumber,
        });
      }

      return NextResponse.json({ success: true, order: updatedOrder, changesCount: nextCount });
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

      if (order.secondaryPostProducerId && order.secondaryPostProducerId !== user.id) {
        await sendNotification({
          userId: order.secondaryPostProducerId,
          orderId: id,
          type: 'APPROVED',
          title: `🎉 ¡Orden Aprobada para Salir al Aire! ${order.orderNumber}`,
          message: `La orden ${order.orderNumber} (${order.product}) fue aprobada por ${user.name}.`,
          userPhone: order.secondaryPostProducer?.phone,
          userEmail: order.secondaryPostProducer?.email,
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

    // 7. ACTION: UPDATE DATES (Air date and/or material delivery date)
    if (action === 'UPDATE_DATES') {
      const { airDate, materialDeliveryDate, dateChangeReason } = body;

      const oldAirDate = order.airDate || 'Sin definir';
      const newAirDate = airDate || oldAirDate;

      updatedOrder = await prisma.productionOrder.update({
        where: { id },
        data: {
          ...(airDate !== undefined && { airDate }),
          ...(materialDeliveryDate !== undefined && { materialDeliveryDate }),
        },
      });

      const changeDetail = `Fecha al aire modificada de "${oldAirDate}" a "${newAirDate}" por ${user.name}${dateChangeReason ? ` (Motivo: ${dateChangeReason})` : ''}`;

      await prisma.activityLog.create({
        data: {
          orderId: id,
          userId: user.id,
          action: 'FECHA_MODIFICADA',
          details: changeDetail,
        },
      });

      // 🔔 Notify assigned post-producers if date changed
      if (order.postProducerId && order.postProducerId !== user.id) {
        await sendNotification({
          userId: order.postProducerId,
          orderId: id,
          type: 'UPDATED',
          title: `📅 Fecha Actualizada: ${order.orderNumber}`,
          message: `${user.name} actualizó la fecha al aire de la orden ${order.orderNumber} a: ${newAirDate}.`,
          userPhone: order.postProducer?.phone,
          userEmail: order.postProducer?.email,
          orderNumber: order.orderNumber,
        });
      }

      if (order.secondaryPostProducerId && order.secondaryPostProducerId !== user.id) {
        await sendNotification({
          userId: order.secondaryPostProducerId,
          orderId: id,
          type: 'UPDATED',
          title: `📅 Fecha Actualizada: ${order.orderNumber}`,
          message: `${user.name} actualizó la fecha al aire de la orden ${order.orderNumber} a: ${newAirDate}.`,
          userPhone: order.secondaryPostProducer?.phone,
          userEmail: order.secondaryPostProducer?.email,
          orderNumber: order.orderNumber,
        });
      }

      // 🔔 Notify executive / creator if coordinator/admin changed the date
      if (order.creatorId && order.creatorId !== user.id) {
        await sendNotification({
          userId: order.creatorId,
          orderId: id,
          type: 'UPDATED',
          title: `📅 Fecha Actualizada en tu SP: ${order.orderNumber}`,
          message: `${user.name} actualizó la fecha de entrega/al aire a: ${newAirDate}.`,
          userPhone: order.creator.phone,
          userEmail: order.creator.email,
          orderNumber: order.orderNumber,
        });
      }

      return NextResponse.json({ success: true, order: updatedOrder, message: 'Fechas actualizadas correctamente' });
    }

    // 8. ACTION: EDIT_ORDER (Full Edit by Executive, Coordinator, Admin)
    if (action === 'EDIT_ORDER') {
      const {
        clientAgency,
        product,
        program,
        materialDeliveryDate,
        airDate,
        downloadUrl,
        materialNotes,
        hasBrief,
        sponsorshipTypes,
        customSponsorship,
        voiceoverType,
        voiceoverText,
        packageValue,
        priority,
        executiveId,
        secondaryPostProducerId,
      } = body;

      const parsedPackageValue = packageValue !== undefined && packageValue !== null && packageValue !== ''
        ? parseFloat(String(packageValue).replace(/[^0-9.]/g, ''))
        : undefined;

      const updatedSponsorshipTypes = sponsorshipTypes !== undefined
        ? (Array.isArray(sponsorshipTypes) ? JSON.stringify(sponsorshipTypes) : typeof sponsorshipTypes === 'string' ? sponsorshipTypes : JSON.stringify([]))
        : undefined;

      updatedOrder = await prisma.productionOrder.update({
        where: { id },
        data: {
          ...(clientAgency !== undefined && { clientAgency: clientAgency.trim() }),
          ...(product !== undefined && { product: product.trim() }),
          ...(program !== undefined && { program: program.trim() }),
          ...(materialDeliveryDate !== undefined && { materialDeliveryDate }),
          ...(airDate !== undefined && { airDate }),
          ...(downloadUrl !== undefined && { downloadUrl: downloadUrl ? downloadUrl.trim() : null }),
          ...(materialNotes !== undefined && { materialNotes }),
          ...(hasBrief !== undefined && { hasBrief: Boolean(hasBrief) }),
          ...(updatedSponsorshipTypes !== undefined && { sponsorshipTypes: updatedSponsorshipTypes }),
          ...(customSponsorship !== undefined && { customSponsorship: customSponsorship.trim() }),
          ...(voiceoverType !== undefined && { voiceoverType }),
          ...(voiceoverText !== undefined && { voiceoverText }),
          ...(parsedPackageValue !== undefined && { packageValue: isNaN(parsedPackageValue) ? 0 : parsedPackageValue }),
          ...(priority !== undefined && { priority }),
          ...(executiveId !== undefined && { executiveId: executiveId || null }),
          ...(secondaryPostProducerId !== undefined && { secondaryPostProducerId: secondaryPostProducerId || null }),
        },
        include: {
          creator: true,
          executive: true,
          postProducer: true,
          secondaryPostProducer: true,
        },
      });

      // Track modification in activity log
      const changesSummary: string[] = [];
      if (clientAgency && clientAgency !== order.clientAgency) changesSummary.push(`Cliente: "${clientAgency}"`);
      if (product && product !== order.product) changesSummary.push(`Producto: "${product}"`);
      if (program !== undefined && program !== order.program) changesSummary.push(`Programa: "${program}"`);
      if (airDate && airDate !== order.airDate) changesSummary.push(`Fecha al aire: "${airDate}"`);
      if (sponsorshipTypes !== undefined) changesSummary.push(`Opciones Comerciales / PNTs actualizados`);
      if (parsedPackageValue !== undefined && parsedPackageValue !== order.packageValue) changesSummary.push(`Valor: $${parsedPackageValue}`);
      if (downloadUrl !== undefined && downloadUrl !== order.downloadUrl) changesSummary.push(`Link de descarga actualizado`);
      if (secondaryPostProducerId !== undefined && secondaryPostProducerId !== order.secondaryPostProducerId) changesSummary.push(`Editor Adicional asignado/modificado`);

      const detailsText = `SP editada por ${user.name} (${user.role}). ${changesSummary.length > 0 ? `Modificaciones: ${changesSummary.join(', ')}` : 'Información general y requerimientos comerciales actualizados.'}`;

      await prisma.activityLog.create({
        data: {
          orderId: id,
          userId: user.id,
          action: 'SP_MODIFICADA',
          details: detailsText,
        },
      });

      // 🔔 Notify assigned post-producers
      if (order.postProducerId && order.postProducerId !== user.id) {
        await sendNotification({
          userId: order.postProducerId,
          orderId: id,
          type: 'UPDATED',
          title: `📝 SP Modificada: ${order.orderNumber}`,
          message: `${user.name} ha editado los datos/requerimientos comerciales de la SP ${order.orderNumber} (${order.product}).`,
          userPhone: order.postProducer?.phone,
          userEmail: order.postProducer?.email,
          orderNumber: order.orderNumber,
        });
      }

      if (order.secondaryPostProducerId && order.secondaryPostProducerId !== user.id) {
        await sendNotification({
          userId: order.secondaryPostProducerId,
          orderId: id,
          type: 'UPDATED',
          title: `📝 SP Modificada: ${order.orderNumber}`,
          message: `${user.name} ha editado los requerimientos de la orden ${order.orderNumber} (${order.product}).`,
          userPhone: order.secondaryPostProducer?.phone,
          userEmail: order.secondaryPostProducer?.email,
          orderNumber: order.orderNumber,
        });
      }

      // 🔔 Notify executive / creator if coordinator edited
      if (order.creatorId && order.creatorId !== user.id) {
        await sendNotification({
          userId: order.creatorId,
          orderId: id,
          type: 'UPDATED',
          title: `📝 SP Modificada: ${order.orderNumber}`,
          message: `${user.name} actualizó los datos de tu orden ${order.orderNumber}.`,
          userPhone: order.creator?.phone,
          userEmail: order.creator?.email,
          orderNumber: order.orderNumber,
        });
      }

      return NextResponse.json({ success: true, order: updatedOrder, message: 'SP modificada exitosamente' });
    }

    // Generic update
    const {
      clientAgency,
      product,
      program,
      materialDeliveryDate,
      airDate,
      downloadUrl,
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
        ...(downloadUrl !== undefined && { downloadUrl: downloadUrl ? downloadUrl.trim() : null }),
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
    if (!user || (user.role !== 'ADMIN' && user.role !== 'PRODUCTOR_SENIOR')) {
      return NextResponse.json({ error: 'Solo los Administradores y Productores Senior pueden eliminar solicitudes de producción' }, { status: 403 });
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
