const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listProjects() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { created_date: 'asc' },
    });
    if (projects.length === 0) {
      console.log('No projects found.');
      return;
    }
    console.log('Projects:');
    projects.forEach((project, idx) => {
      console.log(`${idx + 1}. ID: ${project.id} | Name: ${project.name} | Status: ${project.status}`);
    });
  } catch (error) {
    console.error('Error listing projects:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listProjects(); 