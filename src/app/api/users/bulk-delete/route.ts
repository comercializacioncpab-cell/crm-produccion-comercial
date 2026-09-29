import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo los Administradores pueden eliminar usuarios' }, { status: 403 });
    }

    const { userIds } = await req.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'No se enviaron usuarios para eliminar' }, { status: 400 });
    }

    // Exclude the current admin from deletion
    const safeUserIds = userIds.filter((id) => id !== currentUser.id);

    if (safeUserIds.length === 0) {
      return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta de Administrador' }, { status: 400 });
    }

    // 1. Clean notifications & logs for these users
    await prisma.notification.deleteMany({
      where: { userId: { in: safeUserIds } },
    });
    await prisma.activityLog.deleteMany({
      where: { userId: { in: safeUserIds } },
    });
    await prisma.orderFile.deleteMany({
      where: { uploaderId: { in: safeUserIds } },
    });

    // 2. Clean/unlink orders
    await prisma.productionOrder.deleteMany({
      where: { creatorId: { in: safeUserIds } },
    });
    await prisma.productionOrder.updateMany({
      where: { postProducerId: { in: safeUserIds } },
      data: { postProducerId: null, status: 'NUEVA' },
    });

    // 3. Delete users
    const result = await prisma.user.deleteMany({
      where: { id: { in: safeUserIds } },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `${result.count} usuario(s) eliminado(s) correctamente`,
    });
  } catch (error: any) {
    console.error('Bulk delete error:', error);
    return NextResponse.json({ error: 'Error al eliminar usuarios' }, { status: 500 });
  }
}
