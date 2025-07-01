import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data (preserve users, admins, faculty, students)
  await prisma.componentRequest.deleteMany();
  await prisma.projectSubmission.deleteMany();
  await prisma.projectRequest.deleteMany();
  await prisma.project.deleteMany();
  await prisma.studentAttendance.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.classSchedule.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.labComponent.deleteMany();
  await prisma.location.deleteMany();
  // Note: We're NOT deleting users, admins, faculty, students to preserve existing user data

  // Hash password for all users
  const hashedPassword = await hash('password123', 10);

  // User data provided
  const userData = [
    // Admin
    { email: 'cie.admin@pes.edu', name: 'Admin', role: 'ADMIN' as const },
    // Faculty
    { email: 'cieoffice@pes.edu', name: 'Madhukar N', role: 'FACULTY' as const },
    { email: 'sathya.prasad@pes.edu', name: 'Sathya Prasad', role: 'FACULTY' as const },
    { email: 'tarunrama@pes.edu', name: 'Tarun R', role: 'FACULTY' as const },
    // Students
    { email: 'preetham@pes.edu', name: 'Preetham Kumar S', role: 'STUDENT' as const },
    { email: 'rishi@pes.edu', name: 'Rishi D V', role: 'STUDENT' as const },
    { email: 'samir@pes.edu', name: 'Samir G D', role: 'STUDENT' as const },
    { email: 'sneha@pes.edu', name: 'Sneha', role: 'STUDENT' as const },
    { email: 'anivartha@pes.edu', name: 'Anivartha U', role: 'STUDENT' as const },
    { email: 'dhanush@pes.edu', name: 'Dhanush', role: 'STUDENT' as const },
    { email: 'priya@pes.edu', name: 'Priya Deshmukh', role: 'STUDENT' as const },
    { email: 'nikhil@pes.edu', name: 'Nikhil', role: 'STUDENT' as const },
    { email: 'vismayii@pes.edu', name: 'Vismayii', role: 'STUDENT' as const },
    { email: 'ranjith@pes.edu', name: 'Ranjith Kumar', role: 'STUDENT' as const },
    { email: 'akshay@pes.edu', name: 'Akshay M', role: 'STUDENT' as const },
    { email: 'aishwarya@pes.edu', name: 'Aishwarya C', role: 'STUDENT' as const },
    { email: 'pratham@pes.edu', name: 'Pratham M', role: 'STUDENT' as const },
    { email: 'rachan@pes.edu', name: 'Rachan D', role: 'STUDENT' as const },
    { email: 'pavan@pes.edu', name: 'Pavan P', role: 'STUDENT' as const },
  ];

  // Create users and their respective role records
  for (const userInfo of userData) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userInfo.email },
      include: { admin: true, faculty: true, student: true }
    });

    if (!existingUser) {
      if (userInfo.role === 'ADMIN') {
        await prisma.user.create({
          data: {
            email: userInfo.email,
            name: userInfo.name,
            password: hashedPassword,
            role: userInfo.role,
            phone: '+91-9876543210',
            admin: {
              create: {
                department: 'Information Technology',
                office: 'Admin Block - 201',
                working_hours: '9:00 AM - 5:00 PM',
                permissions: ['MANAGE_USERS', 'MANAGE_COURSES', 'MANAGE_COMPONENTS', 'ASSIGN_FACULTY'],
              },
            },
          },
        });
      } else if (userInfo.role === 'FACULTY') {
        const facultyId = `FAC${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
        await prisma.user.create({
          data: {
            email: userInfo.email,
            name: userInfo.name,
            password: hashedPassword,
            role: userInfo.role,
            phone: '+91-9876543210',
            faculty: {
              create: {
                faculty_id: facultyId,
                department: 'Computer Science',
                office: 'CS Block - 301',
                specialization: 'Computer Science and Engineering',
                office_hours: '10:00 AM - 4:00 PM',
              },
            },
          },
        });
      } else if (userInfo.role === 'STUDENT') {
        const studentId = `STU${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
        await prisma.user.create({
          data: {
            email: userInfo.email,
            name: userInfo.name,
            password: hashedPassword,
            role: userInfo.role,
            phone: '+91-9876543210',
            student: {
              create: {
                student_id: studentId,
                program: 'BTech CSE',
                year: '2024',
                section: 'A',
                gpa: 7.5 + Math.random() * 2.5, // Random GPA between 7.5 and 10
              },
            },
          },
        });
      }
    }
  }

  // Count users to confirm creation
  const userCount = await prisma.user.count();
  const adminCount = await prisma.admin.count();
  const facultyCount = await prisma.faculty.count();
  const studentCount = await prisma.student.count();

  console.log('✅ Database seeded with new user data!');
  console.log(`📊 User counts:`);
  console.log(`   - Total Users: ${userCount}`);
  console.log(`   - Admins: ${adminCount}`);
  console.log(`   - Faculty: ${facultyCount}`);
  console.log(`   - Students: ${studentCount}`);
  console.log('');
  console.log('🔑 Login Credentials:');
  console.log('   All users: password123');
  console.log('');
  console.log('👥 Users created:');
  userData.forEach(user => {
    console.log(`   - ${user.name} (${user.email}) - ${user.role}`);
  });

  // =====================
  // Seed extracted data from current database
  // =====================

  // Create courses
  console.log('\n📚 Creating courses...');
  const course_CS101 = await prisma.course.create({
    data: {
      course_name: "Computer Vision",
      course_description: "This course introduces students to the fundamentals and applications of computer vision, focusing on how machines perceive and interpret visual data. Topics include image processing, object detection, motion analysis, and feature extraction.",
      course_code: "CS101",
      course_start_date: new Date("2025-06-26T00:00:00.000Z"),
      course_end_date: new Date("2025-08-27T00:00:00.000Z"),
      course_enrollments: ["cmcc2iykn0006rb5tzdzlnv0i"],
      created_by: "cmcc2iyir0000rb5tgumris2w",
      modified_by: "cmcc2iykn0006rb5tzdzlnv0i",
    }
  });

  // Create course units
  console.log('\n📖 Creating course units...');
  await prisma.courseUnit.create({
    data: {
      course_id: course_CS101.id,
      unit_number: 1,
      unit_name: "Introduction to Computer vision",
      unit_description: "Filters\nHistograms\nThresholding",
      assignment_count: 10,
      hours_per_unit: 10,
      created_by: "cmcc2iyir0000rb5tgumris2w",
      modified_by: null,
    }
  });
  await prisma.courseUnit.create({
    data: {
      course_id: course_CS101.id,
      unit_number: 2,
      unit_name: "Feature Detection and Matching",
      unit_description: "SIFT\nSURF\nORB",
      assignment_count: 3,
      hours_per_unit: 12,
      created_by: "cmcc2iyir0000rb5tgumris2w",
      modified_by: null,
    }
  });

  // Create lab components
  console.log('\n🔬 Creating lab components...');
  await prisma.labComponent.create({
    data: {
      component_name: "Arduino Uno R3",
      component_description: "Arduino Uno is an open-source microcontroller board based on the ATmega328P, designed for building interactive electronics projects with ease.",
      component_specification: "ATmega328P MCU, 14 digital I/O pins, 6 analog inputs, 16 MHz clock speed, USB-powered, 5V operating voltage.",
      component_quantity: 10,
      component_tag_id: "445RO",
      component_category: "Electrical",
      component_location: "LAB C",
      image_path: "lab-images",
      front_image_id: "1750927038409_WhatsApp Image 2025-06-19 at 21.50.44.jpeg",
      back_image_id: "1750927038423_A000066_04.back_934x700.jpg",
      invoice_number: "inv2233444",
      purchase_value: 300,
      purchased_from: "amazon",
      purchase_currency: "INR",
      purchase_date: new Date("2025-06-10T00:00:00.000Z"),
      created_by: "Admin",
      modified_by: "Admin",
    }
  });
  await prisma.labComponent.create({
    data: {
      component_name: "NodeMCU ",
      component_description: "NodeMCU ESP8266 is a low-power, Wi-Fi-enabled microcontroller board ideal for IoT applications, offering GPIOs, serial communication, and easy programming via USB.",
      component_specification: "ESP8266 Wi-Fi SoC, 80 MHz clock, 4MB flash, 11 digital GPIOs, USB-to-serial, operates at 3.3V logic.",
      component_quantity: 8,
      component_tag_id: "ESP8266",
      component_category: "Electrical",
      component_location: "Storage ROOM",
      image_path: "lab-images",
      front_image_id: "1750927248606_WhatsApp Image 2025-06-19 at 21.50.45.jpeg",
      back_image_id: "1750927248621_WhatsApp Image 2025-06-19 at 21.50.39.jpeg",
      invoice_number: "invc223387",
      purchase_value: 120,
      purchased_from: "Flipcart",
      purchase_currency: "INR",
      purchase_date: new Date("2025-06-06T00:00:00.000Z"),
      created_by: "Admin",
      modified_by: null,
    }
  });
  await prisma.labComponent.create({
    data: {
      component_name: "Display ",
      component_description: "test description ",
      component_specification: "test specifications",
      component_quantity: 1,
      component_tag_id: "142RW",
      component_category: "Electrical",
      component_location: "LAB C",
      image_path: "lab-images",
      front_image_id: "1750930825226_WhatsApp Image 2025-06-19 at 21.50.46 (1).jpeg",
      back_image_id: "1750930825242_WhatsApp Image 2025-06-19 at 21.50.46.jpeg",
      invoice_number: "inv20350626",
      purchase_value: 120,
      purchased_from: "amazon",
      purchase_currency: "INR",
      purchase_date: new Date("2025-06-19T00:00:00.000Z"),
      created_by: "Admin",
      modified_by: null,
    }
  });

  // Create locations
  console.log('\n🏢 Creating locations...');
  await prisma.location.create({
    data: {
      name: "Board Room",
      capacity: 15,
      description: "A formal meeting space equipped for executive discussions, decision-making, and strategic planning sessions",
      is_available: true,
      building: "BE Block",
      floor: "12",
      room_number: "1504",
      wing: null,
      images: ["/location-images/1750928233933_rgaa0rijhef.jpeg","/location-images/1750928239024_qd87zi28roj.jpeg"],
      location_type: "CABIN",
      created_by: "cmcc2c35n0000rbochm6bmvvu",
      modified_by: "cmcc2c35n0000rbochm6bmvvu",
    }
  });

  // Create projects
  console.log('\n📋 Creating projects...');
  await prisma.project.create({
    data: {
      name: "Smart Attendance System Using Face Detection",
      description: "This project aims to automate attendance marking in classrooms using real-time face detection and recognition. It replaces traditional roll-call or manual entry methods with a system that identifies and logs student attendance as soon as they appear in front of the camera.",
      components_needed: ["77c4d5d5-95f5-499b-8ba7-f4c2d7cb0966"],
      course_id: course_CS101.id,
      created_by: "cmcc2iykn0006rb5tzdzlnv0i",
      accepted_by: "cmcc2iyir0001rb5t80bto8rx",
      expected_completion_date: new Date("2025-07-03T08:54:00.000Z"),
      modified_by: null,
      status: "ONGOING",
      type: "STUDENT_PROPOSED",
    }
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 