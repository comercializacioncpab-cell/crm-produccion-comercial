import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendNotification } from '@/lib/notifications';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Por favor ingresa tu correo electrónico registrado' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const targetUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'No existe una cuenta registrada con este correo electrónico.' },
        { status: 404 }
      );
    }

    // Find Admins to notify
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
    });

    const adminPhone = admins.find((a) => a.phone)?.phone || '+593991234567';
    const cleanAdminPhone = adminPhone.replace(/[^0-9]/g, '');

    const currentPasswordInfo = targetUser.plainPassword
      ? `"${targetUser.plainPassword}"`
      : 'No registrada (puedes reasignarle una nueva)';

    // Send notifications to all admins
    for (const admin of admins) {
      await sendNotification({
        userId: admin.id,
        type: 'FORGOT_PASSWORD',
        title: '🔑 Solicitud de Recuperación de Contraseña',
        message: `El usuario ${targetUser.name} (${targetUser.email}) olvidó su contraseña. Su contraseña actual registrada es: ${currentPasswordInfo}. Contacto usuario: ${targetUser.phone || 'Sin WhatsApp'}.`,
        userPhone: admin.phone,
        userEmail: admin.email,
      });
    }

    // Pre-filled WhatsApp message for user to send to Admin
    const userMsg = `Hola Administrador, olvidé mi contraseña para ingresar al CRM de Producción Comercial con mi correo: ${targetUser.email}. ¿Podrías indicarme mi clave de acceso por favor?`;
    const whatsappUrl = `https://wa.me/${cleanAdminPhone}?text=${encodeURIComponent(userMsg)}`;

    return NextResponse.json({
      success: true,
      message: 'Se ha enviado una notificación al Administrador.',
      adminPhone,
      whatsappUrl,
      userName: targetUser.name,
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud de recuperación' },
      { status: 500 }
    );
  }
}
