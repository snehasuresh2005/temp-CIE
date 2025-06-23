const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProjectComponents() {
  try {
    console.log('Checking project-component associations...\n');

    // Get all projects with their components
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        components_needed: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    console.log('Projects and their associated components:');
    console.log('==========================================');

    for (const project of projects) {
      console.log(`\nProject: ${project.name} (ID: ${project.id})`);
      console.log(`Status: ${project.status}`);
      console.log(`Components needed: ${project.components_needed.length}`);
      
      if (project.components_needed.length > 0) {
        // Get component details for each component ID
        const components = await prisma.labComponent.findMany({
          where: {
            id: {
              in: project.components_needed,
            },
          },
          select: {
            id: true,
            component_name: true,
          },
        });

        console.log('Associated components:');
        components.forEach(comp => {
          console.log(`  - ${comp.component_name} (ID: ${comp.id})`);
        });
      } else {
        console.log('  No components associated');
      }
    }

    // Also check components and their associated projects
    console.log('\n\nComponents and their associated projects:');
    console.log('==========================================');

    const components = await prisma.labComponent.findMany({
      select: {
        id: true,
        component_name: true,
      },
      orderBy: {
        component_name: 'asc',
      },
    });

    for (const component of components) {
      const associatedProjects = projects.filter(project => 
        project.components_needed.includes(component.id)
      );

      console.log(`\nComponent: ${component.component_name} (ID: ${component.id})`);
      console.log(`Associated projects: ${associatedProjects.length}`);
      
      if (associatedProjects.length > 0) {
        associatedProjects.forEach(project => {
          console.log(`  - ${project.name} (Status: ${project.status})`);
        });
      } else {
        console.log('  No projects associated');
      }
    }

  } catch (error) {
    console.error('Error checking project components:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProjectComponents(); 