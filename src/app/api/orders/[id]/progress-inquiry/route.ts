import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { sendNotification } from '@/lib/notifications';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { action = 'ASK', question, answer, inquiryId } = body;

    const order = await prisma.productionOrder.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
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

    let inquiries: any[] = [];
    try {
      inquiries = order.progressInquiries ? JSON.parse(order.progressInquiries) : [];
    } catch {
      inquiries = [];
    }

    if (action === 'ASK') {
      const newInquiry = {
        id: `inq-${Date.now()}`,
        createdAt: new Date().toISOString(),
        askedByUserId: user.id,
        askedByUserName: user.name,
        question: question && question.trim() ? question.trim() : 'Solicito información sobre el avance y status actual de la orden.',
        status: 'PENDING',
      };
      inquiries.unshift(newInquiry);

      const updatedOrder = await prisma.productionOrder.update({
        where: { id: order.id },
        data: { progressInquiries: JSON.stringify(inquiries) },
        include: { creator: true, executive: true, postProducer: true, secondaryPostProducer: true },
      });

      await prisma.activityLog.create({
        data: {
          orderId: order.id,
          userId: user.id,
          action: 'CONSULTA_AVANCE',
          details: `Consulta de avance solicitada por ${user.name}: "${newInquiry.question}"`,
        },
      });

      // Notify assigned post-producers
      const postUsers = [order.postProducer, order.secondaryPostProducer].filter(Boolean);
      for (const pUser of postUsers) {
        if (pUser && pUser.id !== user.id) {
          await sendNotification({
            userId: pUser.id,
            orderId: order.id,
            type: 'INQUIRY',
            title: `🔔 Consulta de Avance: ${order.orderNumber}`,
            message: `${user.name} solicita status de avance en la SP ${order.orderNumber} (${order.clientAgency} - ${order.product}): "${newInquiry.question}". Por favor responde a la brevedad.`,
            userPhone: pUser.phone,
            userEmail: pUser.email,
            orderNumber: order.orderNumber,
          });
        }
      }

      return NextResponse.json({ success: true, order: updatedOrder, inquiries });
    }

    if (action === 'RESPOND') {
      if (!answer || !answer.trim()) {
        return NextResponse.json({ error: 'Debes escribir el detalle del avance antes de enviar.' }, { status: 400 });
      }

      let found = false;
      inquiries = inquiries.map((inq: any) => {
        if ((!inquiryId && inq.status === 'PENDING') || inq.id === inquiryId) {
          found = true;
          return {
            ...inq,
            status: 'RESPONDED',
            answer: answer.trim(),
            respondedAt: new Date().toISOString(),
            respondedByUserId: user.id,
            respondedByUserName: user.name,
          };
        }
        return inq;
      });

      if (!found) {
        inquiries.unshift({
          id: `inq-${Date.now()}`,
          createdAt: new Date().toISOString(),
          askedByUserId: order.executiveId || order.creatorId,
          askedByUserName: order.executive?.name || order.creator?.name || 'Ejecutiva',
          question: 'Actualización periódica de avance',
          status: 'RESPONDED',
          answer: answer.trim(),
          respondedAt: new Date().toISOString(),
          respondedByUserId: user.id,
          respondedByUserName: user.name,
        });
      }

      const updatedOrder = await prisma.productionOrder.update({
        where: { id: order.id },
        data: { progressInquiries: JSON.stringify(inquiries) },
        include: { creator: true, executive: true, postProducer: true, secondaryPostProducer: true },
      });

      await prisma.activityLog.create({
        data: {
          orderId: order.id,
          userId: user.id,
          action: 'RESPUESTA_AVANCE',
          details: `Reporte de avance emitido por ${user.name}: "${answer.trim()}"`,
        },
      });

      const recipients = [order.executive, order.creator].filter(Boolean);
      const uniqueRecipients = recipients.filter((r, idx, self) => r && self.findIndex(s => s?.id === r.id) === idx && r.id !== user.id);

      for (const target of uniqueRecipients) {
        if (target) {
          await sendNotification({
            userId: target.id,
            orderId: order.id,
            type: 'INQUIRY_REPLY',
            title: `📋 Reporte de Avance: ${order.orderNumber}`,
            message: `${user.name} (Post-Producción) ha respondido a la consulta de avance en ${order.orderNumber} (${order.product}): "${answer.trim()}".`,
            userPhone: target.phone,
            userEmail: target.email,
            orderNumber: order.orderNumber,
          });
        }
      }

      return NextResponse.json({ success: true, order: updatedOrder, inquiries });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error: any) {
    console.error('Progress inquiry error:', error);
    return NextResponse.json({ error: 'Error al procesar consulta de avance' }, { status: 500 });
  }
}
