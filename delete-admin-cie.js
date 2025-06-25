import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAdminCie() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@cie.edu' },
      include: { admin: true }
    });
    if (!user) {
      console.log('No user found with email admin@cie.edu');
      return;
    }
    if (user.admin) {
      await prisma.admin.delete({ where: { id: user.admin.id } });
      console.log('Deleted related admin profile.');
    }
    await prisma.user.delete({ where: { id: user.id } });
    console.log('Deleted user admin@cie.edu');
  } catch (error) {
    console.error('Error deleting admin@cie.edu:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAdminCie(); 