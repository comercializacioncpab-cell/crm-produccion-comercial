import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const totalOrders = await prisma.productionOrder.count();
    const newOrders = await prisma.productionOrder.count({ where: { status: 'NUEVA' } });
    const inProduction = await prisma.productionOrder.count({ where: { status: { in: ['ASIGNADA', 'EN_PROCESO'] } } });
    const resolvedOrders = await prisma.productionOrder.count({ where: { status: 'RESUELTA' } });
    const approvedOrders = await prisma.productionOrder.count({ where: { status: { in: ['APROBADA', 'AL_AIRE'] } } });
    const withChanges = await prisma.productionOrder.count({ where: { status: 'CON_CAMBIOS' } });

    // Recent orders
    const recentOrders = await prisma.productionOrder.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { name: true, initials: true } },
        postProducer: { select: { name: true, initials: true } },
      },
    });

    return NextResponse.json({
      stats: {
        total: totalOrders,
        new: newOrders,
        inProduction,
        resolved: resolvedOrders,
        approved: approvedOrders,
        withChanges,
      },
      recentOrders,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
  }
}
