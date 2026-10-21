import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { sendNotification } from '@/lib/notifications';
import { formatInitials } from '@/lib/order-utils';

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
    const executiveId = searchParams.get('executiveId');
    const category = searchParams.get('category'); // 'ALL', 'TV', 'DIGITAL'

    const where: any = {};

    if (category && category !== 'ALL') {
      where.orderCategory = category;
    }

    if (scope === 'my_orders') {
      where.OR = [
        { creatorId: user.id },
        { executiveId: user.id },
      ];
    } else if (scope === 'assigned_to_me') {
      where.OR = [
        { postProducerId: user.id },
        { secondaryPostProducerId: user.id },
      ];
    } else if (scope !== 'all') {
      // Default fallback when scope is omitted:
      if (user.role === 'SOLICITANTE' || user.role === 'EJECUTIVA_DIGITAL') {
        where.OR = [
          { creatorId: user.id },
          { executiveId: user.id },
        ];
      } else if (user.role === 'POST_PRODUCTOR') {
        where.OR = [
          { postProducerId: user.id },
          { secondaryPostProducerId: user.id },
        ];
      }
    }

    if (executiveId && executiveId !== 'ALL') {
      where.executiveId = executiveId;
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
        { campaign: { contains: search, mode: 'insensitive' } },
        { orderDescription: { contains: search, mode: 'insensitive' } },
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
          select: { id: true, fileName: true, fileType: true, filePath: true, externalUrl: true, version: true },
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
      orderCategory = 'TV',
      campaign,
      contentObjective,
      orderDescription,
      receptionDate,
      publishDate,
      digitalData,
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
      status: requestedStatus,
      isDraft: requestedIsDraft,
    } = body;

    const isDraft = requestedStatus === 'BORRADOR' || requestedIsDraft === true;
    const effectiveClientAgency = clientAgency ? clientAgency.trim() : (isDraft ? 'BORRADOR SIN CLIENTE' : '');
    const effectiveProduct = product ? product.trim() : (isDraft ? 'POR DEFINIR' : '');

    if (!effectiveClientAgency || !effectiveProduct) {
      return NextResponse.json({ error: 'Cliente/Marca y Producto son obligatorios' }, { status: 400 });
    }

    const isDigital = orderCategory === 'DIGITAL';
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

    // Default to creator if they are SOLICITANTE or EJECUTIVA_DIGITAL and no executive is explicitly set
    if (!targetExecutive && (user.role === 'SOLICITANTE' || user.role === 'EJECUTIVA_DIGITAL')) {
      targetExecutive = user;
    }

    // If user is coordinator/admin/senior and no executive is set, require it
    const isUserCoordinator = user.role === 'COORDINADOR' || user.role?.toUpperCase().includes('COORDINAD');
    if ((isUserCoordinator || user.role === 'ADMIN' || user.role === 'PRODUCTOR_SENIOR') && !targetExecutive) {
      return NextResponse.json(
        { error: 'Como perfil de Coordinación o Administración, debes seleccionar a qué Ejecutiva pertenece la cuenta.' },
        { status: 400 }
      );
    }

    const effectiveExecutiveId = targetExecutive ? targetExecutive.id : null;
    let userInitials = targetExecutive?.initials;
    if (!userInitials && targetExecutive?.name) {
      userInitials = formatInitials(targetExecutive.name);
    }
    if (!userInitials) {
      userInitials = user.initials || (user.name ? formatInitials(user.name) : 'SP');
    }
    userInitials = userInitials.toUpperCase().trim();

    // 🔢 Prefix: SPD for Digital, SP for TV
    const orderPrefix = isDigital ? 'SPD' : 'SP';

    // 🔢 Consecutive logic per executive prefix (e.g. SP-AR-001 or SPD-GR-001)
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

    // Ensure uniqueness across database
    while (await prisma.productionOrder.findUnique({ where: { orderNumber } })) {
      nextConsecutive++;
      paddedNumber = String(nextConsecutive).padStart(3, '0');
      orderNumber = `${orderPrefix}-${userInitials}-${paddedNumber}`;
    }

    const serializedDigitalData = typeof digitalData === 'object' && digitalData !== null
      ? JSON.stringify(digitalData)
      : (digitalData || null);

    // Create the order in PostgreSQL database
    const newOrder = await prisma.productionOrder.create({
      data: {
        orderNumber,
        consecutive: nextConsecutive,
        orderCategory: isDigital ? 'DIGITAL' : 'TV',
        clientAgency: effectiveClientAgency,
        product: effectiveProduct,
        campaign: campaign ? campaign.trim() : null,
        contentObjective: contentObjective ? contentObjective.trim() : null,
        orderDescription: orderDescription ? orderDescription.trim() : null,
        receptionDate: receptionDate || null,
        publishDate: publishDate || null,
        digitalData: serializedDigitalData,
        program: program ? program.trim() : (isDigital ? 'Digital / Redes Sociales' : ''),
        materialDeliveryDate: materialDeliveryDate || null,
        airDate: airDate || publishDate || null,
        downloadUrl: downloadUrl ? downloadUrl.trim() : null,
        materialNotes: materialNotes || null,
        hasBrief: Boolean(hasBrief),
        sponsorshipTypes: JSON.stringify(sponsorshipTypes),
        customSponsorship: customSponsorship || null,
        voiceoverType,
        voiceoverText: voiceoverText || null,
        packageValue: isNaN(parsedPackageValue) ? 0 : parsedPackageValue,
        status: isDraft ? 'BORRADOR' : 'NUEVA',
        priority,
        creatorId: user.id,
        executiveId: effectiveExecutiveId,
        coordinatorId: (user.role === 'COORDINADOR' || user.role === 'ADMIN' || user.role === 'PRODUCTOR_SENIOR' || user.role === 'COORDINADOR_PRODUCTOR') ? user.id : null,
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
    const coordinatorRoleTitle = user.role === 'COORDINADORA_VENTAS' ? 'Coordinación de Ventas' : 'Coordinación';
    const categoryTag = isDigital ? '📱 SP Digital (Redes & Web)' : '📺 SP Televisión';
    const activityLogDetails = isDraft
      ? `Borrador de Solicitud de Producción ${categoryTag} ${orderNumber} guardado por ${user.name}`
      : (targetExecutive && targetExecutive.id !== user.id
          ? `Solicitud de producción ${categoryTag} ${orderNumber} ingresada por ${coordinatorRoleTitle} (${user.name}) para la Ejecutiva ${targetExecutive.name}`
          : `Solicitud de producción ${categoryTag} ${orderNumber} creada por ${user.name} (${user.email})`);

    await prisma.activityLog.create({
      data: {
        orderId: newOrder.id,
        userId: user.id,
        action: isDraft ? 'BORRADOR' : 'CREADA',
        details: activityLogDetails,
      },
    });

    // 🔔 OBLIGATORY NOTIFICATION TO ALL COORDINATORS AND ADMINS (Only when NOT a draft)
    if (!isDraft) {
      const coordinators = await prisma.user.findMany({
        where: { role: { in: ['COORDINADOR', 'COORDINADOR_PRODUCTOR', 'ADMIN', 'PRODUCTOR_SENIOR'] } },
      });

      const executiveDisplayName = targetExecutive ? targetExecutive.name : user.name;
      const notifTitle = isDigital 
        ? `📱 ¡Nueva SP Digital Recibida! ${orderNumber}`
        : `📥 ¡Nueva SP Recibida! ${orderNumber}`;
      const dateLabel = isDigital ? (publishDate ? `Fecha publicación: ${publishDate}` : 'Fecha publicación: Por definir') : `Fecha al aire: ${airDate || 'Por definir'}`;

      for (const coord of coordinators) {
        await sendNotification({
          userId: coord.id,
          orderId: newOrder.id,
          type: 'NEW_SP',
          title: notifTitle,
          message: `${executiveDisplayName} ha emitido la orden ${categoryTag} ${orderNumber} para ${effectiveClientAgency} (${effectiveProduct}). ${dateLabel}. Entra al CRM para asignarla a un post-productor.`,
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
          message: `Coordinación (${user.name}) ha registrado la orden ${categoryTag} ${orderNumber} para tu cliente ${effectiveClientAgency} (${effectiveProduct}).`,
          userPhone: targetExecutive.phone,
          userEmail: targetExecutive.email,
          orderNumber,
        });
      }
    }

    return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Error al registrar la orden' }, { status: 500 });
  }
}
