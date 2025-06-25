import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function printAdminId() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@college.edu' },
    });
    if (!user) {
      console.log('No user found with email admin@college.edu');
      return;
    }
    console.log('User ID:', user.id);
    console.log('Role:', user.role);
  } catch (error) {
    console.error('Error fetching admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

printAdminId(); 