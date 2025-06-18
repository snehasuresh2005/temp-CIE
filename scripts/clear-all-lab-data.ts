import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearAllLabData() {
  try {
    console.log('Clearing all component requests first...');
    
    // First delete all component requests (to avoid foreign key constraint)
    const requestsResult = await prisma.componentRequest.deleteMany({});
    console.log(`Successfully deleted ${requestsResult.count} component requests.`);
    
    console.log('Now clearing all lab components...');
    
    // Then delete all lab components
    const componentsResult = await prisma.labComponent.deleteMany({});
    console.log(`Successfully deleted ${componentsResult.count} lab components.`);
    
    console.log('✅ All lab data has been cleared successfully!');
    console.log('You can now add fresh lab components without any conflicts.');
    
  } catch (error) {
    console.error('Error clearing lab data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllLabData(); 