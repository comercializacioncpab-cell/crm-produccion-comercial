import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

function formatHoursToReadable(hours: number): string {
  if (hours <= 0) return '0 hrs';
  if (hours < 1) {
    const mins = Math.round(hours * 60);
    return `${mins} min${mins === 1 ? '' : 's'}`;
  }
  if (hours < 24) {
    const wholeHours = Math.floor(hours);
    const mins = Math.round((hours - wholeHours) * 60);
    return mins > 0 ? `${wholeHours}h ${mins}m` : `${wholeHours} hrs`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days} día${days === 1 ? '' : 's'}`;
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'COORDINADOR')) {
      return NextResponse.json({ error: 'Acceso restringido: Solo para Coordinación y Administración' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get('month'); // e.g. '2026-09' or 'ALL'
    const postProducerParam = searchParams.get('postProducerId'); // specific ID or 'ALL'
    const executiveParam = searchParams.get('executiveId'); // specific ID or 'ALL'
    const clientParam = searchParams.get('clientAgency'); // specific client name or 'ALL'

    const postProducersList = await prisma.user.findMany({
      where: { role: 'POST_PRODUCTOR' },
      select: { id: true, name: true, email: true, phone: true, initials: true },
      orderBy: { name: 'asc' },
    });

    const orders = await prisma.productionOrder.findMany({
      include: {
        creator: {
          select: { id: true, name: true, email: true, initials: true },
        },
        executive: {
          select: { id: true, name: true, email: true, initials: true },
        },
        postProducer: {
          select: { id: true, name: true, email: true, phone: true, initials: true },
        },
        activityLogs: {
          select: { id: true, action: true, createdAt: true, details: true },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    // Collect all available months
    const availableMonthsMap: Record<string, { key: string; label: string; count: number }> = {};
    const availableExecutivesMap: Record<string, { id: string; name: string; initials: string; count: number }> = {};
    const availableClientsMap: Record<string, { name: string; count: number }> = {};

    for (const ord of orders) {
      const d = new Date(ord.createdAt);
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const mLabel = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      if (!availableMonthsMap[mKey]) {
        availableMonthsMap[mKey] = { key: mKey, label: mLabel, count: 0 };
      }
      availableMonthsMap[mKey].count += 1;

      // Executives
      const exec = ord.executive || ord.creator;
      if (exec) {
        if (!availableExecutivesMap[exec.id]) {
          availableExecutivesMap[exec.id] = { id: exec.id, name: exec.name, initials: exec.initials, count: 0 };
        }
        availableExecutivesMap[exec.id].count += 1;
      }

      // Clients
      const client = (ord.clientAgency || '').trim();
      if (client) {
        if (!availableClientsMap[client]) {
          availableClientsMap[client] = { name: client, count: 0 };
        }
        availableClientsMap[client].count += 1;
      }
    }

    const availableMonths = Object.values(availableMonthsMap).sort((a, b) => b.key.localeCompare(a.key));
    const availableExecutives = Object.values(availableExecutivesMap).sort((a, b) => a.name.localeCompare(b.name));
    const availableClients = Object.values(availableClientsMap).sort((a, b) => a.name.localeCompare(b.name));

    // Filter orders by month, post-producer, executive, and client if specified
    const filteredOrders = orders.filter((ord) => {
      let matchesMonth = true;
      if (monthParam && monthParam !== 'ALL') {
        const d = new Date(ord.createdAt);
        const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        matchesMonth = mKey === monthParam;
      }

      let matchesPost = true;
      if (postProducerParam && postProducerParam !== 'ALL') {
        matchesPost = ord.postProducerId === postProducerParam;
      }

      let matchesExecutive = true;
      if (executiveParam && executiveParam !== 'ALL') {
        const effectiveExecId = ord.executiveId || ord.creatorId;
        matchesExecutive = effectiveExecId === executiveParam;
      }

      let matchesClient = true;
      if (clientParam && clientParam !== 'ALL') {
        matchesClient = ord.clientAgency.toLowerCase().trim() === clientParam.toLowerCase().trim();
      }

      return matchesMonth && matchesPost && matchesExecutive && matchesClient;
    });

    // Compute metrics
    let totalReceived = filteredOrders.length;
    let totalDelivered = 0;
    let totalApproved = 0;
    let totalWithChanges = 0;
    let totalChangesSum = 0;
    let totalExtraCostOrders = 0;
    let totalPending = 0;

    let totalResolutionHoursSum = 0;
    let deliveredWithTimeCount = 0;

    const postProducerStatsMap: Record<string, {
      id: string;
      name: string;
      email: string;
      phone?: string | null;
      initials: string;
      assignedCount: number;
      deliveredCount: number;
      approvedCount: number;
      inProgressCount: number;
      changesCount: number;
      totalChangesReceived: number;
      resolutionHoursSum: number;
      resolutionCount: number;
    }> = {};

    // Initialize all post-producers in map
    for (const p of postProducersList) {
      postProducerStatsMap[p.id] = {
        id: p.id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        initials: p.initials,
        assignedCount: 0,
        deliveredCount: 0,
        approvedCount: 0,
        inProgressCount: 0,
        changesCount: 0,
        totalChangesReceived: 0,
        resolutionHoursSum: 0,
        resolutionCount: 0,
      };
    }

    const detailedOrders = filteredOrders.map((ord) => {
      const isDelivered = ord.status === 'RESUELTA' || ord.status === 'ENTREGADO' || ord.status === 'APROBADA' || ord.status === 'AL_AIRE' || Boolean(ord.deliveredAt);
      const isApproved = ord.status === 'APROBADA' || ord.status === 'AL_AIRE' || Boolean(ord.approved);
      const hasChanges = ord.hasChanges || (ord.changesCount && ord.changesCount > 0);

      if (isDelivered) totalDelivered += 1;
      if (isApproved) totalApproved += 1;
      if (hasChanges) {
        totalWithChanges += 1;
        totalChangesSum += (ord.changesCount || 1);
      }
      if (ord.extraCostAccepted || (ord.changesCount && ord.changesCount >= 4)) {
        totalExtraCostOrders += 1;
      }
      if (ord.status === 'NUEVA' || ord.status === 'ASIGNADA' || ord.status === 'EN_PROCESO' || ord.status === 'CON_CAMBIOS') {
        totalPending += 1;
      }

      // Calculate resolution time in hours
      let resolutionTimeHours: number | null = null;
      let resolutionTimeFormatted = 'En proceso';

      // Find assignment date or creation date
      const logAssign = ord.activityLogs.find((l) => l.action === 'ASIGNADA');
      const startRefDate = logAssign ? new Date(logAssign.createdAt) : new Date(ord.createdAt);

      if (isDelivered) {
        const endDate = ord.deliveredAt ? new Date(ord.deliveredAt) : ord.updatedAt ? new Date(ord.updatedAt) : new Date();
        const diffMs = endDate.getTime() - startRefDate.getTime();
        if (diffMs > 0) {
          resolutionTimeHours = diffMs / (1000 * 60 * 60);
          resolutionTimeFormatted = formatHoursToReadable(resolutionTimeHours);
          totalResolutionHoursSum += resolutionTimeHours;
          deliveredWithTimeCount += 1;
        }
      }

      // Post-Producer grouping
      if (ord.postProducerId) {
        const postStat = postProducerStatsMap[ord.postProducerId];
        if (postStat) {
          postStat.assignedCount += 1;
          if (isDelivered) postStat.deliveredCount += 1;
          if (isApproved) postStat.approvedCount += 1;
          if (ord.status === 'EN_PROCESO' || ord.status === 'ASIGNADA' || ord.status === 'CON_CAMBIOS') {
            postStat.inProgressCount += 1;
          }
          if (hasChanges) {
            postStat.changesCount += 1;
            postStat.totalChangesReceived += (ord.changesCount || 1);
          }
          if (resolutionTimeHours !== null) {
            postStat.resolutionHoursSum += resolutionTimeHours;
            postStat.resolutionCount += 1;
          }
        }
      }

      return {
        id: ord.id,
        orderNumber: ord.orderNumber,
        clientAgency: ord.clientAgency,
        product: ord.product,
        program: ord.program,
        airDate: ord.airDate,
        packageValue: ord.packageValue,
        status: ord.status,
        creatorName: ord.creator?.name || 'Ventas',
        executiveName: ord.executive?.name || ord.creator?.name || 'Ventas',
        executiveInitials: ord.executive?.initials || ord.creator?.initials || 'SP',
        isEnteredByCoordinator: Boolean(ord.executiveId && ord.creatorId !== ord.executiveId),
        postProducerName: ord.postProducer?.name || 'Sin Asignar',
        postProducerId: ord.postProducerId,
        createdAt: ord.createdAt,
        deliveredAt: ord.deliveredAt,
        approvedAt: ord.approvedAt,
        resolutionTimeHours,
        resolutionTimeFormatted,
        changesCount: ord.changesCount || 0,
        extraCostAccepted: Boolean(ord.extraCostAccepted),
      };
    });

    const avgResolutionHours = deliveredWithTimeCount > 0 ? (totalResolutionHoursSum / deliveredWithTimeCount) : 0;
    const avgResolutionTimeFormatted = formatHoursToReadable(avgResolutionHours);

    // Compute final post-producer summary list
    const postProducersSummary = Object.values(postProducerStatsMap)
      .filter((p) => postProducerParam === 'ALL' || !postProducerParam || p.id === postProducerParam || p.assignedCount > 0)
      .map((p) => {
        const avgHours = p.resolutionCount > 0 ? (p.resolutionHoursSum / p.resolutionCount) : 0;
        const completionRate = p.assignedCount > 0 ? Math.round((p.deliveredCount / p.assignedCount) * 100) : 0;
        return {
          id: p.id,
          name: p.name,
          email: p.email,
          phone: p.phone,
          initials: p.initials,
          assignedCount: p.assignedCount,
          deliveredCount: p.deliveredCount,
          approvedCount: p.approvedCount,
          inProgressCount: p.inProgressCount,
          changesCount: p.changesCount,
          totalChangesReceived: p.totalChangesReceived,
          avgResolutionHours: Number(avgHours.toFixed(1)),
          avgResolutionFormatted: formatHoursToReadable(avgHours),
          completionRate,
        };
      })
      .sort((a, b) => b.deliveredCount - a.deliveredCount || b.assignedCount - a.assignedCount);

    return NextResponse.json({
      success: true,
      selectedMonth: monthParam || 'ALL',
      selectedExecutive: executiveParam || 'ALL',
      selectedClient: clientParam || 'ALL',
      availableMonths,
      availableExecutives,
      availableClients,
      totalReceived,
      totalDelivered,
      totalApproved,
      totalWithChanges,
      totalChangesSum,
      totalExtraCostOrders,
      totalPending,
      avgResolutionHours: Number(avgResolutionHours.toFixed(1)),
      avgResolutionTimeFormatted,
      completionRate: totalReceived > 0 ? Math.round((totalDelivered / totalReceived) * 100) : 0,
      postProducersSummary,
      orders: detailedOrders,
    });
  } catch (error) {
    console.error('Error fetching monthly report:', error);
    return NextResponse.json({ error: 'Error al generar el reporte mensual' }, { status: 500 });
  }
}
