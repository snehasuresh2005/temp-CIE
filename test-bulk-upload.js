import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import FormData from 'form-data';

const prisma = new PrismaClient();

async function testBulkUpload() {
  try {
    // Get an admin user
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      include: { admin: true }
    });

    if (!admin) {
      console.log('No admin user found');
      return;
    }

    console.log('Admin user found:', {
      id: admin.id,
      email: admin.email,
      name: admin.name
    });

    // Test bulk upload with CSV file
    console.log('\nTesting bulk upload...');
    
    const formData = new FormData();
    formData.append('csv', fs.createReadStream('sample-lab-components.csv'));

    const response = await fetch('http://localhost:3000/api/lab-components/bulk-upload', {
      method: 'POST',
      headers: {
        'x-user-id': admin.id,
        ...formData.getHeaders()
      },
      body: formData
    });

    const result = await response.json();
    console.log('Bulk upload response:', JSON.stringify(result, null, 2));

    // Verify the components were added to database
    if (result.success) {
      console.log('\nVerifying database entries...');
      const components = await prisma.labComponent.findMany({
        where: {
          component_tag_id: {
            in: ['ARDU001', 'RPI001', 'BB001', 'JW001', 'LED001']
          }
        },
        select: {
          component_name: true,
          component_tag_id: true,
          component_quantity: true,
          component_category: true
        }
      });

      console.log('Components in database:', components);
    }

  } catch (error) {
    console.error('Error testing bulk upload:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBulkUpload(); 