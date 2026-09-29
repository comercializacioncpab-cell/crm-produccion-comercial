import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        
        # Footer text
        footer_text = "Producción Comercial (EV) — Plataforma Digital de Solicitudes de Producción (SPs)"
        self.drawString(54, 30, footer_text)
        
        # Page number
        page_str = f"Página {self._pageNumber} de {page_count}"
        self.drawRightString(letter[0] - 54, 30, page_str)
        
        # Bottom decorative bar
        self.setStrokeColor(colors.HexColor("#0284c7"))
        self.setLineWidth(1)
        self.line(54, 42, letter[0] - 54, 42)
        self.restoreState()

def create_guide_pdf(output_pdf_path, image_path):
    doc = SimpleDocTemplate(
        output_pdf_path,
        pagesize=letter,
        leftMargin=45,
        rightMargin=45,
        topMargin=40,
        bottomMargin=55
    )

    styles = getSampleStyleSheet()

    # Custom styles
    header_title_style = ParagraphStyle(
        'HeaderTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0f172a'),
        alignment=TA_CENTER
    )

    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#0284c7'),
        alignment=TA_CENTER
    )

    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=10,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#334155'),
        alignment=TA_LEFT
    )

    body_bold = ParagraphStyle(
        'CustomBodyBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#0f172a')
    )

    callout_text = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#0369a1'),
        alignment=TA_CENTER
    )

    role_title = ParagraphStyle(
        'RoleTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor('#0f172a')
    )

    story = []

    # 1. Header Banner Image
    if os.path.exists(image_path):
        # 522 pt width matches letter width with 45 pt margins (612 - 90 = 522)
        img_width = 522
        img_height = 522 * (9 / 16) # 293.6 pt
        story.append(RLImage(image_path, width=img_width, height=img_height))
        story.append(Spacer(1, 14))

    # 2. Document Title
    story.append(Paragraph("MANUAL E INSTRUCTIVO DE USO", header_title_style))
    story.append(Spacer(1, 3))
    story.append(Paragraph("CRM DE SOLICITUDES DE PRODUCCIÓN COMERCIAL Y TELEVISIVA (EV)", subtitle_style))
    story.append(Spacer(1, 10))

    # 3. Access URL Highlight Box
    url_p = Paragraph(
        "<b>🌐 Enlace de Acceso a la Plataforma:</b><br/>"
        "<font size=12 color='#0284c7'><b>https://crm-produccion-comercial.vercel.app</b></font>",
        callout_text
    )
    url_table = Table([[url_p]], colWidths=[522])
    url_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f0f9ff')),
        ('BOX', (0,0), (-1,-1), 1.5, colors.HexColor('#bae6fd')),
        ('PADDING', (0,0), (-1,-1), 10),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(url_table)
    story.append(Spacer(1, 14))

    # 4. Section 1: User Registration
    story.append(Paragraph("1. Registro y Acceso de Nuevos Usuarios", section_heading))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e2e8f0"), spaceBefore=2, spaceAfter=8))
    
    reg_intro = Paragraph(
        "Cada miembro del equipo de ventas, coordinación y edición debe contar con su usuario individual para gestionar sus órdenes:",
        body_style
    )
    story.append(reg_intro)
    story.append(Spacer(1, 6))

    steps_data = [
        [
            Paragraph("<b>Paso 1</b>", body_bold),
            Paragraph("Ingresa al enlace del CRM y pulsa sobre <b>'Crear nuevo usuario'</b> (o ve a <b>/register</b>).", body_style)
        ],
        [
            Paragraph("<b>Paso 2</b>", body_bold),
            Paragraph("Ingresa tus datos reales: <b>Nombre y Apellido</b>, <b>Correo corporativo</b>, <b>Contraseña</b> y tu <b>Teléfono / WhatsApp</b> (imprescindible para recibir avisos de tus órdenes).", body_style)
        ],
        [
            Paragraph("<b>Paso 3</b>", body_bold),
            Paragraph(
                "Selecciona tu rol correspondiente:<br/>"
                "• <b>Ejecutiva de Ventas (Solicitante):</b> Creación y seguimiento de órdenes SP.<br/>"
                "• <b>Coordinadora de Producción:</b> Revisión, aprobación inicial y asignación de editores.<br/>"
                "• <b>Post-Productor:</b> Edición de video/audio, render y entrega final.",
                body_style
            )
        ],
        [
            Paragraph("<b>Paso 4</b>", body_bold),
            Paragraph("Haz clic en <b>'Registrarme'</b>. Tu cuenta quedará enviada al Administrador para su aprobación inmediata.", body_style)
        ]
    ]
    steps_table = Table(steps_data, colWidths=[65, 457])
    steps_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 0.8, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(steps_table)
    story.append(Spacer(1, 14))

    # Page Break for clean 2-page structure
    story.append(PageBreak())

    # 5. Section 2: Complete Workflow
    story.append(Paragraph("2. Flujo de Trabajo Operativo en el CRM (Paso a Paso)", section_heading))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e2e8f0"), spaceBefore=2, spaceAfter=8))

    workflow_data = [
        [
            Paragraph("<b>1. CREACIÓN DE SP<br/>(Ejecutiva de Ventas)</b>", role_title),
            Paragraph(
                "• Haz clic en <b>'+ Nueva Solicitud (SP)'</b>.<br/>"
                "• El sistema asigna automáticamente tu numeración correlativa (ej: <b>SP-AR-001</b>).<br/>"
                "• Selecciona la fecha de entrega y fecha al aire con el <b>Calendario Visual</b>.<br/>"
                "• Completa Cliente/Agencia, Producto, Programa, Auspicios y Guión de Locución.<br/>"
                "• Adjunta archivos de referencia (Brief en PDF, logotipos en PNG/AI, audios).<br/>"
                "• Al guardar, la <b>Coordinadora</b> recibe una notificación automática.",
                body_style
            )
        ],
        [
            Paragraph("<b>2. REVISIÓN Y ASIGNACIÓN<br/>(Coordinación)</b>", role_title),
            Paragraph(
                "• La Coordinadora abre la orden y verifica que los materiales y fechas sean viables.<br/>"
                "• Selecciona al <b>Post-Productor</b> responsable y define la prioridad (Media / Alta / Urgente).<br/>"
                "• El editor asignado recibe el aviso con el botón directo para abrir la orden.",
                body_style
            )
        ],
        [
            Paragraph("<b>3. POST-PRODUCCIÓN<br/>(Editor / Motion)</b>", role_title),
            Paragraph(
                "• El Post-Productor pasa la orden a <b>'En Proceso'</b> y descarga los materiales de trabajo.<br/>"
                "• Una vez finalizado el render o la edición, sube el archivo final o coloca el enlace de descarga (Google Drive / WeTransfer) y marca la SP como <b>'Resuelta'</b>.<br/>"
                "• La Ejecutiva y la Coordinación reciben la notificación con el enlace de descarga.",
                body_style
            )
        ],
        [
            Paragraph("<b>4. APROBACIÓN Y EMISIÓN<br/>(Cierre y Salida al Aire)</b>", role_title),
            Paragraph(
                "• La Ejecutiva revisa el video final entregado.<br/>"
                "• Si requiere correcciones, solicita <b>'Con Cambios'</b> indicando los ajustes específicos.<br/>"
                "• Si está conforme, pulsa <b>'Aprobar SP'</b> y la orden queda lista para salir al aire.",
                body_style
            )
        ]
    ]

    wf_table = Table(workflow_data, colWidths=[150, 372])
    wf_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#f1f5f9')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('PADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(wf_table)
    story.append(Spacer(1, 14))

    # 6. Section 3: Password recovery & Admin assistance
    story.append(Paragraph("3. Asistencia y Recuperación de Contraseñas", section_heading))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e2e8f0"), spaceBefore=2, spaceAfter=8))

    support_p = Paragraph(
        "<b>¿Olvidaste tu contraseña?</b><br/>"
        "1. En la pantalla de inicio de sesión (<b>/login</b>), haz clic en <b>'¿Olvidaste tu contraseña?'</b>.<br/>"
        "2. Escribe tu correo registrado y pulsa <i>'Pedir Contraseña'</i>.<br/>"
        "3. El sistema te habilitará un botón de <b>WhatsApp Directo</b> con el Administrador.<br/>"
        "4. El Administrador puede ver tu clave registrada y enviártela al instante para que no tengas que crear una cuenta nueva.",
        body_style
    )
    support_table = Table([[support_p]], colWidths=[522])
    support_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f0fdf4')),
        ('BOX', (0,0), (-1,-1), 1.2, colors.HexColor('#bbf7d0')),
        ('PADDING', (0,0), (-1,-1), 10),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(support_table)

    # Build PDF
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully created at: {output_pdf_path}")

if __name__ == '__main__':
    img_path = '/Users/xavieruraga/.gemini/antigravity/brain/c9a1e861-b477-4974-b8c3-1dc07e70e4c9/bienvenida_crm_produccion_1790711072986.jpg'
    
    # 1. Save in artifact directory
    out_artifact = '/Users/xavieruraga/.gemini/antigravity/brain/c9a1e861-b477-4974-b8c3-1dc07e70e4c9/Instructivo_CRM_Produccion_Comercial.pdf'
    create_guide_pdf(out_artifact, img_path)

    # 2. Save in Next.js public directory for web download
    out_public = '/Users/xavieruraga/.gemini/antigravity/scratch/agency-crm-orders/public/Instructivo_CRM_Produccion_Comercial.pdf'
    create_guide_pdf(out_public, img_path)
