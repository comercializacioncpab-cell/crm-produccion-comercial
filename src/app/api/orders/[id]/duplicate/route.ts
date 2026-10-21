import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { formatInitials } from '@/lib/order-utils';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Debes iniciar sesión para duplicar una SP' }, { status: 401 });
    }

    const { id } = params;
    const sourceOrder = await prisma.productionOrder.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        executive: true,
        creator: true,
      },
    });

    if (!sourceOrder) {
      return NextResponse.json({ error: 'Orden original no encontrada' }, { status: 404 });
    }

    const isDigital = sourceOrder.orderCategory === 'DIGITAL';
    const orderPrefix = isDigital ? 'SPD' : 'SP';

    // Resolve executive and initials
    let targetExecutive: { id: string; name?: string | null; initials?: string | null } | null = sourceOrder.executive;
    if (!targetExecutive && (user.role === 'SOLICITANTE' || user.role === 'EJECUTIVA_DIGITAL')) {
      targetExecutive = user;
    }

    const effectiveExecutiveId = targetExecutive ? targetExecutive.id : (sourceOrder.executiveId || user.id);
    let userInitials = targetExecutive?.initials;
    if (!userInitials && targetExecutive?.name) {
      userInitials = formatInitials(targetExecutive.name);
    }
    if (!userInitials) {
      userInitials = user.initials || (user.name ? formatInitials(user.name) : 'SP');
    }
    userInitials = userInitials.toUpperCase().trim();

    // Find next consecutive for this executive & prefix
    const lastOrderForExecutive = await prisma.productionOrder.findFirst({
      where: {
        OR: [
          effectiveExecutiveId
            ? { OR: [{ executiveId: effectiveExecutiveId }, { creatorId: effectiveExecutiveId }] }
            : { creatorId: user.id },
          { orderNumber: { startsWith: `${orderPrefix}-${userInitials}-` } },
        ],
      },
      orderBy: { consecutive: 'desc' },
    });

    let nextConsecutive = (lastOrderForExecutive?.consecutive || 0) + 1;
    let paddedNumber = String(nextConsecutive).padStart(3, '0');
    let orderNumber = `${orderPrefix}-${userInitials}-${paddedNumber}`;

    // Guarantee uniqueness
    while (await prisma.productionOrder.findUnique({ where: { orderNumber } })) {
      nextConsecutive++;
      paddedNumber = String(nextConsecutive).padStart(3, '0');
      orderNumber = `${orderPrefix}-${userInitials}-${paddedNumber}`;
    }

    // Clean up digitalData: reset financialCosts so they can be freshly calculated for the new project,
    // but preserve platforms & formats matrix, accounts, special instructions and resources
    let clonedDigitalData = sourceOrder.digitalData;
    if (clonedDigitalData) {
      try {
        const parsed = JSON.parse(clonedDigitalData);
        delete parsed.financialCosts;
        clonedDigitalData = JSON.stringify(parsed);
      } catch {
        // Keep as is if parsing fails
      }
    }

    const todayDate = new Date().toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });

    // Create the duplicated order in database with status 'BORRADOR'
    const duplicatedOrder = await prisma.productionOrder.create({
      data: {
        orderNumber,
        consecutive: nextConsecutive,
        orderCategory: sourceOrder.orderCategory,
        clientAgency: sourceOrder.clientAgency,
        product: `${sourceOrder.product} (Copia)`,
        campaign: sourceOrder.campaign,
        contentObjective: sourceOrder.contentObjective,
        orderDescription: sourceOrder.orderDescription,
        receptionDate: todayDate,
        publishDate: null, // User will set the new publish date
        materialDeliveryDate: null,
        airDate: null,
        digitalData: clonedDigitalData,
        program: sourceOrder.program,
        downloadUrl: sourceOrder.downloadUrl,
        materialNotes: sourceOrder.materialNotes,
        hasBrief: sourceOrder.hasBrief,
        sponsorshipTypes: sourceOrder.sponsorshipTypes,
        customSponsorship: sourceOrder.customSponsorship,
        voiceoverType: sourceOrder.voiceoverType,
        voiceoverText: sourceOrder.voiceoverText,
        packageValue: sourceOrder.packageValue,
        status: 'BORRADOR', // Saved as draft ready to edit and submit
        priority: sourceOrder.priority,
        creatorId: user.id,
        executiveId: effectiveExecutiveId,
        isDemo: false,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        orderId: duplicatedOrder.id,
        userId: user.id,
        action: 'DUPLICADA',
        details: `SP generada por duplicación a partir de la orden original ${sourceOrder.orderNumber} por ${user.name}. Nuevo código asignado: ${orderNumber} (en estado BORRADOR).`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `¡SP duplicada exitosamente como ${orderNumber}!`,
      order: duplicatedOrder,
      redirectUrl: `/orders/${duplicatedOrder.id}`,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error duplicating order:', error);
    return NextResponse.json({ error: 'Error al duplicar la orden' }, { status: 500 });
  }
}
