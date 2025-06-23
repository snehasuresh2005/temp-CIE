const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProjectDetails() {
  try {
    console.log('Checking project details...\n');

    // Get proj 2 details
    const project = await prisma.project.findFirst({
      where: {
        name: 'proj 2'
      },
      select: {
        id: true,
        name: true,
        status: true,
        type: true,
        course_id: true,
        created_by: true,
        accepted_by: true,
        components_needed: true,
      },
    });

    if (project) {
      console.log('Project Details:');
      console.log('================');
      console.log(`ID: ${project.id}`);
      console.log(`Name: ${project.name}`);
      console.log(`Status: ${project.status}`);
      console.log(`Type: ${project.type}`);
      console.log(`Course ID: ${project.course_id}`);
      console.log(`Created by: ${project.created_by}`);
      console.log(`Accepted by: ${project.accepted_by}`);
      console.log(`Components needed: ${project.components_needed.length}`);
      console.log(`Component IDs: ${project.components_needed.join(', ')}`);
    } else {
      console.log('Project "proj 2" not found');
    }

    // Also check all projects and their types
    console.log('\n\nAll Projects and their types:');
    console.log('==============================');

    const allProjects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        type: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    allProjects.forEach(project => {
      console.log(`${project.name}: ${project.type} (${project.status})`);
    });

  } catch (error) {
    console.error('Error checking project details:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProjectDetails(); 