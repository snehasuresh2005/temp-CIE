const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixProjectStatus(projectId) {
  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      console.log(`❌ Project with ID ${projectId} not found.`);
      return;
    }
    console.log(`Current status of project '${project.name}' (ID: ${project.id}): ${project.status}`);
    if (project.status === 'ONGOING') {
      console.log('✅ Project is already ONGOING. No change needed.');
      return;
    }
    const updated = await prisma.project.update({
      where: { id: projectId },
      data: { status: 'ONGOING' },
    });
    console.log(`✅ Updated status of project '${updated.name}' (ID: ${updated.id}) to: ${updated.status}`);
  } catch (error) {
    console.error('Error updating project status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Replace with your actual project ID
const PROJECT_ID = process.argv[2] || '';
if (!PROJECT_ID) {
  console.log('Usage: node fix-project-status.js <project_id>');
  process.exit(1);
}
fixProjectStatus(PROJECT_ID); 