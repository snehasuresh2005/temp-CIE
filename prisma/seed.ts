import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
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

  const createdFaculty = [];
  for (const fac of facultyData) {
    const faculty = await prisma.user.create({
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
      include: {
        faculty: true,
      },
    });
    createdFaculty.push(faculty);
  }

  // Create Student Users and Student records (30 students, 10 in each section)
  const sections = ['A', 'B', 'C'];
  const programs = ['BTech CSE', 'BTech IT', 'BTech ECE'];
  const createdStudents = [];

  for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
    const section = sections[sectionIndex];
    const program = programs[sectionIndex];

    for (let i = 1; i <= 10; i++) {
      const studentNumber = (sectionIndex * 10 + i).toString().padStart(3, '0');
      const student = await prisma.user.create({
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
        include: {
          student: true,
        },
      });
      createdStudents.push(student);
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
    },
    {
      component_name: "LED Strip WS2812B",
      component_description: "Addressable RGB LED strip with 60 LEDs per meter",
      component_specification: "Voltage: 5V, Current: 60mA per LED, Protocol: WS2812B",
      component_quantity: 15,
      component_tag_id: "LED-001",
      component_category: "LEDs",
      component_location: "Lab A",
      invoice_number: "INV-2025-004",
      purchase_value: 800.00,
      purchased_from: "Robu.in",
      purchase_currency: "INR",
      purchase_date: new Date("2025-01-30"),
      created_by: "admin@college.edu",
    },
    {
      component_name: "Servo Motor SG90",
      component_description: "Micro servo motor for robotics projects",
      component_specification: "Voltage: 4.8V-6V, Torque: 1.8kg/cm, Speed: 0.1s/60°",
      component_quantity: 20,
      component_tag_id: "SERVO-001",
      component_category: "Motors",
      component_location: "Lab B",
      invoice_number: "INV-2025-005",
      purchase_value: 300.00,
      purchased_from: "Amazon",
      purchase_currency: "INR",
      purchase_date: new Date("2025-02-01"),
      created_by: "admin@college.edu",
    }
  ];

  const createdComponents = [];
  for (const component of labComponents) {
    const createdComponent = await prisma.labComponent.create({
      data: component,
    });
    createdComponents.push(createdComponent);
  }

  // Create courses
  const courses = [
    {
      code: "CS301",
      name: "Data Structures and Algorithms",
      description: "Advanced data structures and algorithm analysis",
      credits: 4,
      department: "Computer Science",
      semester: "Fall 2024",
      maxStudents: 60,
      sections: ["A", "B"],
      facultyId: createdFaculty[0].faculty.id, // Dr. Rajesh Kumar
    },
    {
      code: "IT401",
      name: "Web Development",
      description: "Modern web development with React and Node.js",
      credits: 3,
      department: "Information Technology",
      semester: "Fall 2024",
      maxStudents: 45,
      sections: ["A", "B"],
      facultyId: createdFaculty[1].faculty.id, // Prof. Priya Sharma
    },
    {
      code: "EC301",
      name: "Digital Electronics",
      description: "Digital circuit design and implementation",
      credits: 4,
      department: "Electronics",
      semester: "Fall 2024",
      maxStudents: 50,
      sections: ["A", "B"],
      facultyId: createdFaculty[2].faculty.id, // Dr. Amit Patel
    }
  ];

  const createdCourses = [];
  for (const course of courses) {
    const createdCourse = await prisma.course.create({
      data: course,
    });
    createdCourses.push(createdCourse);
  }

  // Create faculty-assigned projects
  const facultyProjects = [
    {
      name: "Smart Home Automation System",
      description: "Design and implement a smart home automation system using Arduino and various sensors. The system should control lighting, temperature, and security features.",
      course_id: createdCourses[0].id, // CS301
      components_needed: [createdComponents[0].id, createdComponents[2].id, createdComponents[3].id], // Arduino, Breadboard, LED Strip
      expected_completion_date: new Date("2025-03-15"),
      created_by: createdFaculty[0].email,
      type: "FACULTY_ASSIGNED" as const,
      status: "ONGOING" as const,
    },
    {
      name: "E-commerce Website Development",
      description: "Build a full-stack e-commerce website using React for frontend and Node.js for backend. Include user authentication, product catalog, and payment integration.",
      course_id: createdCourses[1].id, // IT401
      components_needed: [createdComponents[1].id], // Raspberry Pi
      expected_completion_date: new Date("2025-03-20"),
      created_by: createdFaculty[1].email,
      type: "FACULTY_ASSIGNED" as const,
      status: "ONGOING" as const,
    },
    {
      name: "Digital Clock with 7-Segment Display",
      description: "Create a digital clock using 7-segment displays and digital logic circuits. Implement time setting and alarm functionality.",
      course_id: createdCourses[2].id, // EC301
      components_needed: [createdComponents[2].id], // Breadboard
      expected_completion_date: new Date("2025-03-25"),
      created_by: createdFaculty[2].email,
      type: "FACULTY_ASSIGNED" as const,
      status: "ONGOING" as const,
    }
  ];

  const createdFacultyProjects = [];
  for (const project of facultyProjects) {
    const createdProject = await prisma.project.create({
      data: project,
    });
    createdFacultyProjects.push(createdProject);
  }

  // Create student-proposed projects
  const studentProjects = [
    {
      name: "IoT Weather Station",
      description: "Build a weather station that collects temperature, humidity, and pressure data and displays it on a web dashboard.",
      course_id: createdCourses[0].id, // CS301
      components_needed: [createdComponents[0].id, createdComponents[1].id], // Arduino, Raspberry Pi
      expected_completion_date: new Date("2025-04-01"),
      created_by: createdStudents[0].email, // student001
      type: "STUDENT_PROPOSED" as const,
      status: "PENDING" as const,
    },
    {
      name: "Gesture-Controlled Robot",
      description: "Develop a robot that can be controlled using hand gestures captured by a camera and processed using computer vision.",
      course_id: createdCourses[1].id, // IT401
      components_needed: [createdComponents[1].id, createdComponents[4].id], // Raspberry Pi, Servo Motor
      expected_completion_date: new Date("2025-04-05"),
      created_by: createdStudents[10].email, // student011
      type: "STUDENT_PROPOSED" as const,
      status: "PENDING" as const,
    }
  ];

  const createdStudentProjects = [];
  for (const project of studentProjects) {
    const createdProject = await prisma.project.create({
      data: project,
    });
    createdStudentProjects.push(createdProject);
  }

  // Create project requests for student-proposed projects
  const projectRequests = [
    {
      project_id: createdStudentProjects[0].id,
      student_id: createdStudents[0].student!.id,
      faculty_id: createdFaculty[0].faculty!.id, // Dr. Rajesh Kumar
      student_notes: "I have experience with Arduino programming and would like to explore IoT applications. This project will help me learn about sensor integration and web development.",
      status: "PENDING" as const,
    },
    {
      project_id: createdStudentProjects[1].id,
      student_id: createdStudents[10].student!.id,
      faculty_id: createdFaculty[1].faculty!.id, // Prof. Priya Sharma
      student_notes: "I'm interested in computer vision and robotics. This project combines both areas and will be a great learning experience.",
      status: "APPROVED" as const,
      accepted_date: new Date("2025-01-28"),
    }
  ];

  for (const request of projectRequests) {
    await prisma.projectRequest.create({
      data: request,
    });
  }

  // Update the approved project status
  await prisma.project.update({
    where: { id: createdStudentProjects[1].id },
    data: { 
      status: "ONGOING",
      accepted_by: createdFaculty[1].faculty!.id
    },
  });

  // Create project submissions
  const projectSubmissions = [
    {
      projectId: createdFacultyProjects[0].id,
      studentId: createdStudents[5].student!.id,
      content: "I have successfully implemented the smart home automation system. The system includes:\n\n1. Temperature and humidity sensors for climate control\n2. Motion sensors for security\n3. LED strip control for lighting\n4. Web interface for remote control\n\nAll components are working as expected and the system responds to both manual and automated triggers.",
      status: "SUBMITTED" as const,
      submissionDate: new Date("2025-03-10"),
    },
    {
      projectId: createdFacultyProjects[1].id,
      studentId: createdStudents[15].student!.id,
      content: "E-commerce website completed with the following features:\n\n- User registration and authentication\n- Product catalog with search and filtering\n- Shopping cart functionality\n- Payment integration with Stripe\n- Admin panel for product management\n- Responsive design for mobile devices\n\nThe website is fully functional and ready for deployment.",
      status: "GRADED" as const,
      submissionDate: new Date("2025-03-15"),
      marks: 85,
      feedback: "Excellent work! The website is well-designed and functional. Good use of modern web technologies. Consider adding more security features for production deployment.",
    }
  ];

  for (const submission of projectSubmissions) {
    await prisma.projectSubmission.create({
      data: submission,
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
  console.log('- 5 Lab Components');
  console.log('- 3 Courses');
  console.log('- 5 Projects (3 faculty-assigned, 2 student-proposed)');
  console.log('- 2 Project Requests (1 pending, 1 approved)');
  console.log('- 2 Project Submissions (1 submitted, 1 graded)');
  console.log('==================================================');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
