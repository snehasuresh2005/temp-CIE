import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('Checking database state...\n');
    
    // Check domains
    const domains = await prisma.domain.findMany();
    console.log('Domains:', domains.length);
    domains.forEach(d => console.log('-', d.name, '(ID:', d.id + ')'));
    
    // Check lab components with domains
    const components = await prisma.labComponent.findMany({
      include: { domain: true }
    });
    console.log('\nLab Components with domains:', components.filter(c => c.domain_id).length);
    components.filter(c => c.domain_id).forEach(c => {
      console.log('-', c.component_name, '->', c.domain?.name || 'No domain');
    });
    
    // Check coordinators
    const coordinators = await prisma.domainCoordinator.findMany({
      include: { 
        faculty: { include: { user: true } }, 
        domain: true 
      }
    });
    console.log('\nCoordinators:', coordinators.length);
    coordinators.forEach(c => {
      console.log('-', c.faculty.user.name, '->', c.domain.name);
    });
    
    // Check faculty users
    const faculty = await prisma.faculty.findMany({
      include: { user: true }
    });
    console.log('\nFaculty users:', faculty.length);
    faculty.forEach(f => {
      console.log('-', f.user.name, f.user.email);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase(); 