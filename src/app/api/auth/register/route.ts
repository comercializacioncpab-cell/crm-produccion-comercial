import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { formatInitials } from '@/lib/order-utils';
import { sendNotification } from '@/lib/notifications';

export async function POST(req: Request) {
  try {
    const { name, email, password, role, phone, initials } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nombre, email y contraseña son obligatorios' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'El correo electrónico ya está registrado' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userInitials = initials ? initials.toUpperCase() : formatInitials(name);
    const assignedRole = role || 'SOLICITANTE';

    // New registrations are created in PENDIENTE status awaiting Admin approval
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        plainPassword: password,
        role: assignedRole,
        requestedRole: assignedRole,
        status: 'PENDIENTE',
        initials: userInitials,
        phone: phone ? phone.trim() : null,
      },
    });

    // Notify Admins and Productor Senior
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'PRODUCTOR_SENIOR'] },
        status: 'APROBADO',
      },
    });

    for (const admin of admins) {
      await sendNotification({
        userId: admin.id,
        type: 'USER_APPROVAL_PENDING',
        title: '👤 Nuevo Registro Pendiente de Aprobación',
        message: `${user.name} (${user.email}) ha solicitado registrarse como ${assignedRole}. Revisa y aprueba su cuenta.`,
        userPhone: admin.phone,
      });
    }

    return NextResponse.json({
      success: true,
      pendingApproval: true,
      message: 'Registro recibido con éxito. Tu cuenta está pendiente de aprobación por el Administrador.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        requestedRole: user.requestedRole,
        status: user.status,
      },
    });
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Error al registrar usuario' }, { status: 500 });
  }
}
