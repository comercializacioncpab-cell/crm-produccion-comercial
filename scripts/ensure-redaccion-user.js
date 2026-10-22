const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'redaccion@ecuavisa.com';
  const plainPassword = 'Redaccion2026!';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    const updated = await prisma.user.update({
      where: { email },
      data: {
        name: 'Equipo de Redacción',
        role: 'REDACCION',
        status: 'APROBADO',
        initials: 'RD',
        password: hashedPassword,
        plainPassword: plainPassword,
      },
    });
    console.log('Usuario Redacción actualizado:', updated.email, updated.role);
  } else {
    const created = await prisma.user.create({
      data: {
        name: 'Equipo de Redacción',
        email,
        password: hashedPassword,
        plainPassword: plainPassword,
        role: 'REDACCION',
        status: 'APROBADO',
        initials: 'RD',
      },
    });
    console.log('Usuario Redacción creado:', created.email, created.role);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
