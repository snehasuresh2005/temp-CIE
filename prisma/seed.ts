import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data (preserve users, admins, faculty, students)
  await prisma.componentRequest.deleteMany();
  await prisma.projectSubmission.deleteMany();
  await prisma.projectRequest.deleteMany();
  await prisma.domainCoordinator.deleteMany();
  await prisma.project.deleteMany();
  await prisma.studentAttendance.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.classSchedule.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.courseUnit.deleteMany();
  await prisma.course.deleteMany();
  await prisma.labComponent.deleteMany();
  await prisma.libraryItem.deleteMany();
  await prisma.domain.deleteMany();
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
  const createdUsers: Record<string, any> = {};
  for (const userInfo of userData) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userInfo.email },
      include: { admin: true, faculty: true, student: true }
    });

    if (!existingUser) {
      if (userInfo.role === 'ADMIN') {
        const user = await prisma.user.create({
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
          include: { admin: true }
        });
        createdUsers[userInfo.email] = user;
      } else if (userInfo.role === 'FACULTY') {
        const facultyId = `FAC${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
        const user = await prisma.user.create({
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
          include: { faculty: true }
        });
        createdUsers[userInfo.email] = user;
      } else if (userInfo.role === 'STUDENT') {
        const studentId = `STU${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
        const user = await prisma.user.create({
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
          include: { student: true }
        });
        createdUsers[userInfo.email] = user;
      }
    } else {
      createdUsers[userInfo.email] = existingUser;
    }
  }

  // Create domains
  console.log('\n🏭 Creating domains...');
  const labDomain = await prisma.domain.create({
    data: {
      name: 'Lab Components',
      description: 'Domain for managing laboratory components and equipment',
    }
  });

  const libraryDomain = await prisma.domain.create({
    data: {
      name: 'Library',
      description: 'Domain for managing library items and books',
    }
  });

  // Assign domain coordinators
  console.log('\n👨‍💼 Assigning domain coordinators...');
  const madhukharFaculty = createdUsers['cieoffice@pes.edu']?.faculty;
  const sathyaFaculty = createdUsers['sathya.prasad@pes.edu']?.faculty;
  const tarunFaculty = createdUsers['tarunrama@pes.edu']?.faculty;
  const adminUser = createdUsers['cie.admin@pes.edu'];

  if (madhukharFaculty) {
    // Madhukar as Lab Components coordinator
    await prisma.domainCoordinator.create({
      data: {
        domain_id: labDomain.id,
        faculty_id: madhukharFaculty.id,
        assigned_by: adminUser.id,
      }
    });
  }

  if (sathyaFaculty) {
    // Sathya as Library coordinator
    await prisma.domainCoordinator.create({
      data: {
        domain_id: libraryDomain.id,
        faculty_id: sathyaFaculty.id,
        assigned_by: adminUser.id,
      }
    });
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
      course_enrollments: [],
      created_by: adminUser.id,
      modified_by: adminUser.id,
    }
  });

  const course_CS102 = await prisma.course.create({
    data: {
      course_name: "Internet of Things",
      course_description: "Comprehensive study of IoT systems, sensor networks, and smart device integration for real-world applications.",
      course_code: "CS102", 
      course_start_date: new Date("2025-07-01T00:00:00.000Z"),
      course_end_date: new Date("2025-09-01T00:00:00.000Z"),
      course_enrollments: [],
      created_by: adminUser.id,
      modified_by: null,
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
      created_by: adminUser.id,
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
      created_by: adminUser.id,
      modified_by: null,
    }
  });

  // Create lab components with domain assignments
  console.log('\n🔬 Creating lab components...');
  const arduinoComponent = await prisma.labComponent.create({
    data: {
      component_name: "Arduino Uno R3",
      component_description: "Arduino Uno is an open-source microcontroller board based on the ATmega328P, designed for building interactive electronics projects with ease.",
      component_specification: "ATmega328P MCU, 14 digital I/O pins, 6 analog inputs, 16 MHz clock speed, USB-powered, 5V operating voltage.",
      component_quantity: 10,
      component_tag_id: "445RO",
      component_category: "Microcontroller",
      component_location: electronicsLab.name,
      image_path: "lab-images",
      front_image_id: "arduino-front.jpg",
      back_image_id: "arduino-back.jpg",
      invoice_number: "inv2233444",
      purchase_value: 300,
      purchased_from: "amazon",
      purchase_currency: "INR",
      purchase_date: new Date("2025-06-10T00:00:00.000Z"),
      created_by: "Admin",
      modified_by: "Admin",
      domain_id: labDomain.id, // Assign to Lab Components domain
    }
  });

  const nodeMcuComponent = await prisma.labComponent.create({
    data: {
      component_name: "NodeMCU ESP8266",
      component_description: "NodeMCU ESP8266 is a low-power, Wi-Fi-enabled microcontroller board ideal for IoT applications, offering GPIOs, serial communication, and easy programming via USB.",
      component_specification: "ESP8266 Wi-Fi SoC, 80 MHz clock, 4MB flash, 11 digital GPIOs, USB-to-serial, operates at 3.3V logic.",
      component_quantity: 8,
      component_tag_id: "ESP8266",
      component_category: "IoT Module",
      component_location: "Storage ROOM",
      image_path: "lab-images",
      front_image_id: "nodemcu-front.jpg",
      back_image_id: "nodemcu-back.jpg",
      invoice_number: "invc223387",
      purchase_value: 120,
      purchased_from: "Flipcart",
      purchase_currency: "INR",
      purchase_date: new Date("2025-06-06T00:00:00.000Z"),
      created_by: "Admin",
      modified_by: null,
      domain_id: labDomain.id, // Assign to Lab Components domain
    }
  });

  const displayComponent = await prisma.labComponent.create({
    data: {
      component_name: "LCD 16x2 Display",
      component_description: "16x2 character LCD display module for showing text and simple graphics in embedded projects.",
      component_specification: "16 characters x 2 lines, HD44780 controller, 5V operation, I2C interface available.",
      component_quantity: 15,
      component_tag_id: "142RW",
      component_category: "Display",
      component_location: "LAB C",
      image_path: "lab-images",
      front_image_id: "lcd16x2-front.jpg",
      back_image_id: "lcd16x2-back.jpg",
      invoice_number: "inv20350626",
      purchase_value: 120,
      purchased_from: "amazon",
      purchase_currency: "INR",
      purchase_date: new Date("2025-06-19T00:00:00.000Z"),
      created_by: "Admin",
      modified_by: null,
      domain_id: labDomain.id, // Assign to Lab Components domain
    }
  });

  // Add more components for variety
  const breadboardComponent = await prisma.labComponent.create({
    data: {
      component_name: "Breadboard 400 tie-points",
      component_description: "Half-size solderless breadboard for quick prototyping of electronic circuits.",
      component_specification: "400 tie-points, 30 rows x 10 columns, ABS plastic body, accepts 22-29 AWG wire.",
      component_quantity: 20,
      component_tag_id: "BB400",
      component_category: "Prototyping",
      component_location: "LAB C",
      image_path: "lab-images",
      front_image_id: "breadboard400-front.jpg",
      back_image_id: "breadboard400-back.jpg",
      invoice_number: "inv20350627",
      purchase_value: 50,
      purchased_from: "amazon",
      purchase_currency: "INR",
      purchase_date: new Date("2025-06-20T00:00:00.000Z"),
      created_by: "Admin",
      modified_by: null,
      domain_id: labDomain.id,
    }
  });

  const servoComponent = await prisma.labComponent.create({
    data: {
      component_name: "Servo Motor SG90",
      component_description: "Micro servo motor for precise angular control in robotics and automation projects.",
      component_specification: "180° rotation, 4.8-6V operation, 2.5kg.cm torque, PWM control, plastic gears.",
      component_quantity: 12,
      component_tag_id: "SRV90",
      component_category: "Actuator",
      component_location: "Storage ROOM",
      image_path: "lab-images",
      front_image_id: "servo-front.jpg",
      back_image_id: "servo-back.jpg",
      invoice_number: "inv20350628",
      purchase_value: 180,
      purchased_from: "robotics-india",
      purchase_currency: "INR",
      purchase_date: new Date("2025-06-21T00:00:00.000Z"),
      created_by: "Admin",
      modified_by: null,
      domain_id: labDomain.id,
    }
  });

  // Create library items
  console.log('\n📚 Creating library items...');
  await prisma.libraryItem.create({
    data: {
      item_name: "Arduino Programming Handbook",
      item_description: "Comprehensive guide to Arduino programming with practical projects and examples.",
      item_specification: "450 pages, ISBN: 978-1234567890, English language, hardcover edition.",
      item_quantity: 5,
      available_quantity: 4,
      item_tag_id: "ARD001",
      item_category: "Programming Guide",
      item_location: "Shelf A-1",
      image_path: "library-images",
      front_image_id: "arduino-book-front.jpg",
      back_image_id: "arduino-book-back.jpg",
      invoice_number: "lib001",
      purchase_value: 800,
      purchased_from: "Amazon",
      purchase_currency: "INR",
      purchase_date: new Date("2025-06-15T00:00:00.000Z"),
      created_by: "Admin",
      modified_by: null,
      domain_id: libraryDomain.id,
      faculty_id: sathyaFaculty?.id,
    }
  });

  // Create locations
  console.log('\n🏢 Creating locations...');
  const boardRoom = await prisma.location.create({
    data: {
      name: "Board Room",
      capacity: 15,
      description: "A formal meeting space equipped for executive discussions, decision-making, and strategic planning sessions",
      is_available: true,
      building: "BE Block",
      floor: "12",
      room_number: "1504",
      wing: null,
      images: ["/location-images/boardroom1.jpeg", "/location-images/boardroom2.jpeg"],
      location_type: "CABIN",
      created_by: adminUser.id,
      modified_by: adminUser.id,
    }
  });

  const electronicsLab = await prisma.location.create({
    data: {
      name: "Electronics Lab",
      capacity: 30,
      description: "Fully equipped electronics laboratory with workbenches, oscilloscopes, and component storage",
      is_available: true,
      building: "CS Block",
      floor: "3",
      room_number: "301",
      wing: "A",
      images: ["/location-images/lab1.jpeg"],
      location_type: "LAB",
      created_by: adminUser.id,
      modified_by: null,
    }
  });

  const computerLab = await prisma.location.create({
    data: {
      name: "Computer Lab A",
      capacity: 25,
      description: "Computer laboratory with workstations and development tools",
      is_available: true,
      building: "CS Block",
      floor: "2",
      room_number: "201",
      wing: "A",
      images: ["/location-images/lab2.jpeg"],
      location_type: "LAB",
      created_by: adminUser.id,
      modified_by: null,
    }
  });

  const roboticsLab = await prisma.location.create({
    data: {
      name: "Robotics Lab",
      capacity: 20,
      description: "Robotics and automation laboratory with specialized equipment",
      is_available: true,
      building: "ME Block",
      floor: "1",
      room_number: "101",
      wing: "B",
      images: ["/location-images/lab3.jpeg"],
      location_type: "LAB",
      created_by: adminUser.id,
      modified_by: null,
    }
  });

  const storageRoom = await prisma.location.create({
    data: {
      name: "Storage Room",
      capacity: 0,
      description: "Storage facility for components and equipment",
      is_available: true,
      building: "CS Block",
      floor: "1",
      room_number: "105",
      wing: "A",
      images: [],
      location_type: "WAREHOUSE",
      created_by: adminUser.id,
      modified_by: null,
    }
  });



  // Create projects
  console.log('\n📋 Creating projects...');
  const studentProject = await prisma.project.create({
    data: {
      name: "Smart Attendance System Using Face Detection",
      description: "This project aims to automate attendance marking in classrooms using real-time face detection and recognition. It replaces traditional roll-call or manual entry methods with a system that identifies and logs student attendance as soon as they appear in front of the camera.",
      components_needed: [arduinoComponent.id, displayComponent.id],
      course_id: course_CS101.id,
      created_by: createdUsers['preetham@pes.edu'].id,
      accepted_by: madhukharFaculty?.id || null,
      expected_completion_date: new Date("2025-07-03T08:54:00.000Z"),
      modified_by: null,
      status: "ONGOING", // Approved student project
      type: "STUDENT_PROPOSED",
    }
  });

  const facultyProject = await prisma.project.create({
    data: {
      name: "IoT-based Environmental Monitoring System",
      description: "Development of a comprehensive IoT system for monitoring environmental parameters like temperature, humidity, air quality, and noise levels in real-time with cloud-based data analytics.",
      components_needed: [nodeMcuComponent.id, breadboardComponent.id, servoComponent.id],
      course_id: course_CS102.id,
      created_by: tarunFaculty?.id || adminUser.id,
      accepted_by: madhukharFaculty?.id || null,
      expected_completion_date: new Date("2025-08-15T00:00:00.000Z"),
      modified_by: null,
      status: "ONGOING", // Approved faculty project
      type: "FACULTY_ASSIGNED",
    }
  });

  // Create sample component requests demonstrating the simplified return flow
  console.log('\n📝 Creating sample component requests...');
  
  // Student request - COLLECTED status (ready for return)
  const studentRequest1 = await prisma.componentRequest.create({
    data: {
      student_id: createdUsers['preetham@pes.edu'].student?.id,
      component_id: arduinoComponent.id,
      quantity: 2,
      purpose: "Building face detection module for attendance system",
      request_date: new Date("2025-07-01T10:00:00.000Z"),
      required_date: new Date("2025-07-15T17:00:00.000Z"),
      status: "COLLECTED",
      approved_by: madhukharFaculty?.id,
      approved_date: new Date("2025-07-01T14:00:00.000Z"),
      collection_date: new Date("2025-07-02T09:00:00.000Z"),
      project_id: studentProject.id,
      faculty_notes: "Approved for face detection project. Handle with care.",
    }
  });

  // Student request - USER_RETURNED status (user confirmed return)
  const studentRequest2 = await prisma.componentRequest.create({
    data: {
      student_id: createdUsers['rishi@pes.edu'].student?.id,
      component_id: displayComponent.id,
      quantity: 1,
      purpose: "Display module for project output",
      request_date: new Date("2025-07-02T11:00:00.000Z"),
      required_date: new Date("2025-07-16T17:00:00.000Z"),
      status: "USER_RETURNED",
      approved_by: madhukharFaculty?.id,
      approved_date: new Date("2025-07-02T15:00:00.000Z"),
      collection_date: new Date("2025-07-03T10:00:00.000Z"),
      return_date: new Date("2025-07-10T14:00:00.000Z"),
      project_id: studentProject.id,
      faculty_notes: "Approved for display integration.",
    }
  });

  // Student request - USER_RETURNED status (user confirmed return, waiting for coordinator)
  const studentRequest3 = await prisma.componentRequest.create({
    data: {
      student_id: createdUsers['samir@pes.edu'].student?.id,
      component_id: breadboardComponent.id,
      quantity: 1,
      purpose: "Circuit prototyping and testing",
      request_date: new Date("2025-07-03T09:00:00.000Z"),
      required_date: new Date("2025-07-17T17:00:00.000Z"),
             status: "USER_RETURNED" as const,
      approved_by: madhukharFaculty?.id,
      approved_date: new Date("2025-07-03T13:00:00.000Z"),
      collection_date: new Date("2025-07-04T11:00:00.000Z"),
      return_date: new Date("2025-07-11T16:00:00.000Z"),
      project_id: studentProject.id,
      faculty_notes: "Standard prototyping board approved.",
    }
  });

  // Faculty request - COLLECTED status
  const facultyRequest1 = await prisma.componentRequest.create({
    data: {
      faculty_id: tarunFaculty?.id,
      component_id: nodeMcuComponent.id,
      quantity: 3,
      purpose: "IoT sensor nodes for environmental monitoring research",
      request_date: new Date("2025-07-05T08:00:00.000Z"),
      required_date: new Date("2025-08-05T17:00:00.000Z"),
      status: "COLLECTED",
      approved_by: madhukharFaculty?.id,
      approved_date: new Date("2025-07-05T12:00:00.000Z"),
      collection_date: new Date("2025-07-06T10:00:00.000Z"),
      project_id: facultyProject.id,
      faculty_notes: "Approved for IoT research project. Extended return period granted.",
    }
  });

  // Faculty request - USER_RETURNED status
  const facultyRequest2 = await prisma.componentRequest.create({
    data: {
      faculty_id: sathyaFaculty?.id,
      component_id: servoComponent.id,
      quantity: 2,
      purpose: "Actuator testing for automation prototype",
      request_date: new Date("2025-07-06T09:30:00.000Z"),
      required_date: new Date("2025-07-20T17:00:00.000Z"),
      status: "USER_RETURNED",
      approved_by: madhukharFaculty?.id,
      approved_date: new Date("2025-07-06T14:00:00.000Z"),
      collection_date: new Date("2025-07-07T09:00:00.000Z"),
      return_date: new Date("2025-07-12T15:30:00.000Z"),
      project_id: facultyProject.id,
      faculty_notes: "Approved for prototype development.",
    }
  });

  // Some completed requests for history
  const completedRequest = await prisma.componentRequest.create({
    data: {
      student_id: createdUsers['sneha@pes.edu'].student?.id,
      component_id: displayComponent.id,
      quantity: 1,
      purpose: "Final project demonstration",
      request_date: new Date("2025-06-28T10:00:00.000Z"),
      required_date: new Date("2025-07-05T17:00:00.000Z"),
      status: "RETURNED",
      approved_by: madhukharFaculty?.id,
      approved_date: new Date("2025-06-28T14:00:00.000Z"),
      collection_date: new Date("2025-06-29T11:00:00.000Z"),
      return_date: new Date("2025-07-05T16:30:00.000Z"),
      project_id: studentProject.id,
      faculty_notes: "Successfully returned after project completion.",
    }
  });

  // Summary
  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📊 Summary of created data:');
  console.log(`   - Domains: 2 (Lab Components, Library)`);
  console.log(`   - Domain Coordinators: 2`);
  console.log(`   - Courses: 2`);
  console.log(`   - Course Units: 2`);
  console.log(`   - Lab Components: 5 (all assigned to Lab Components domain)`);
  console.log(`   - Library Items: 1`);
  console.log(`   - Locations: 2`);
  console.log(`   - Projects: 2 (1 student, 1 faculty - both ONGOING)`);
  console.log(`   - Component Requests: 6 (demonstrating simplified return flow)`);
  console.log('\n🔄 Return Flow Examples:');
  console.log('   - COLLECTED: Ready for return request');
  console.log('   - USER_RETURNED: User confirmed return, waiting for coordinator verification');
  console.log('   - RETURNED: Complete return cycle');
  console.log('\n👨‍💼 Coordinator Assignments:');
  console.log('   - Madhukar N: Lab Components Domain');
  console.log('   - Sathya Prasad: Library Domain');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 