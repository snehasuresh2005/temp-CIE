import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function assignCoordinator() {
  try {
    const domain = await prisma.domain.findFirst({ where: { name: 'Lab Components' } });
    const faculty = await prisma.faculty.findFirst({ include: { user: true } });
    if (!domain || !faculty) {
      console.log('Missing domain or faculty');
      process.exit(1);
    }
    await prisma.domainCoordinator.create({
      data: {
        domain_id: domain.id,
        faculty_id: faculty.id,
        assigned_by: faculty.user_id,
      }
    });
    console.log('Assigned', faculty.user.name, 'as coordinator for', domain.name);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignCoordinator(); 