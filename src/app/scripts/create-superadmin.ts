import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'superadmin@lab.com';
  const password = 'SuperSecure123';
  const hashed = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('✅ Super Admin already exists:', email);
    return;
  }

  const superAdmin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email,
      password_hash: hashed,
      role: 'SuperAdmin',
      is_active: true,
    },
  });

  console.log('🚀 Super Admin created successfully:', superAdmin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
