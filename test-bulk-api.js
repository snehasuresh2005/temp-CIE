import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import FormData from 'form-data';

const prisma = new PrismaClient();

async function testBulkUploadAPI() {
  try {
    // Get an admin user
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
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

    // Create a test CSV file
    const csvContent = `component_name,component_description,component_specification,component_quantity,component_tag_id,component_category,component_location,invoice_number,purchase_value,purchased_from,purchase_currency,purchase_date
Test Arduino,Test Arduino description,Test specs,5,TEST001,Electrical,LAB A,TEST001,100.00,Test Store,INR,2024-01-01
Test Raspberry Pi,Test Raspberry Pi description,Test specs,3,TEST002,Computer Hardware,LAB B,TEST002,200.00,Test Store,INR,2024-01-01`;

    fs.writeFileSync('test-bulk.csv', csvContent);

    // Test bulk upload
    console.log('\nTesting bulk upload API...');
    
    const formData = new FormData();
    formData.append('csv', fs.createReadStream('test-bulk.csv'));

    const response = await fetch('http://localhost:3000/api/lab-components/bulk-upload', {
      method: 'POST',
      headers: {
        'x-user-id': admin.id,
        ...formData.getHeaders()
      },
      body: formData
    });

    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));

    // Clean up
    fs.unlinkSync('test-bulk.csv');

  } catch (error) {
    console.error('Error testing bulk upload:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBulkUploadAPI(); 