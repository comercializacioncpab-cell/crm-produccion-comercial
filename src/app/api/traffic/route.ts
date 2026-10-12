import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getWorkloadStatus } from '@/lib/order-utils';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Post-producers and seniors/coordinators who can edit
    const postProducers = await prisma.user.findMany({
      where: {
        role: { in: ['POST_PRODUCTOR', 'PRODUCTOR_SENIOR', 'COORDINADOR_PRODUCTOR'] },
        status: 'APROBADO',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        initials: true,
        phone: true,
        avatar: true,
      },
      orderBy: { name: 'asc' },
    });

    // Active orders in pipeline (ASIGNADA, EN_PROCESO, CON_CAMBIOS)
    const activeOrders = await prisma.productionOrder.findMany({
      where: {
        status: { in: ['ASIGNADA', 'EN_PROCESO', 'CON_CAMBIOS'] },
      },
      select: {
        id: true,
        orderNumber: true,
        clientAgency: true,
        product: true,
        program: true,
        airDate: true,
        materialDeliveryDate: true,
        status: true,
        priority: true,
        postProducerId: true,
        secondaryPostProducerId: true,
        changesCount: true,
        createdAt: true,
        updatedAt: true,
        executive: { select: { id: true, name: true, initials: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // All orders of the current/next month for schedule view
    const upcomingOrders = await prisma.productionOrder.findMany({
      where: {
        status: { notIn: ['CANCELADA'] },
      },
      select: {
        id: true,
        orderNumber: true,
        clientAgency: true,
        product: true,
        program: true,
        airDate: true,
        materialDeliveryDate: true,
        status: true,
        priority: true,
        postProducerId: true,
        secondaryPostProducerId: true,
        deliveredAt: true,
        executive: { select: { id: true, name: true, initials: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 150,
    });

    // Map each post producer with their stats and assigned active orders
    const producersGrid = postProducers.map((prod) => {
      const assigned = activeOrders.filter(
        (o) => o.postProducerId === prod.id || o.secondaryPostProducerId === prod.id
      );
      const activeCount = assigned.length;
      const workload = getWorkloadStatus(activeCount);

      return {
        ...prod,
        activeCount,
        workload,
        orders: assigned,
      };
    });

    // Unassigned orders (status NUEVA or without postProducerId)
    const unassignedOrders = await prisma.productionOrder.findMany({
      where: {
        OR: [{ status: 'NUEVA' }, { postProducerId: null, status: { notIn: ['APROBADA', 'AL_AIRE', 'CANCELADA'] } }],
      },
      select: {
        id: true,
        orderNumber: true,
        clientAgency: true,
        product: true,
        program: true,
        airDate: true,
        materialDeliveryDate: true,
        status: true,
        priority: true,
        createdAt: true,
        executive: { select: { id: true, name: true, initials: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      producers: producersGrid,
      unassignedOrders,
      allUpcomingOrders: upcomingOrders,
      totalActiveOrders: activeOrders.length,
    });
  } catch (error: any) {
    console.error('Error fetching traffic grid:', error);
    return NextResponse.json({ error: 'Error al consultar la matriz de tráfico' }, { status: 500 });
  }
}
