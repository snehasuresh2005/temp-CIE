import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function exportLabComponents() {
  try {
    console.log('Exporting lab components from database...');
    
    // Get all lab components from the database
    const components = await prisma.labComponent.findMany({
      orderBy: {
        created_at: 'asc'
      }
    });

    console.log(`Found ${components.length} lab components`);

    if (components.length === 0) {
      console.log('No lab components found in database');
      return;
    }

    // Create CSV header
    const csvHeader = 'component_name,component_description,component_specification,component_quantity,component_tag_id,component_category,component_location,invoice_number,purchase_value,purchased_from,purchase_currency,purchase_date\n';

    // Convert components to CSV rows
    const csvRows = components.map(component => {
      const row = [
        `"${component.component_name}"`,
        `"${component.component_description}"`,
        `"${component.component_specification || ''}"`,
        component.component_quantity,
        `"${component.component_tag_id || ''}"`,
        `"${component.component_category}"`,
        `"${component.component_location}"`,
        `"${component.invoice_number || ''}"`,
        component.purchase_value || '',
        `"${component.purchased_from || ''}"`,
        `"${component.purchase_currency}"`,
        component.purchase_date ? `"${component.purchase_date.toISOString().split('T')[0]}"` : ''
      ];
      return row.join(',');
    });

    // Combine header and rows
    const csvContent = csvHeader + csvRows.join('\n');

    // Write to file
    const filename = 'current-lab-components.csv';
    fs.writeFileSync(filename, csvContent);

    console.log(`✅ Exported ${components.length} lab components to ${filename}`);
    console.log('\n📋 Components exported:');
    components.forEach((component, index) => {
      console.log(`${index + 1}. ${component.component_name} (${component.component_tag_id}) - Qty: ${component.component_quantity} - Location: ${component.component_location}`);
    });

    console.log(`\n📄 CSV file saved as: ${filename}`);
    console.log('You can now use this file for bulk upload testing or as a template.');

  } catch (error) {
    console.error('Error exporting lab components:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportLabComponents(); 