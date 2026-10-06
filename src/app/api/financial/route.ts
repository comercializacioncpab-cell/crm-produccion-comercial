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
        postProducer: {
          select: { id: true, name: true, initials: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let totalRevenue = 0;
    const executiveMap: Record<string, { id: string; name: string; email: string; initials: string; totalRevenue: number; count: number }> = {};
    const clientMap: Record<string, { clientAgency: string; totalRevenue: number; count: number }> = {};
    const statusMap: Record<string, { status: string; totalRevenue: number; count: number }> = {};
    const monthlyMap: Record<string, { monthKey: string; monthLabel: string; totalRevenue: number; count: number }> = {};

    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    for (const order of orders) {
      const val = order.packageValue || 0;
      totalRevenue += val;

      // Executive grouping
      const creatorId = order.creatorId;
      if (!executiveMap[creatorId]) {
        executiveMap[creatorId] = {
          id: order.creator.id,
          name: order.creator.name,
          email: order.creator.email,
          initials: order.creator.initials,
          totalRevenue: 0,
          count: 0,
        };
      }
      executiveMap[creatorId].totalRevenue += val;
      executiveMap[creatorId].count += 1;

      // Client grouping
      const client = order.clientAgency || 'Sin Cliente';
      if (!clientMap[client]) {
        clientMap[client] = {
          clientAgency: client,
          totalRevenue: 0,
          count: 0,
        };
      }
      clientMap[client].totalRevenue += val;
      clientMap[client].count += 1;

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
        };
      }
      monthlyMap[mKey].totalRevenue += val;
      monthlyMap[mKey].count += 1;
    }

    const executiveList = Object.values(executiveMap).sort((a, b) => b.totalRevenue - a.totalRevenue);
    const clientList = Object.values(clientMap).sort((a, b) => b.totalRevenue - a.totalRevenue);
    const statusList = Object.values(statusMap).sort((a, b) => b.totalRevenue - a.totalRevenue);
    const monthlyList = Object.values(monthlyMap).sort((a, b) => b.monthKey.localeCompare(a.monthKey));

    return NextResponse.json({
      success: true,
      totalRevenue,
      totalOrders: orders.length,
      averageTicket: orders.length > 0 ? totalRevenue / orders.length : 0,
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
