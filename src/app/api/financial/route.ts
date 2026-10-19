import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'PRODUCTOR_SENIOR')) {
      return NextResponse.json({ error: 'Acceso restringido solo para Administradores y Productores Senior' }, { status: 403 });
    }

    const orders = await prisma.productionOrder.findMany({
      include: {
        creator: {
          select: { id: true, name: true, email: true, initials: true },
        },
        executive: {
          select: { id: true, name: true, email: true, initials: true },
        },
        postProducer: {
          select: { id: true, name: true, initials: true },
        },
        sourceDemo: {
          select: { id: true, orderNumber: true, clientAgency: true, product: true, isDemo: true, demoStatus: true, createdAt: true },
        },
        convertedOrders: {
          select: { id: true, orderNumber: true, clientAgency: true, product: true, packageValue: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let totalRevenue = 0;
    let totalCommercialOrders = 0;
    let totalDemos = 0;
    let totalDemosSold = 0;
    let totalDemosPending = 0;
    let revenueFromDemos = 0;

    // Métricas específicas TV (Tradicional)
    let tvRevenue = 0;
    let totalTvOrders = 0;
    let totalTvCommercialOrders = 0;
    let totalTvDemos = 0;
    let totalTvDemosSold = 0;
    let totalTvDemosPending = 0;
    let approvedTvRevenue = 0;
    let inProgressTvRevenue = 0;

    // Métricas específicas DIGITAL (Redes & Web)
    let digitalRevenue = 0;
    let totalDigitalOrders = 0;
    let totalDigitalCommercialOrders = 0;
    let totalDigitalDemos = 0;
    let totalDigitalDemosSold = 0;
    let totalDigitalDemosPending = 0;
    let approvedDigitalRevenue = 0;
    let inProgressDigitalRevenue = 0;

    const executiveMap: Record<string, { id: string; name: string; email: string; initials: string; totalRevenue: number; count: number; tvRevenue: number; tvCount: number; digitalRevenue: number; digitalCount: number; demosCount: number; demosSoldCount: number; demoRevenue: number }> = {};
    const clientMap: Record<string, { clientAgency: string; totalRevenue: number; count: number; tvRevenue: number; tvCount: number; digitalRevenue: number; digitalCount: number; demosCount: number; demosSoldCount: number }> = {};
    const statusMap: Record<string, { status: string; totalRevenue: number; count: number }> = {};
    const monthlyMap: Record<string, { monthKey: string; monthLabel: string; totalRevenue: number; count: number; demosCount: number; demosSoldCount: number; demoRevenue: number }> = {};

    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    const demosList: any[] = [];

    for (const order of orders) {
      const val = order.packageValue || 0;
      const isDemo = Boolean(order.isDemo);
      const isSoldDemo = isDemo && (order.demoStatus === 'VENDIDO' || (order.convertedOrders && order.convertedOrders.length > 0));
      const isDigital = order.orderCategory === 'DIGITAL';
      const isApproved = order.status === 'APROBADA' || order.status === 'AL_AIRE' || order.status === 'ENTREGADO' || order.status === 'RESUELTA';
      const isInProgress = order.status === 'EN_PROCESO' || order.status === 'ASIGNADA' || order.status === 'CON_CAMBIOS' || order.status === 'CAMBIOS_SOLICITADOS';

      if (isDigital) {
        totalDigitalOrders += 1;
        if (isDemo) {
          totalDigitalDemos += 1;
          if (isSoldDemo) totalDigitalDemosSold += 1;
          else totalDigitalDemosPending += 1;
        } else {
          totalDigitalCommercialOrders += 1;
          digitalRevenue += val;
          if (isApproved) approvedDigitalRevenue += val;
          if (isInProgress) inProgressDigitalRevenue += val;
        }
      } else {
        totalTvOrders += 1;
        if (isDemo) {
          totalTvDemos += 1;
          if (isSoldDemo) totalTvDemosSold += 1;
          else totalTvDemosPending += 1;
        } else {
          totalTvCommercialOrders += 1;
          tvRevenue += val;
          if (isApproved) approvedTvRevenue += val;
          if (isInProgress) inProgressTvRevenue += val;
        }
      }

      if (isDemo) {
        totalDemos += 1;
        if (isSoldDemo) {
          totalDemosSold += 1;
        } else {
          totalDemosPending += 1;
        }

        const convertedOrder = (order.convertedOrders && order.convertedOrders.length > 0) ? order.convertedOrders[0] : null;
        const genRevenue = order.convertedOrders?.reduce((acc: number, c: any) => acc + (c.packageValue || 0), 0) || 0;

        demosList.push({
          id: order.id,
          orderNumber: order.orderNumber,
          orderCategory: order.orderCategory || 'TV',
          clientAgency: order.clientAgency,
          product: order.product,
          program: order.program,
          creator: order.creator,
          executive: order.executive || order.creator,
          createdAt: order.createdAt,
          demoStatus: isSoldDemo ? 'VENDIDO' : 'PENDIENTE_VENTA',
          demoConvertedAt: order.demoConvertedAt,
          convertedOrderNumber: convertedOrder?.orderNumber || null,
          convertedOrderId: convertedOrder?.id || null,
          generatedRevenue: genRevenue,
        });
      } else {
        totalCommercialOrders += 1;
        totalRevenue += val;
        if (order.sourceDemoId) {
          revenueFromDemos += val;
        }
      }

      // Executive grouping
      const execUser = order.executive || order.creator;
      const execId = execUser?.id || order.creatorId;
      if (!executiveMap[execId]) {
        executiveMap[execId] = {
          id: execUser?.id || order.creator.id,
          name: execUser?.name || order.creator.name,
          email: execUser?.email || order.creator.email,
          initials: execUser?.initials || order.creator.initials,
          totalRevenue: 0,
          count: 0,
          tvRevenue: 0,
          tvCount: 0,
          digitalRevenue: 0,
          digitalCount: 0,
          demosCount: 0,
          demosSoldCount: 0,
          demoRevenue: 0,
        };
      }
      if (!isDemo) {
        executiveMap[execId].totalRevenue += val;
        executiveMap[execId].count += 1;
        if (isDigital) {
          executiveMap[execId].digitalRevenue += val;
          executiveMap[execId].digitalCount += 1;
        } else {
          executiveMap[execId].tvRevenue += val;
          executiveMap[execId].tvCount += 1;
        }
        if (order.sourceDemoId) {
          executiveMap[execId].demoRevenue += val;
        }
      } else {
        executiveMap[execId].demosCount += 1;
        if (isSoldDemo) {
          executiveMap[execId].demosSoldCount += 1;
        }
      }

      // Client grouping
      const client = order.clientAgency || 'Sin Cliente';
      if (!clientMap[client]) {
        clientMap[client] = {
          clientAgency: client,
          totalRevenue: 0,
          count: 0,
          tvRevenue: 0,
          tvCount: 0,
          digitalRevenue: 0,
          digitalCount: 0,
          demosCount: 0,
          demosSoldCount: 0,
        };
      }
      if (!isDemo) {
        clientMap[client].totalRevenue += val;
        clientMap[client].count += 1;
        if (isDigital) {
          clientMap[client].digitalRevenue += val;
          clientMap[client].digitalCount += 1;
        } else {
          clientMap[client].tvRevenue += val;
          clientMap[client].tvCount += 1;
        }
      } else {
        clientMap[client].demosCount += 1;
        if (isSoldDemo) {
          clientMap[client].demosSoldCount += 1;
        }
      }

      // Status grouping
      const status = order.status || 'NUEVA';
      if (!statusMap[status]) {
        statusMap[status] = {
          status,
          totalRevenue: 0,
          count: 0,
        };
      }
      statusMap[status].totalRevenue += val;
      statusMap[status].count += 1;

      // Monthly grouping
      const d = new Date(order.createdAt);
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const mLabel = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      if (!monthlyMap[mKey]) {
        monthlyMap[mKey] = {
          monthKey: mKey,
          monthLabel: mLabel,
          totalRevenue: 0,
          count: 0,
          demosCount: 0,
          demosSoldCount: 0,
          demoRevenue: 0,
        };
      }
      if (!isDemo) {
        monthlyMap[mKey].totalRevenue += val;
        monthlyMap[mKey].count += 1;
        if (order.sourceDemoId) {
          monthlyMap[mKey].demoRevenue += val;
        }
      } else {
        monthlyMap[mKey].demosCount += 1;
        if (isSoldDemo) {
          monthlyMap[mKey].demosSoldCount += 1;
        }
      }
    }

    const executiveList = Object.values(executiveMap).sort((a, b) => b.totalRevenue - a.totalRevenue);
    const clientList = Object.values(clientMap).sort((a, b) => b.totalRevenue - a.totalRevenue);
    const statusList = Object.values(statusMap).sort((a, b) => b.totalRevenue - a.totalRevenue);
    const monthlyList = Object.values(monthlyMap).sort((a, b) => b.monthKey.localeCompare(a.monthKey));

    const demoConversionRate = totalDemos > 0 ? Math.round((totalDemosSold / totalDemos) * 100) : 0;
    const averageTicket = totalCommercialOrders > 0 ? totalRevenue / totalCommercialOrders : 0;
    const averageTicketTv = totalTvCommercialOrders > 0 ? tvRevenue / totalTvCommercialOrders : 0;
    const averageTicketDigital = totalDigitalCommercialOrders > 0 ? digitalRevenue / totalDigitalCommercialOrders : 0;

    return NextResponse.json({
      success: true,
      totalRevenue,
      totalOrders: orders.length,
      totalCommercialOrders,
      averageTicket,

      // Métricas TV (Tradicional)
      tvRevenue,
      totalTvOrders,
      totalTvCommercialOrders,
      totalTvDemos,
      totalTvDemosSold,
      totalTvDemosPending,
      approvedTvRevenue,
      inProgressTvRevenue,
      averageTicketTv,

      // Métricas DIGITAL (Redes & Web)
      digitalRevenue,
      totalDigitalOrders,
      totalDigitalCommercialOrders,
      totalDigitalDemos,
      totalDigitalDemosSold,
      totalDigitalDemosPending,
      approvedDigitalRevenue,
      inProgressDigitalRevenue,
      averageTicketDigital,

      totalDemos,
      totalDemosSold,
      totalDemosPending,
      demoConversionRate,
      revenueFromDemos,
      demosList,
      executiveList,
      clientList,
      statusList,
      monthlyList,
      orders,
    });
  } catch (error) {
    console.error('Error fetching financial stats:', error);
    return NextResponse.json({ error: 'Error al calcular ingresos totales' }, { status: 500 });
  }
}
