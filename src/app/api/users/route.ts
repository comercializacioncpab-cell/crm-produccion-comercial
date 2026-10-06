import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');

    const where: any = {};
    if (role) {
      if (role === 'POST_PRODUCTOR') {
        where.role = { in: ['POST_PRODUCTOR', 'PRODUCTOR_SENIOR'] };
      } else if (role.includes(',')) {
        where.role = { in: role.split(',') };
      } else {
        where.role = role;
      }
    }
    if (status) {
      where.status = status;
    }

    const isAdmin = user.role === 'ADMIN' || user.role === 'PRODUCTOR_SENIOR';

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        plainPassword: isAdmin,
        requestedRole: true,
        status: true,
        initials: true,
        phone: true,
        approvedAt: true,
        createdAt: true,
        _count: {
          select: {
            createdOrders: true,
            assignedOrders: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const pendingCount = await prisma.user.count({
      where: { status: 'PENDIENTE' },
    });

    return NextResponse.json({ users, pendingCount });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
  }
}
