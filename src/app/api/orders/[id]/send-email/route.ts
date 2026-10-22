import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { sendActualEmail } from '@/lib/notifications';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { recipientEmail, recipientName, messageNote, emailSubject } = body;

    if (!recipientEmail || typeof recipientEmail !== 'string' || !recipientEmail.includes('@')) {
      return NextResponse.json({ error: 'Ingresa un correo electrónico válido' }, { status: 400 });
    }

    let order = await prisma.productionOrder.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        creator: { select: { id: true, name: true, email: true, phone: true } },
        executive: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    // Auto-generate clientReviewToken if missing
    if (!order.clientReviewToken) {
      const generatedToken = `${order.orderNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString(36)}`;
      order = await prisma.productionOrder.update({
        where: { id: order.id },
        data: { clientReviewToken: generatedToken },
        include: {
          creator: { select: { id: true, name: true, email: true, phone: true } },
          executive: { select: { id: true, name: true, email: true, phone: true } },
        },
      });
    }

    // Determine host origin
    const host = req.headers.get('host') || 'crm-produccion-comercial.vercel.app';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const origin = `${protocol}://${host}`;

    const printPdfUrl = `${origin}/orders/${order.id}/print?token=${order.clientReviewToken}`;
    const reviewUrl = `${origin}/review/${order.clientReviewToken}`;

    // Parse digital data
    let digitalParsed: any = {};
    try {
      digitalParsed = typeof order.digitalData === 'string' ? JSON.parse(order.digitalData) : (order.digitalData || {});
    } catch {
      digitalParsed = {};
    }

    const networksStr = Array.isArray(digitalParsed?.networks) && digitalParsed.networks.length > 0
      ? digitalParsed.networks.join(', ')
      : 'Redes Sociales Oficiales Ecuavisa';

    const formatsStr = Array.isArray(digitalParsed?.formats) && digitalParsed.formats.length > 0
      ? digitalParsed.formats.join(', ')
      : 'Formatos Digitales';

    const executiveName = order.executive?.name || order.creator?.name || 'Comercial Ecuavisa';
    const executiveEmail = order.executive?.email || order.creator?.email || 'comercial@ecuavisa.com';
    const effectiveSubject = emailSubject?.trim() || `[Ecuavisa] Solicitud de Producción Digital ${order.orderNumber} - ${order.product}`;

    // HTML Email Template
    const htmlEmail = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${order.orderNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #022c22 0%, #064e3b 50%, #0f172a 100%); padding: 28px 24px; text-align: center; color: #ffffff; }
    .brand { font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #34d399; margin-bottom: 4px; }
    .title { font-size: 20px; font-weight: 800; margin: 0; }
    .order-pill { display: inline-block; background: #f37021; color: #ffffff; font-weight: 800; font-size: 13px; padding: 4px 14px; border-radius: 9999px; margin-top: 10px; }
    .content { padding: 28px 24px; }
    .greeting { font-size: 14px; line-height: 1.5; margin-bottom: 18px; }
    .note-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px 16px; margin-bottom: 20px; font-size: 13px; color: #166534; }
    .details-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
    .details-table td { padding: 9px 12px; border-bottom: 1px solid #f1f5f9; }
    .details-table td.label { font-weight: 700; color: #475569; width: 38%; background: #f8fafc; }
    .details-table td.value { font-weight: 600; color: #0f172a; }
    .cta-container { text-align: center; margin: 28px 0; }
    .btn-primary { display: inline-block; background: #059669; color: #ffffff !important; text-decoration: none; font-weight: 800; font-size: 14px; padding: 13px 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25); margin: 6px; }
    .btn-secondary { display: inline-block; background: #0f172a; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 13px; padding: 12px 22px; border-radius: 12px; margin: 6px; }
    .notice { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 12px 14px; font-size: 11px; color: #1e40af; line-height: 1.4; margin-top: 16px; }
    .footer { background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">Ecuavisa • Producción Comercial</div>
      <h1 class="title">SOLICITUD DE PRODUCCIÓN DIGITAL</h1>
      <div class="order-pill">${order.orderNumber}</div>
    </div>
    <div class="content">
      <div class="greeting">
        Estimado/a <strong>${recipientName || 'Contacto / Cliente'}</strong>,<br><br>
        Se adjunta el resumen y enlace oficial para la <strong>Solicitud de Producción Digital</strong> correspondiente a <strong>${order.product}</strong> para la marca o cliente <strong>${order.clientAgency}</strong>.
      </div>

      ${messageNote ? `
      <div class="note-box">
        <strong>Mensaje de ${executiveName}:</strong><br>
        ${messageNote.replace(/\n/g, '<br>')}
      </div>
      ` : ''}

      <table class="details-table">
        <tr>
          <td class="label">Código SP Digital:</td>
          <td class="value">${order.orderNumber}</td>
        </tr>
        <tr>
          <td class="label">Cliente / Marca:</td>
          <td class="value">${order.clientAgency}</td>
        </tr>
        <tr>
          <td class="label">Producto:</td>
          <td class="value">${order.product}</td>
        </tr>
        ${order.campaign ? `
        <tr>
          <td class="label">Campaña:</td>
          <td class="value">${order.campaign}</td>
        </tr>
        ` : ''}
        ${order.contentObjective ? `
        <tr>
          <td class="label">Objetivo del contenido:</td>
          <td class="value">${order.contentObjective}</td>
        </tr>
        ` : ''}
        <tr>
          <td class="label">Redes Sociales:</td>
          <td class="value">${networksStr}</td>
        </tr>
        <tr>
          <td class="label">Formatos Requeridos:</td>
          <td class="value">${formatsStr}</td>
        </tr>
        <tr>
          <td class="label">Fecha al Aire / Publicación:</td>
          <td class="value"><strong>${order.publishDate || order.airDate || 'Por coordinar'}</strong></td>
        </tr>
        <tr>
          <td class="label">Entrega de Materiales:</td>
          <td class="value">${order.materialDeliveryDate || 'Por coordinar'}</td>
        </tr>
        <tr>
          <td class="label">Ejecutiva Responsable:</td>
          <td class="value">${executiveName} (${executiveEmail})</td>
        </tr>
      </table>

      <div class="cta-container">
        <a href="${printPdfUrl}" target="_blank" class="btn-primary">
          📄 Ver Ficha Completa / Descargar PDF Oficial
        </a>
        <br>
        <a href="${reviewUrl}" target="_blank" class="btn-secondary">
          🔗 Revisar en Línea (Sin Login)
        </a>
      </div>

      <div class="notice">
        💡 <strong>Acceso Directo Sin Clave:</strong> Al hacer clic en los botones superiores, podrás visualizar la Ficha Oficial de Producción Digital en alta resolución y generar o imprimir el PDF oficial desde tu navegador, sin necesidad de tener cuenta ni contraseña en el CRM.
      </div>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Ecuavisa Comercialización & Producción Digital.<br>
      Este correo contiene un enlace de acceso seguro para la revisión del proyecto.
    </div>
  </div>
</body>
</html>
    `;

    // Attempt sending via server (SMTP / Resend)
    const sentViaServer = await sendActualEmail(recipientEmail, effectiveSubject, htmlEmail);

    // Activity Log entry
    await prisma.activityLog.create({
      data: {
        orderId: order.id,
        userId: user.id,
        action: 'MAIL_EXTERNO',
        details: `SP Digital ${order.orderNumber} enviada por correo a "${recipientEmail}" ${recipientName ? `(${recipientName})` : ''} por ${user.name}. Modo de acceso público activo.`,
      },
    });

    // Generate preformatted mailto URL as client-side fallback or companion
    const plainTextBody = `Estimado/a ${recipientName || 'Contacto'},\n\nTe comparto la Solicitud de Producción Digital ${order.orderNumber} para ${order.product} (${order.clientAgency}).\n\n${messageNote ? `Nota: ${messageNote}\n\n` : ''}Puedes ver la Ficha Oficial en formato PDF interactivo y descargarla directamente en el siguiente enlace (no requiere contraseña):\n${printPdfUrl}\n\nO revisar en línea:\n${reviewUrl}\n\nSaludos cordiales,\n${executiveName} - Ecuavisa`;

    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(effectiveSubject)}&body=${encodeURIComponent(plainTextBody)}`;

    return NextResponse.json({
      success: true,
      sentViaServer,
      printPdfUrl,
      reviewUrl,
      mailtoUrl,
      message: sentViaServer 
        ? `Correo oficial enviado exitosamente a ${recipientEmail}` 
        : `Enlace público generado correctamente para ${recipientEmail}. Puedes enviar el enlace o abrirlo en tu gestor de correo (Outlook/Gmail).`,
    });
  } catch (error: any) {
    console.error('Error sending order email to external recipient:', error);
    return NextResponse.json({ error: error.message || 'Error al procesar el envío por correo' }, { status: 500 });
  }
}
