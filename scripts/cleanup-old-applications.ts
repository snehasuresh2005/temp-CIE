import { prisma } from '../lib/prisma';
import fs from 'fs';
import path from 'path';

async function cleanupOldApplications() {
  const applications = await prisma.opportunityApplication.findMany();
  const resumesDir = path.join(process.cwd(), 'public', 'resumes');
  let deleted = 0;
  for (const app of applications) {
    if (app.resumePath) {
      const filePath = path.join(process.cwd(), 'public', app.resumePath);
      if (!fs.existsSync(filePath)) {
        await prisma.opportunityApplication.delete({ where: { id: app.id } });
        deleted++;
        console.log(`Deleted application ${app.id} (missing file: ${filePath})`);
      }
    } else {
      await prisma.opportunityApplication.delete({ where: { id: app.id } });
      deleted++;
      console.log(`Deleted application ${app.id} (no resumePath)`);
    }
  }
  console.log(`Cleanup complete. Deleted ${deleted} broken applications.`);
  await prisma.$disconnect();
}

cleanupOldApplications().catch(e => {
  console.error(e);
  process.exit(1);
}); 