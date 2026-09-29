import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo los Administradores pueden eliminar órdenes' }, { status: 403 });
    }

    const { orderIds } = await req.json();

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: 'No se enviaron órdenes para eliminar' }, { status: 400 });
    }

    // 1. Delete associated notifications, activity logs and files
    await prisma.notification.deleteMany({
      where: { orderId: { in: orderIds } },
    });
    await prisma.activityLog.deleteMany({
      where: { orderId: { in: orderIds } },
    });
    await prisma.orderFile.deleteMany({
      where: { orderId: { in: orderIds } },
    });

    // 2. Delete the orders
    const result = await prisma.productionOrder.deleteMany({
      where: { id: { in: orderIds } },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `${result.count} orden(es) eliminada(s) correctamente`,
    });
  } catch (error: any) {
    console.error('Bulk delete orders error:', error);
    return NextResponse.json({ error: 'Error al eliminar órdenes' }, { status: 500 });
  }
}
