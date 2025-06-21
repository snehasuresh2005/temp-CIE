import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Test lab components
    const components = await prisma.labComponent.findMany();
    console.log(`Found ${components.length} lab components`);
    if (components.length > 0) {
      console.log('First component:', components[0]);
    }
    
    // Test projects
    const projects = await prisma.project.findMany();
    console.log(`Found ${projects.length} projects`);
    if (projects.length > 0) {
      console.log('First project:', projects[0]);
    }
    
    // Test students
    const students = await prisma.student.findMany();
    console.log(`Found ${students.length} students`);
    if (students.length > 0) {
      console.log('First student:', students[0]);
    }
    
  } catch (error) {
    console.error('Database test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase(); 