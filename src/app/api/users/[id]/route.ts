import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { sendNotification } from '@/lib/notifications';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;

    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: {
        createdOrders: {
          orderBy: { createdAt: 'desc' },
          include: {
            postProducer: { select: { id: true, name: true, initials: true } },
          },
        },
        assignedOrders: {
          orderBy: { createdAt: 'desc' },
          include: {
            creator: { select: { id: true, name: true, initials: true } },
          },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const { password, plainPassword, ...safeUser } = targetUser;

    return NextResponse.json({
      user: {
        ...safeUser,
        plainPassword: user.role === 'ADMIN' ? (plainPassword || null) : undefined,
      },
    });
  } catch (error) {
    console.error('Error fetching user detail:', error);
    return NextResponse.json({ error: 'Error al obtener detalle del usuario' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo los Administradores pueden gestionar usuarios y contraseñas' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { action, role, newPassword, name, phone, initials, status } = body;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    let updateData: any = {};

    // 1. ACTION: APPROVE USER REGISTRATION
    if (action === 'APPROVE_USER') {
      const assignedRole = role || targetUser.requestedRole || 'SOLICITANTE';
      updateData = {
        status: 'APROBADO',
        role: assignedRole,
        approvedAt: new Date(),
        approvedById: currentUser.id,
      };

      // 🔔 Send immediate approval notification with WhatsApp link & Email
      await sendNotification({
        userId: targetUser.id,
        type: 'APPROVED',
        title: '🎉 ¡Tu cuenta en Producción Comercial ha sido Aprobada!',
        message: `El Administrador (${currentUser.name}) ha aprobado tu acceso con el rol de ${assignedRole}. Ya puedes ingresar con tu correo (${targetUser.email}) y contraseña.`,
        userPhone: targetUser.phone,
        userEmail: targetUser.email,
      });
    }
    // 2. ACTION: REJECT USER
    else if (action === 'REJECT_USER') {
      updateData = {
        status: 'RECHAZADO',
      };
    }
    // 3. ACTION: RESET PASSWORD
    else if (action === 'RESET_PASSWORD' || newPassword) {
      if (!newPassword || newPassword.length < 4) {
        return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 4 caracteres' }, { status: 400 });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
      updateData.plainPassword = newPassword;

      await sendNotification({
        userId: targetUser.id,
        type: 'APPROVED',
        title: '🔑 Tu contraseña ha sido actualizada',
        message: `El Administrador ha reasignado tu contraseña de acceso. Tu nueva contraseña es: ${newPassword}`,
        userPhone: targetUser.phone,
        userEmail: targetUser.email,
      });
    }
    // 4. GENERAL PROFILE UPDATE
    else {
      if (role) updateData.role = role;
      if (status) updateData.status = status;
      if (name) updateData.name = name.trim();
      if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
      if (initials) updateData.initials = initials.toUpperCase();
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        requestedRole: true,
        status: true,
        initials: true,
        phone: true,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo los Administradores pueden eliminar usuarios' }, { status: 403 });
    }

    const { id } = params;

    if (id === currentUser.id) {
      return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta de Administrador' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    await prisma.notification.deleteMany({ where: { userId: id } });
    await prisma.activityLog.deleteMany({ where: { userId: id } });
    await prisma.orderFile.deleteMany({ where: { uploaderId: id } });
    
    await prisma.productionOrder.deleteMany({ where: { creatorId: id } });
    await prisma.productionOrder.updateMany({
      where: { postProducerId: id },
      data: { postProducerId: null, status: 'NUEVA' },
    });

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Usuario eliminado correctamente' });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
  }
}
