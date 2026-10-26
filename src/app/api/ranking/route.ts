import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { sendNotification } from '@/lib/notifications';

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

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const selectedMonth = searchParams.get('month') || currentMonthKey;

    // Fetch all users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        initials: true,
      },
    });

    // Fetch all orders
    const orders = await prisma.productionOrder.findMany({
      include: {
        creator: { select: { id: true, name: true, email: true, phone: true, initials: true, role: true } },
        executive: { select: { id: true, name: true, email: true, phone: true, initials: true, role: true } },
        postProducer: { select: { id: true, name: true, email: true, phone: true, initials: true, role: true } },
        activityLogs: { select: { action: true, createdAt: true }, orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Available months list
    const monthsMap: Record<string, { key: string; label: string; count: number }> = {};
    // Ensure current month is available
    const currYear = now.getFullYear();
    const currMonthIdx = now.getMonth();
    monthsMap[currentMonthKey] = {
      key: currentMonthKey,
      label: `${MONTH_NAMES[currMonthIdx]} ${currYear}`,
      count: 0,
    };

    for (const ord of orders) {
      const d = new Date(ord.createdAt);
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const mLabel = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
      if (!monthsMap[mKey]) {
        monthsMap[mKey] = { key: mKey, label: mLabel, count: 0 };
      }
      monthsMap[mKey].count += 1;
    }

    const availableMonths = Object.values(monthsMap).sort((a, b) => b.key.localeCompare(a.key));

    // Filter orders by selectedMonth
    const filteredOrders = orders.filter((ord) => {
      const d = new Date(ord.createdAt);
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return mKey === selectedMonth;
    });

    // Aggregate Executive Ranking
    // Seed with all sales executives
    const executiveMap: Record<string, any> = {};
    allUsers
      .filter((u) => ['EJECUTIVA_DIGITAL', 'COORDINADORA_VENTAS', 'SOLICITANTE'].includes(u.role))
      .forEach((u) => {
        executiveMap[u.id] = {
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          initials: u.initials || u.name.slice(0, 2).toUpperCase(),
          role: u.role,
          commercialRevenue: 0,
          totalOrders: 0,
          tvOrders: 0,
          digitalOrders: 0,
          completedOrders: 0,
        };
      });

    // Aggregate Post-Producer Ranking
    // Seed with all post-producers / editors
    const postProducerMap: Record<string, any> = {};
    allUsers
      .filter((u) => ['POST_PRODUCTOR', 'PRODUCTOR_SENIOR', 'COORDINADOR_PRODUCTOR', 'CREATIVO_DIGITAL'].includes(u.role))
      .forEach((u) => {
        postProducerMap[u.id] = {
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          initials: u.initials || u.name.slice(0, 2).toUpperCase(),
          role: u.role,
          attendedOrders: 0,
          deliveredOrders: 0,
          approvedOrders: 0,
          tvCount: 0,
          digitalCount: 0,
          changesCount: 0,
          resolutionHoursSum: 0,
          resolutionCount: 0,
          avgResolutionHours: 0,
          avgResolutionFormatted: '—',
          completionRate: 0,
        };
      });

    for (const ord of filteredOrders) {
      const isTv = (ord.orderCategory || 'TV') === 'TV';
      const isDigital = ord.orderCategory === 'DIGITAL';
      const isDelivered = ['RESUELTA', 'ENTREGADO', 'APROBADA', 'AL_AIRE'].includes(ord.status) || ord.deliveredAt !== null;
      const isApproved = ord.status === 'APROBADA' || ord.status === 'AL_AIRE';

      // Executive stats
      const exec = ord.executive || ord.creator;
      if (exec) {
        if (!executiveMap[exec.id]) {
          executiveMap[exec.id] = {
            id: exec.id,
            name: exec.name,
            email: exec.email,
            phone: exec.phone,
            initials: exec.initials || exec.name.slice(0, 2).toUpperCase(),
            role: exec.role,
            commercialRevenue: 0,
            totalOrders: 0,
            tvOrders: 0,
            digitalOrders: 0,
            completedOrders: 0,
          };
        }
        executiveMap[exec.id].totalOrders += 1;
        if (isTv) executiveMap[exec.id].tvOrders += 1;
        if (isDigital) executiveMap[exec.id].digitalOrders += 1;
        if (isDelivered) executiveMap[exec.id].completedOrders += 1;
        if (!ord.isDemo) {
          executiveMap[exec.id].commercialRevenue += (ord.packageValue || 0);
        }
      }

      // Post-Producer stats
      if (ord.postProducerId) {
        const post = ord.postProducer;
        if (!postProducerMap[ord.postProducerId]) {
          postProducerMap[ord.postProducerId] = {
            id: ord.postProducerId,
            name: post?.name || 'Post Productor',
            email: post?.email,
            phone: post?.phone,
            initials: post?.initials || 'PP',
            role: post?.role || 'POST_PRODUCTOR',
            attendedOrders: 0,
            deliveredOrders: 0,
            approvedOrders: 0,
            tvCount: 0,
            digitalCount: 0,
            changesCount: 0,
            resolutionHoursSum: 0,
            resolutionCount: 0,
            avgResolutionHours: 0,
            avgResolutionFormatted: '—',
            completionRate: 0,
          };
        }

        const stat = postProducerMap[ord.postProducerId];
        stat.attendedOrders += 1;
        if (isTv) stat.tvCount += 1;
        if (isDigital) stat.digitalCount += 1;
        if (isDelivered) stat.deliveredOrders += 1;
        if (isApproved) stat.approvedOrders += 1;
        if ((ord.changesCount || 0) > 0 || ord.status === 'CON_CAMBIOS') {
          stat.changesCount += (ord.changesCount || 1);
        }

        // Resolution time
        if (isDelivered) {
          const logAssign = ord.activityLogs.find((l) => l.action === 'ASIGNADA');
          const startRef = logAssign ? new Date(logAssign.createdAt) : new Date(ord.createdAt);
          const endRef = ord.deliveredAt ? new Date(ord.deliveredAt) : new Date(ord.updatedAt);
          const diffMs = endRef.getTime() - startRef.getTime();
          if (diffMs > 0) {
            const hours = diffMs / (1000 * 60 * 60);
            stat.resolutionHoursSum += hours;
            stat.resolutionCount += 1;
          }
        }
      }
    }

    // Sort and calculate rank for executives
    const executiveRanking = Object.values(executiveMap)
      .sort((a: any, b: any) => {
        if (b.commercialRevenue !== a.commercialRevenue) {
          return b.commercialRevenue - a.commercialRevenue;
        }
        return b.totalOrders - a.totalOrders;
      })
      .map((item: any, idx: number) => ({
        ...item,
        rank: idx + 1,
        isWinner: idx === 0 && item.commercialRevenue > 0,
      }));

    // Sort and calculate rank for post-producers
    const postProducerRanking = Object.values(postProducerMap)
      .map((item: any) => {
        const avgHours = item.resolutionCount > 0 ? (item.resolutionHoursSum / item.resolutionCount) : 0;
        const completionRate = item.attendedOrders > 0 ? Math.round((item.deliveredOrders / item.attendedOrders) * 100) : 0;
        return {
          ...item,
          avgResolutionHours: Number(avgHours.toFixed(1)),
          avgResolutionFormatted: formatHoursToReadable(avgHours),
          completionRate,
        };
      })
      .sort((a: any, b: any) => {
        if (b.deliveredOrders !== a.deliveredOrders) {
          return b.deliveredOrders - a.deliveredOrders;
        }
        if (b.attendedOrders !== a.attendedOrders) {
          return b.attendedOrders - a.attendedOrders;
        }
        return a.avgResolutionHours - b.avgResolutionHours;
      })
      .map((item: any, idx: number) => ({
        ...item,
        rank: idx + 1,
        isWinner: idx === 0 && item.deliveredOrders > 0,
      }));

    const topExecutive = executiveRanking[0] || null;
    const topPostProducer = postProducerRanking[0] || null;

    // Check if month-end congratulatory notification should fire automatically
    // Conditions: day is 30, 31 (or last day of month), selectedMonth is currentMonthKey
    const currentDay = now.getDate();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const isMonthEnd = currentDay >= 30 || tomorrow.getDate() === 1;

    let autoNotificationSent = false;
    if (isMonthEnd && selectedMonth === currentMonthKey) {
      const monthTag = `[RANKING-${currentMonthKey}]`;
      const alreadyNotified = await prisma.notification.findFirst({
        where: {
          type: 'MONTHLY_RANKING_WINNER',
          message: { contains: monthTag },
        },
      });

      if (!alreadyNotified) {
        const selectedMonthLabel = monthsMap[selectedMonth]?.label || selectedMonth;

        // Notify top executive
        if (topExecutive && topExecutive.commercialRevenue > 0) {
          await sendNotification({
            userId: topExecutive.id,
            type: 'MONTHLY_RANKING_WINNER',
            title: `🏆 ¡Felicitaciones! Eres la #1 en Ventas de ${selectedMonthLabel}`,
            message: `¡Extraordinario trabajo! Has alcanzado el puesto #1 del Ranking Mensual de Ventas con una facturación comercial de $${topExecutive.commercialRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD en ${topExecutive.totalOrders} órdenes SP. ¡Felicitaciones por liderar el podio de Ecuavisa! ${monthTag}`,
            userPhone: topExecutive.phone,
            userEmail: topExecutive.email,
          });
        }

        // Notify top post-producer
        if (topPostProducer && topPostProducer.deliveredOrders > 0) {
          await sendNotification({
            userId: topPostProducer.id,
            type: 'MONTHLY_RANKING_WINNER',
            title: `🏆 ¡Felicitaciones! Eres el #1 en Producción de ${selectedMonthLabel}`,
            message: `¡Extraordinario rendimiento! Has alcanzado el puesto #1 del Ranking Mensual de Post-Producción con ${topPostProducer.deliveredOrders} SPs atendidas y entregadas a tiempo con excelente calidad. ¡Felicitaciones por liderar el podio! ${monthTag}`,
            userPhone: topPostProducer.phone,
            userEmail: topPostProducer.email,
          });
        }

        autoNotificationSent = true;
      }
    }

    return NextResponse.json({
      success: true,
      selectedMonth,
      monthLabel: monthsMap[selectedMonth]?.label || selectedMonth,
      availableMonths,
      isMonthEnd,
      autoNotificationSent,
      topExecutive,
      topPostProducer,
      executiveRanking,
      postProducerRanking,
    });
  } catch (error: any) {
    console.error('Error fetching monthly ranking:', error);
    return NextResponse.json({ error: error.message || 'Error al obtener el ranking mensual' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !['ADMIN', 'COORDINADOR', 'PRODUCTOR_SENIOR', 'COORDINADOR_PRODUCTOR', 'JEFE_MONETIZACION'].includes(user.role)) {
      return NextResponse.json({ error: 'Solo Coordinación y Administración pueden enviar notificaciones de reconocimiento.' }, { status: 403 });
    }

    const body = await req.json();
    const targetMonth = body.month;
    if (!targetMonth) {
      return NextResponse.json({ error: 'Falta especificar el mes objetivo (YYYY-MM)' }, { status: 400 });
    }

    // Get ranking for targetMonth
    const dummyReq = new Request(`http://localhost/api/ranking?month=${targetMonth}`);
    const rankingRes = await GET(dummyReq);
    const data = await rankingRes.json();

    if (!data.success) {
      return NextResponse.json({ error: data.error || 'No se pudo calcular el ranking' }, { status: 500 });
    }

    const { topExecutive, topPostProducer, monthLabel } = data;
    const monthTag = `[RANKING-MANUAL-${targetMonth}-${Date.now()}]`;
    const notificationsSent: string[] = [];

    // Notify top executive
    if (topExecutive && topExecutive.commercialRevenue > 0) {
      const notif = await sendNotification({
        userId: topExecutive.id,
        type: 'MONTHLY_RANKING_WINNER',
        title: `🏆 ¡Felicitaciones! Puesto #1 en Ventas de ${monthLabel}`,
        message: `¡Reconocimiento especial de Fin de Mes! Eres la #1 en el Ranking de Ventas de ${monthLabel} con $${topExecutive.commercialRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD facturados. ¡Todo el equipo te felicita por tu liderazgo comercial! ${monthTag}`,
        userPhone: topExecutive.phone,
        userEmail: topExecutive.email,
      });
      if (notif) notificationsSent.push(`Ejecutiva: ${topExecutive.name}`);
    }

    // Notify top post-producer
    if (topPostProducer && topPostProducer.deliveredOrders > 0) {
      const notif = await sendNotification({
        userId: topPostProducer.id,
        type: 'MONTHLY_RANKING_WINNER',
        title: `🏆 ¡Felicitaciones! Puesto #1 en Producción de ${monthLabel}`,
        message: `¡Reconocimiento especial de Fin de Mes! Eres el #1 en el Ranking de Post-Producción de ${monthLabel} con ${topPostProducer.deliveredOrders} SPs atendidas y entregadas con excelencia técnica. ¡Felicitaciones! ${monthTag}`,
        userPhone: topPostProducer.phone,
        userEmail: topPostProducer.email,
      });
      if (notif) notificationsSent.push(`Post-Productor: ${topPostProducer.name}`);
    }

    return NextResponse.json({
      success: true,
      message: `Reconocimientos de fin de mes enviados exitosamente para ${monthLabel}`,
      notificationsSent,
    });
  } catch (error: any) {
    console.error('Error sending monthly ranking recognition:', error);
    return NextResponse.json({ error: error.message || 'Error al enviar reconocimientos de ranking' }, { status: 500 });
  }
}
