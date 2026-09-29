const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data...');
  const passwordHash = await bcrypt.hash('123456', 10);

  // Clean tables
  await prisma.activityLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.orderFile.deleteMany({});
  await prisma.productionOrder.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Create Users with different Roles
  const adriana = await prisma.user.create({
    data: {
      name: 'Adriana Rojas',
      email: 'adriana.rojas@comercial.tv',
      password: passwordHash,
      role: 'SOLICITANTE',
      initials: 'AR',
      phone: '+593991234567',
    },
  });

  const carlos = await prisma.user.create({
    data: {
      name: 'Carlos Mendoza (Ventas)',
      email: 'carlos.mendoza@comercial.tv',
      password: passwordHash,
      role: 'SOLICITANTE',
      initials: 'CM',
      phone: '+593992345678',
    },
  });

  const mariana = await prisma.user.create({
    data: {
      name: 'Mariana Gomez (Coordinadora)',
      email: 'coordinacion@produccion.tv',
      password: passwordHash,
      role: 'COORDINADOR',
      initials: 'MG',
      phone: '+593993456789',
    },
  });

  const javier = await prisma.user.create({
    data: {
      name: 'Javier Post-Productor',
      email: 'javier.post@produccion.tv',
      password: passwordHash,
      role: 'POST_PRODUCTOR',
      initials: 'JP',
      phone: '+593994567890',
    },
  });

  const diego = await prisma.user.create({
    data: {
      name: 'Diego Editor FX',
      email: 'diego.fx@produccion.tv',
      password: passwordHash,
      role: 'POST_PRODUCTOR',
      initials: 'DF',
      phone: '+593995678901',
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: 'Administrador General',
      email: 'admin@produccion.tv',
      password: passwordHash,
      role: 'ADMIN',
      initials: 'AD',
      phone: '+593996789012',
    },
  });

  console.log('Users created successfully.');

  // 2. Create sample SP matching the user's Excel exactly (SP-AR-1128)
  const order1 = await prisma.productionOrder.create({
    data: {
      orderNumber: 'SP-AR-1128',
      consecutive: 1128,
      clientAgency: 'MARKPLAN',
      product: 'GARNIER',
      program: 'Novela 15h30 GYE Sorpresa del Destino',
      materialDeliveryDate: '18/09/2026',
      airDate: '22/09/2026',
      materialNotes: 'Material en alta resolución entregado por la agencia. Requiere animación de logotipo al inicio y cintillo con legal de 5 segundos.',
      hasBrief: true,
      sponsorshipTypes: JSON.stringify(['BILLBOARD_ESTRATEGICO', 'ANTIZAPING']),
      customSponsorship: 'Billboard Estratégico + Antizaping',
      voiceoverType: 'ESPECIFICA',
      voiceoverText: 'Garnier Fructis presenta el capítulo estelar de hoy. Brillo y nutrición para tu cabello.',
      status: 'ASIGNADA',
      priority: 'ALTA',
      creatorId: adriana.id,
      coordinatorId: mariana.id,
      postProducerId: javier.id,
    },
  });

  // Sample files for order 1
  await prisma.orderFile.create({
    data: {
      orderId: order1.id,
      uploaderId: adriana.id,
      fileType: 'INPUT_BRIEF',
      fileName: 'Brief_Garnier_Campana_Septiembre.pdf',
      filePath: '/uploads/samples/brief_garnier.pdf',
      fileSize: 1048576,
      fileMime: 'application/pdf',
      notes: 'Lineamientos de marca y colores corporativos',
    },
  });

  // Activity logs
  await prisma.activityLog.create({
    data: {
      orderId: order1.id,
      userId: adriana.id,
      action: 'CREADA',
      details: 'Solicitud creada por Adriana Rojas',
    },
  });

  await prisma.activityLog.create({
    data: {
      orderId: order1.id,
      userId: mariana.id,
      action: 'ASIGNADA',
      details: 'Asignada a Javier Post-Productor con prioridad ALTA',
    },
  });

  // Notifications
  await prisma.notification.create({
    data: {
      userId: javier.id,
      orderId: order1.id,
      type: 'ASSIGNED',
      title: 'Nueva SP Asignada: SP-AR-1128',
      message: 'Mariana te ha asignado la orden SP-AR-1128 (MARKPLAN / GARNIER) para salir al aire el 22/09/2026.',
      whatsappUrl: 'https://wa.me/593994567890?text=Hola%20Javier,%20se%20te%20ha%20asignado%20la%20orden%20SP-AR-1128%20(MARKPLAN%20/%20GARNIER)%20Fecha%20al%20aire:%2022/09/2026',
    },
  });

  // 3. Create a second sample order in RESUELTA status (to test completed delivery)
  const order2 = await prisma.productionOrder.create({
    data: {
      orderNumber: 'SP-CM-1129',
      consecutive: 1129,
      clientAgency: 'MCCANN ERICKSON',
      product: 'COCA-COLA SIN AZUCAR',
      program: 'Noticias Estelar 19h00',
      materialDeliveryDate: '19/09/2026',
      airDate: '23/09/2026',
      materialNotes: 'Cápsula estratégica de 30 segundos para corte comercial A.',
      hasBrief: true,
      sponsorshipTypes: JSON.stringify(['CAPSULA_ESTRATEGICA', 'ESPACIO_PUBLICITARIO']),
      voiceoverType: 'GENERICA',
      voiceoverText: 'Siente el sabor sin azúcar. Coca-Cola te invita a disfrutar cada momento.',
      status: 'RESUELTA',
      priority: 'URGENTE',
      creatorId: carlos.id,
      coordinatorId: mariana.id,
      postProducerId: diego.id,
      deliveryNotes: 'Render final completado en ProRes 422 y versión H.264 para preview web. Aprobación técnica OK.',
      deliveredAt: new Date(),
    },
  });

  await prisma.orderFile.create({
    data: {
      orderId: order2.id,
      uploaderId: diego.id,
      fileType: 'OUTPUT_DELIVERY',
      fileName: 'COCA_COLA_30S_MASTER_FINAL_1080P.mp4',
      filePath: '/uploads/samples/coca_cola_final.mp4',
      fileSize: 45000000,
      fileMime: 'video/mp4',
      externalUrl: 'https://drive.google.com/file/d/sample-coca-cola/view',
      notes: 'Master final con audio calibrado a -24 LUFS',
    },
  });

  await prisma.notification.create({
    data: {
      userId: carlos.id,
      orderId: order2.id,
      type: 'RESOLVED',
      title: '¡SP Resuelta! SP-CM-1129',
      message: 'Diego FX ha terminado y subido el material final de la orden SP-CM-1129 (COCA-COLA). Ya puedes revisarla y aprobarla.',
      whatsappUrl: 'https://wa.me/593992345678?text=Hola%20Carlos,%20tu%20orden%20SP-CM-1129%20ha%20sido%20resuelta%20y%20el%20video%20final%20est%C3%A1%20disponible%20para%20descargar.',
    },
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
