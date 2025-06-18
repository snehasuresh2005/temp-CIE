import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearComponentRequests() {
  try {
    console.log('Clearing all component requests...');
    
    const result = await prisma.componentRequest.deleteMany({});
    
    console.log(`Successfully deleted ${result.count} component requests.`);
    console.log('All preset component requests have been removed.');
    console.log('Only dynamically created requests will remain.');
    
  } catch (error) {
    console.error('Error clearing component requests:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearComponentRequests(); 