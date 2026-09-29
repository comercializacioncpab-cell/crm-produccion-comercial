import { prisma } from './prisma';

interface CreateNotificationParams {
  userId: string;
  orderId?: string;
  type: string;
  title: string;
  message: string;
  userPhone?: string | null;
  userEmail?: string | null;
  orderNumber?: string;
}

export function generateWhatsAppUrl(phone: string | null | undefined, text: string): string | null {
  if (!phone) return null;
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

export async function sendNotification({
  userId,
  orderId,
  type,
  title,
  message,
  userPhone,
  userEmail,
  orderNumber,
}: CreateNotificationParams) {
  try {
    let whatsappUrl: string | null = null;
    if (userPhone) {
      const waText = `🔔 *CRM Producción Comercial*\n\n*${title}*\n${message}\n\nIngresa al sistema: https://crm-produccion-comercial.vercel.app`;
      whatsappUrl = generateWhatsAppUrl(userPhone, waText);
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        orderId,
        type,
        title,
        message,
        whatsappUrl,
      },
    });

    // If Resend or Email API Key is configured in environment, dispatch actual email
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey && userEmail) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'Producción Comercial <notificaciones@resend.dev>',
            to: [userEmail],
            subject: title,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                <h2 style="color: #0284c7;">🔔 ${title}</h2>
                <p style="font-size: 15px; color: #334155; line-height: 1.6;">${message}</p>
                <div style="margin-top: 24px;">
                  <a href="https://crm-produccion-comercial.vercel.app" style="background: #0284c7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                    Ver en el CRM
                  </a>
                </div>
              </div>
            `,
          }),
        });
      } catch (emailErr) {
        console.error('Error sending email via Resend:', emailErr);
      }
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}
