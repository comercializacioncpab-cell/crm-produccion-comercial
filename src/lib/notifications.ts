import { prisma } from './prisma';

interface CreateNotificationParams {
  userId: string;
  orderId?: string;
  type: string;
  title: string;
  message: string;
  userPhone?: string | null;
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
  orderNumber,
}: CreateNotificationParams) {
  try {
    let whatsappUrl: string | null = null;
    if (userPhone) {
      const waText = `🔔 *CRM Producción Comercial*\n\n*${title}*\n${message}\n\nAccede al sistema para más detalles.`;
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

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}
