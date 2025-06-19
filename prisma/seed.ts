import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.componentRequest.deleteMany();
  await prisma.projectSubmission.deleteMany();
  await prisma.project.deleteMany();
  await prisma.studentAttendance.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.classSchedule.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.labComponent.deleteMany();
  await prisma.location.deleteMany();
  await prisma.student.deleteMany();
  await prisma.faculty.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.user.deleteMany();

  // Hash password for all users
  const hashedPassword = await hash('password123', 10);

  // Create Admin User
  await prisma.user.create({
    data: {
      email: 'admin@college.edu',
      name: 'System Administrator',
      password: hashedPassword,
      role: 'ADMIN',
      phone: '+91-9876543210',
      admin: {
        create: {
          department: 'Information Technology',
          office: 'Admin Block - 201',
          workingHours: '9:00 AM - 5:00 PM',
          permissions: ['MANAGE_USERS', 'MANAGE_COURSES', 'MANAGE_COMPONENTS', 'ASSIGN_FACULTY'],
        },
      },
    },
  });

  // Create Faculty Users and Faculty records
  const facultyData = [
    {
      name: 'Dr. Rajesh Kumar',
      email: 'rajesh.kumar@college.edu',
      employeeId: 'FAC001',
      department: 'Computer Science',
      office: 'CS Block - 301',
      specialization: 'Data Structures and Algorithms',
      phone: '+91-9876543211',
    },
    {
      name: 'Prof. Priya Sharma',
      email: 'priya.sharma@college.edu',
      employeeId: 'FAC002',
      department: 'Information Technology',
      office: 'IT Block - 205',
      specialization: 'Web Development and Databases',
      phone: '+91-9876543212',
    },
    {
      name: 'Dr. Amit Patel',
      email: 'amit.patel@college.edu',
      employeeId: 'FAC003',
      department: 'Electronics',
      office: 'ECE Block - 401',
      specialization: 'Digital Electronics and Microprocessors',
      phone: '+91-9876543213',
    },
  ];

  for (const fac of facultyData) {
    await prisma.user.create({
      data: {
        email: fac.email,
        name: fac.name,
        password: hashedPassword,
        role: 'FACULTY',
        phone: fac.phone,
        faculty: {
          create: {
            employeeId: fac.employeeId,
            department: fac.department,
            office: fac.office,
            specialization: fac.specialization,
            officeHours: '10:00 AM - 4:00 PM',
          },
        },
      },
    });
  }

  // Create Student Users and Student records (30 students, 10 in each section)
  const sections = ['A', 'B', 'C'];
  const programs = ['BTech CSE', 'BTech IT', 'BTech ECE'];

  for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
    const section = sections[sectionIndex];
    const program = programs[sectionIndex];

    for (let i = 1; i <= 10; i++) {
      const studentNumber = (sectionIndex * 10 + i).toString().padStart(3, '0');
      await prisma.user.create({
        data: {
          email: `student${studentNumber}@college.edu`,
          name: `Student ${studentNumber}`,
          password: hashedPassword,
          role: 'STUDENT',
          phone: `+91-98765432${studentNumber.slice(-2)}`,
          student: {
            create: {
              studentId: `STU${studentNumber}`,
              program: program,
              year: '2024',
              section: section,
              gpa: 7.5 + Math.random() * 2.5, // Random GPA between 7.5 and 10
            },
          },
        },
      });
    }
  }

  // Create some sample lab components
  const labComponents = [
    {
      component_name: "Arduino Uno R3",
      component_description: "Microcontroller board based on the ATmega328P",
      component_specification: "Operating Voltage: 5V, Input Voltage: 7-12V, Digital I/O Pins: 14, Analog Input Pins: 6",
      component_quantity: 25,
      component_tag_id: "ARDUINO-001",
      component_category: "Microcontrollers",
      component_location: "Lab A",
      invoice_number: "INV-2025-001",
      purchase_value: 2500.00,
      purchased_from: "Robu.in",
      purchase_currency: "INR",
      purchase_date: new Date("2025-01-15"),
      created_by: "admin@college.edu",
    },
    {
      component_name: "Raspberry Pi 4 Model B",
      component_description: "Single-board computer with 4GB RAM",
      component_specification: "Processor: Broadcom BCM2711, RAM: 4GB LPDDR4, Storage: MicroSD card slot",
      component_quantity: 10,
      component_tag_id: "RPI-001",
      component_category: "Single Board Computers",
      component_location: "Lab B",
      invoice_number: "INV-2025-002",
      purchase_value: 4500.00,
      purchased_from: "Element14",
      purchase_currency: "INR",
      purchase_date: new Date("2025-01-20"),
      created_by: "admin@college.edu",
    },
    {
      component_name: "Breadboard 830 Points",
      component_description: "Solderless breadboard for prototyping circuits",
      component_specification: "830 tie points, 2 power rails, 5.5\" x 3.3\" size",
      component_quantity: 50,
      component_tag_id: "BB-001",
      component_category: "Prototyping",
      component_location: "Storage Room",
      invoice_number: "INV-2025-003",
      purchase_value: 150.00,
      purchased_from: "Amazon",
      purchase_currency: "INR",
      purchase_date: new Date("2025-01-25"),
      created_by: "admin@college.edu",
    }
  ];

  for (const component of labComponents) {
    await prisma.labComponent.create({
      data: component,
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log('==================================================');
  console.log('LOGIN CREDENTIALS:');
  console.log('==================================================');
  console.log('Admin:');
  console.log('  Email: admin@college.edu');
  console.log('  Password: password123');
  console.log('\nFaculty:');
  console.log('  Dr. Rajesh Kumar - rajesh.kumar@college.edu');
  console.log('  Prof. Priya Sharma - priya.sharma@college.edu');
  console.log('  Dr. Amit Patel - amit.patel@college.edu');
  console.log('  Password: password123 (for all)');
  console.log('\nStudents:');
  console.log('  student001@college.edu to student030@college.edu');
  console.log('  Password: password123 (for all)');
  console.log('==================================================');
  console.log('SUMMARY:');
  console.log('- 1 Admin');
  console.log('- 3 Faculty members');
  console.log('- 30 Students');
  console.log('No lab components, requests, courses, or other data.');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
