import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import FormData from 'form-data';

const prisma = new PrismaClient();

async function testResumeUpload() {
  try {
    // Get a faculty user
    const faculty = await prisma.user.findFirst({
      where: { role: 'FACULTY' },
      include: { faculty: true }
    });

    if (!faculty) {
      console.log('No faculty user found');
      return;
    }

    console.log('Faculty user found:', {
      id: faculty.id,
      email: faculty.email,
      name: faculty.name
    });

    // Create a test PDF file
    const testContent = 'This is a test resume content for API testing';
    fs.writeFileSync('test-resume.pdf', testContent);

    // Test faculty resume upload
    console.log('\nTesting faculty resume upload...');
    
    const formData = new FormData();
    formData.append('resume', fs.createReadStream('test-resume.pdf'));

    const response = await fetch('http://localhost:3000/api/faculty/upload-resume', {
      method: 'POST',
      headers: {
        'x-user-id': faculty.id,
        ...formData.getHeaders()
      },
      body: formData
    });

    const result = await response.json();
    console.log('Faculty upload response:', result);

    // Test student resume upload
    const student = await prisma.user.findFirst({
      where: { role: 'STUDENT' },
      include: { student: true }
    });

    if (student) {
      console.log('\nTesting student resume upload...');
      
      const studentFormData = new FormData();
      studentFormData.append('resume', fs.createReadStream('test-resume.pdf'));

      const studentResponse = await fetch('http://localhost:3000/api/student/upload-resume', {
        method: 'POST',
        headers: {
          'x-user-id': student.id,
          ...studentFormData.getHeaders()
        },
        body: studentFormData
      });

      const studentResult = await studentResponse.json();
      console.log('Student upload response:', studentResult);
    }

    // Clean up
    fs.unlinkSync('test-resume.pdf');

  } catch (error) {
    console.error('Error testing resume upload:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testResumeUpload(); 