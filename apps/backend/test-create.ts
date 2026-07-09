import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = "test_create_" + Date.now() + "@test.com";
  const password = "password";
  const incomingRole = "TECHNICIEN";
  const companyId = ""; // This simulates what the frontend sends when no company is selected
  
  const hashedPassword = await bcrypt.hash(password, 12);
  
  const createData: any = {
    name: "Test User",
    email: email.toLowerCase(),
    password: hashedPassword,
    role: incomingRole,
    customRoleId: null,
    companyId: companyId ? Number(companyId) : null,
  };

  console.log("createData:", createData);

  try {
    const user = await prisma.user.create({
      data: createData
    });
    console.log("Success:", user);
  } catch (e) {
    console.error("Prisma Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
