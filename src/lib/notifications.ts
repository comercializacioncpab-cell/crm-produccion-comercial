import { prisma } from './prisma';
import nodemailer from 'nodemailer';

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

async function sendActualEmail(to: string, subject: string, htmlContent: string) {
  // 1. Resend API (if configured)
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const fromEmail = process.env.EMAIL_FROM || 'Producción Comercial <onboarding@resend.dev>';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject,
          html: htmlContent,
        }),
      });
      const data = await res.json();
      console.log('Resend email result:', data);
      return;
    } catch (e) {
      console.error('Error sending email via Resend:', e);
    }
  }

  // 2. SMTP (Gmail, Outlook, or Corporate Mail Server)
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const fromAddress = process.env.SMTP_FROM || `"Producción Comercial EV" <${smtpUser}>`;

      await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        html: htmlContent,
      });
      console.log(`SMTP Email sent successfully to ${to}`);
      return;
    } catch (smtpErr) {
      console.error('Error sending email via SMTP:', smtpErr);
    }
  }
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

    // Save notification in database
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

    // Send actual email if recipient email exists
    if (userEmail) {
      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="display: inline-block; background: linear-gradient(135deg, #06b6d4, #2563eb); color: #ffffff; font-weight: 900; font-size: 20px; padding: 8px 16px; border-radius: 12px; margin-bottom: 8px;">
              EV
            </div>
            <h2 style="color: #0f172a; margin: 4px 0 0 0; font-size: 18px; font-weight: 800;">Producción Comercial</h2>
            <p style="color: #64748b; font-size: 12px; margin: 2px 0 0 0;">CRM de Solicitudes Publicitarias y Televisivas</p>
          </div>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #0284c7; margin: 0 0 10px 0; font-size: 16px; font-weight: 700;">🔔 ${title}</h3>
            <p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 0;">${message}</p>
          </div>

          <div style="text-align: center; margin-top: 24px;">
            <a href="https://crm-produccion-comercial.vercel.app" style="display: inline-block; background: #0284c7; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              Abrir Sistema CRM
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0 16px 0;" />
          <p style="text-align: center; font-size: 11px; color: #94a3b8; margin: 0;">
            Este es un mensaje automático de Producción Comercial. No responder a este correo.
          </p>
        </div>
      `;

      await sendActualEmail(userEmail, `[Producción Comercial] ${title}`, emailHtml);
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}
