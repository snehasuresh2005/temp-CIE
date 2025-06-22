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

  // Check if admin user exists, if not create one
  let adminUser = await prisma.user.findUnique({
    where: { email: 'admin@college.edu' },
    include: { admin: true }
  });

  if (!adminUser) {
    // Hash password for admin user
    const hashedPassword = await hash('password123', 10);

    // Create Admin User
    adminUser = await prisma.user.create({
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
            working_hours: '9:00 AM - 5:00 PM',
            permissions: ['MANAGE_USERS', 'MANAGE_COURSES', 'MANAGE_COMPONENTS', 'ASSIGN_FACULTY'],
          },
        },
      },
      include: { admin: true }
    });
  }

  // Check if faculty users exist, if not create them
  const facultyEmails = [
    'rajesh.kumar@college.edu',
    'priya.sharma@college.edu', 
    'amit.patel@college.edu'
  ];

  const existingFaculty = await prisma.user.findMany({
    where: { 
      email: { in: facultyEmails },
      role: 'FACULTY'
    },
    include: { faculty: true }
  });

  let createdFaculty = existingFaculty;

  if (existingFaculty.length < 3) {
    // Hash password for faculty users
    const hashedPassword = await hash('password123', 10);

    // Create Faculty Users and Faculty records
    const facultyData = [
      {
        name: 'Dr. Rajesh Kumar',
        email: 'rajesh.kumar@college.edu',
        employee_id: 'FAC001',
        department: 'Computer Science',
        office: 'CS Block - 301',
        specialization: 'Data Structures and Algorithms',
        phone: '+91-9876543211',
      },
      {
        name: 'Prof. Priya Sharma',
        email: 'priya.sharma@college.edu',
        employee_id: 'FAC002',
        department: 'Information Technology',
        office: 'IT Block - 205',
        specialization: 'Web Development and Databases',
        phone: '+91-9876543212',
      },
      {
        name: 'Dr. Amit Patel',
        email: 'amit.patel@college.edu',
        employee_id: 'FAC003',
        department: 'Electronics',
        office: 'ECE Block - 401',
        specialization: 'Digital Electronics and Microprocessors',
        phone: '+91-9876543213',
      },
    ];

    for (const fac of facultyData) {
      const existingFacultyUser = existingFaculty.find(f => f.email === fac.email);
      if (!existingFacultyUser) {
        const faculty = await prisma.user.create({
          data: {
            email: fac.email,
            name: fac.name,
            password: hashedPassword,
            role: 'FACULTY',
            phone: fac.phone,
            faculty: {
              create: {
                employee_id: fac.employee_id,
                department: fac.department,
                office: fac.office,
                specialization: fac.specialization,
                office_hours: '10:00 AM - 4:00 PM',
              },
            },
          },
          include: {
            faculty: true,
          },
        });
        createdFaculty.push(faculty);
      }
    }
  }

  // Check if students exist, if not create them
  const existingStudents = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    include: { student: true }
  });

  let createdStudents = existingStudents;

  if (existingStudents.length < 30) {
    // Hash password for students
    const hashedPassword = await hash('password123', 10);

    // Create Student Users and Student records (30 students, 10 in each section)
    const sections = ['A', 'B', 'C'];
    const programs = ['BTech CSE', 'BTech IT', 'BTech ECE'];

    for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
      const section = sections[sectionIndex];
      const program = programs[sectionIndex];

      for (let i = 1; i <= 10; i++) {
        const studentNumber = (sectionIndex * 10 + i).toString().padStart(3, '0');
        const studentEmail = `student${studentNumber}@college.edu`;
        
        const existingStudent = existingStudents.find(s => s.email === studentEmail);
        if (!existingStudent) {
          const student = await prisma.user.create({
            data: {
              email: studentEmail,
              name: `Student ${studentNumber}`,
              password: hashedPassword,
              role: 'STUDENT',
              phone: `+91-98765432${studentNumber.slice(-2)}`,
              student: {
                create: {
                  student_id: `STU${studentNumber}`,
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
      created_at: new Date("2025-01-15"),
      modified_at: new Date("2025-01-15"),
      modified_by: "admin@college.edu",
      front_image_id: "1750407666642_WhatsApp Image 2025-06-19 at 21.50.46.jpeg",
      back_image_id: "1750407666802_WhatsApp Image 2025-06-19 at 21.50.46 (1).jpeg",
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
      created_at: new Date("2025-01-20"),
      modified_at: new Date("2025-01-20"),
      modified_by: "admin@college.edu",
      front_image_id: "1750407782990_WhatsApp Image 2025-06-19 at 21.50.46.jpeg",
      back_image_id: "1750407783156_WhatsApp Image 2025-06-19 at 21.50.46 (1).jpeg",
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
      created_at: new Date("2025-01-25"),
      modified_at: new Date("2025-01-25"),
      modified_by: "admin@college.edu",
      front_image_id: "1750438528462_WhatsApp Image 2025-06-19 at 21.50.46.jpeg",
      back_image_id: "1750438528325_WhatsApp Image 2025-06-19 at 21.50.46 (1).jpeg",
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
      created_at: new Date("2025-01-30"),
      modified_at: new Date("2025-01-30"),
      modified_by: "admin@college.edu",
      front_image_id: "1750530167779_WhatsApp Image 2025-06-19 at 21.50.46.jpeg",
      back_image_id: "1750530167770_WhatsApp Image 2025-06-19 at 21.50.46 (1).jpeg",
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
      created_at: new Date("2025-02-01"),
      modified_at: new Date("2025-02-01"),
      modified_by: "admin@college.edu",
      front_image_id: "1750532640406_WhatsApp Image 2025-06-19 at 21.50.44.jpeg",
      back_image_id: "1750532640419_WhatsApp Image 2025-06-19 at 21.50.45.jpeg",
    },
    {
      component_name: "Resistor Kit 1/4W",
      component_description: "Assorted resistor kit with various resistance values",
      component_specification: "Power Rating: 1/4W, Tolerance: 5%, Values: 10Ω to 1MΩ",
      component_quantity: 100,
      component_tag_id: "RES-001",
      component_category: "Passive Components",
      component_location: "Storage Room",
      invoice_number: "INV-2025-006",
      purchase_value: 200.00,
      purchased_from: "Amazon",
      purchase_currency: "INR",
      purchase_date: new Date("2025-02-05"),
      created_by: "admin@college.edu",
      created_at: new Date("2025-02-05"),
      modified_at: new Date("2025-02-05"),
      modified_by: "admin@college.edu",
      front_image_id: "1750599363549_WhatsApp Image 2025-06-19 at 21.50.46.jpeg",
      back_image_id: "1750599363541_WhatsApp Image 2025-06-19 at 21.50.46 (1).jpeg",
    },
    {
      component_name: "Capacitor Kit",
      component_description: "Assorted ceramic and electrolytic capacitors",
      component_specification: "Ceramic: 1pF to 1μF, Electrolytic: 1μF to 1000μF",
      component_quantity: 80,
      component_tag_id: "CAP-001",
      component_category: "Passive Components",
      component_location: "Storage Room",
      invoice_number: "INV-2025-007",
      purchase_value: 180.00,
      purchased_from: "Robu.in",
      purchase_currency: "INR",
      purchase_date: new Date("2025-02-10"),
      created_by: "admin@college.edu",
      created_at: new Date("2025-02-10"),
      modified_at: new Date("2025-02-10"),
      modified_by: "admin@college.edu",
      front_image_id: "placeholder.jpg",
      back_image_id: null,
    },
    {
      component_name: "Jumper Wires Male-Male",
      component_description: "40-piece male-to-male jumper wire set",
      component_specification: "Length: 20cm, Connector: Male-Male, Color: Assorted",
      component_quantity: 200,
      component_tag_id: "WIRE-001",
      component_category: "Connectors",
      component_location: "Lab A",
      invoice_number: "INV-2025-008",
      purchase_value: 120.00,
      purchased_from: "Amazon",
      purchase_currency: "INR",
      purchase_date: new Date("2025-02-15"),
      created_by: "admin@college.edu",
      created_at: new Date("2025-02-15"),
      modified_at: new Date("2025-02-15"),
      modified_by: "admin@college.edu",
      front_image_id: "placeholder.jpg",
      back_image_id: null,
    },
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
      max_students: 60,
      sections: ["A", "B"],
      faculty_id: createdFaculty[0].faculty.id, // Dr. Rajesh Kumar
    },
    {
      code: "IT401",
      name: "Web Development",
      description: "Modern web development with React and Node.js",
      credits: 3,
      department: "Information Technology",
      semester: "Fall 2024",
      max_students: 45,
      sections: ["A", "B"],
      faculty_id: createdFaculty[1].faculty.id, // Prof. Priya Sharma
    },
    {
      code: "EC305",
      name: "Digital Electronics",
      description: "Fundamentals of digital logic and circuit design",
      credits: 3,
      department: "Electronics",
      semester: "Fall 2024",
      max_students: 50,
      sections: ["C"],
      faculty_id: createdFaculty[2].faculty.id, // Dr. Amit Patel
    },
  ];

  const createdCourses = [];
  for (const course of courses) {
    const createdCourse = await prisma.course.create({
      data: course,
    });
    createdCourses.push(createdCourse);
  }

  // Create projects
  const projects = [
    {
      name: "Smart Home Automation System",
      description: "Design and implement a smart home automation system using Arduino and various sensors. The system should control lighting, temperature, and security.",
      course_id: createdCourses[0].id,
      components_needed: [createdComponents[0].id, createdComponents[2].id, createdComponents[3].id],
      expected_completion_date: new Date("2025-03-15"),
      created_by: createdFaculty[0].faculty?.id || '',
      type: 'FACULTY_ASSIGNED' as const,
    },
    {
      name: "E-commerce Website Development",
      description: "Build a full-stack e-commerce website using React for frontend and Node.js for backend. Include user authentication, product catalog, and payment gateway integration.",
      course_id: createdCourses[1].id,
      components_needed: [createdComponents[1].id],
      expected_completion_date: new Date("2025-03-20"),
      created_by: createdFaculty[1].faculty?.id || '',
      type: 'FACULTY_ASSIGNED' as const,
    },
    {
      name: "Digital Clock with 7-Segment Display",
      description: "Create a digital clock using Arduino and 7-segment displays. Include time setting functionality and alarm features.",
      course_id: createdCourses[2].id,
      components_needed: [createdComponents[0].id, createdComponents[2].id],
      expected_completion_date: new Date("2025-03-25"),
      created_by: createdFaculty[2].faculty?.id || '',
      type: 'FACULTY_ASSIGNED' as const,
    },
  ];

  const createdProjects = [];
  for (const project of projects) {
    const createdProject = await prisma.project.create({
      data: project,
    });
    createdProjects.push(createdProject);
  }

  // Create locations
  const locations = [
    {
      name: "Computer Lab A",
      description: "Main computer laboratory with 30 workstations",
      type: "LAB" as const,
      capacity: 30,
      contact_person: "Dr. Rajesh Kumar",
      contact_email: "rajesh.kumar@college.edu",
      contact_phone: "+91-9876543211",
      is_available: true,
    },
    {
      name: "Electronics Lab B",
      description: "Electronics and embedded systems laboratory",
      type: "LAB" as const,
      capacity: 25,
      contact_person: "Dr. Amit Patel",
      contact_email: "amit.patel@college.edu",
      contact_phone: "+91-9876543213",
      is_available: true,
    },
    {
      name: "IT Lab C",
      description: "Information Technology laboratory for web development",
      type: "LAB" as const,
      capacity: 20,
      contact_person: "Prof. Priya Sharma",
      contact_email: "priya.sharma@college.edu",
      contact_phone: "+91-9876543212",
      is_available: true,
    },
    {
      name: "Storage Room",
      description: "Central storage for lab components and equipment",
      type: "WAREHOUSE" as const,
      capacity: null,
      contact_person: "System Administrator",
      contact_email: "admin@college.edu",
      contact_phone: "+91-9876543210",
      is_available: true,
    },
    {
      name: "Lecture Hall 101",
      description: "Main lecture hall for theoretical classes",
      type: "CLASSROOM" as const,
      capacity: 60,
      contact_person: "System Administrator",
      contact_email: "admin@college.edu",
      contact_phone: "+91-9876543210",
      is_available: true,
    },
  ];

  const createdLocations = [];
  for (const location of locations) {
    const createdLocation = await prisma.location.create({
      data: location,
    });
    createdLocations.push(createdLocation);
  }

  // Create class schedules
  const classSchedules = [
    {
      course_id: createdCourses[0].id,
      faculty_id: createdFaculty[0].faculty?.id || '',
      room: "Lecture Hall 101",
      day_of_week: "Monday",
      start_time: "09:00",
      end_time: "10:30",
      section: "A",
    },
    {
      course_id: createdCourses[0].id,
      faculty_id: createdFaculty[0].faculty?.id || '',
      room: "Lecture Hall 101",
      day_of_week: "Wednesday",
      start_time: "09:00",
      end_time: "10:30",
      section: "A",
    },
    {
      course_id: createdCourses[0].id,
      faculty_id: createdFaculty[0].faculty?.id || '',
      room: "Computer Lab A",
      day_of_week: "Friday",
      start_time: "14:00",
      end_time: "17:00",
      section: "A",
    },
    {
      course_id: createdCourses[1].id,
      faculty_id: createdFaculty[1].faculty?.id || '',
      room: "IT Lab C",
      day_of_week: "Tuesday",
      start_time: "10:30",
      end_time: "12:00",
      section: "A",
    },
    {
      course_id: createdCourses[1].id,
      faculty_id: createdFaculty[1].faculty?.id || '',
      room: "IT Lab C",
      day_of_week: "Thursday",
      start_time: "10:30",
      end_time: "12:00",
      section: "A",
    },
    {
      course_id: createdCourses[2].id,
      faculty_id: createdFaculty[2].faculty?.id || '',
      room: "Electronics Lab B",
      day_of_week: "Monday",
      start_time: "14:00",
      end_time: "15:30",
      section: "C",
    },
    {
      course_id: createdCourses[2].id,
      faculty_id: createdFaculty[2].faculty?.id || '',
      room: "Electronics Lab B",
      day_of_week: "Wednesday",
      start_time: "14:00",
      end_time: "15:30",
      section: "C",
    },
  ];

  for (const schedule of classSchedules) {
    await prisma.classSchedule.create({
      data: schedule,
    });
  }

  // Create attendance records (for the past week)
  const attendanceRecords = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Only create records for weekdays
    const dayOfWeek = date.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
      attendanceRecords.push({
        course_id: createdCourses[0].id,
        faculty_id: createdFaculty[0].faculty?.id || '',
        section: "A",
        date: date,
      });
      attendanceRecords.push({
        course_id: createdCourses[1].id,
        faculty_id: createdFaculty[1].faculty?.id || '',
        section: "A",
        date: date,
      });
      attendanceRecords.push({
        course_id: createdCourses[2].id,
        faculty_id: createdFaculty[2].faculty?.id || '',
        section: "C",
        date: date,
      });
    }
  }

  const createdAttendanceRecords = [];
  for (const record of attendanceRecords) {
    const createdRecord = await prisma.attendanceRecord.create({
      data: record,
    });
    createdAttendanceRecords.push(createdRecord);
  }

  // Create student attendance records
  for (const record of createdAttendanceRecords) {
    const studentsInSection = createdStudents.filter(
      student => student.student?.section === record.section
    );
    
    for (const student of studentsInSection) {
      if (!student.student) continue;
      // Randomly assign attendance status
      const statuses = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const;
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      await prisma.studentAttendance.create({
        data: {
          attendance_record_id: record.id,
          student_id: student.student.id,
          status: randomStatus,
        },
      });
    }
  }

  // Create component requests
  const componentRequests = [
    {
      student_id: createdStudents[0].student?.id || '',
      component_id: createdComponents[0].id,
      project_id: createdProjects[0].id,
      quantity: 2,
      purpose: "Building smart home automation system for course project",
      required_date: new Date("2025-02-15"),
      status: "APPROVED" as const,
      approved_date: new Date("2025-02-10"),
      approved_by: createdFaculty[0].faculty?.id || '',
      notes: "Approved for course project",
    },
    {
      student_id: createdStudents[1].student?.id || '',
      component_id: createdComponents[1].id,
      project_id: createdProjects[1].id,
      quantity: 1,
      purpose: "Web development project server setup",
      required_date: new Date("2025-02-20"),
      status: "PENDING" as const,
      notes: "Waiting for faculty approval",
    },
    {
      student_id: createdStudents[2].student?.id || '',
      component_id: createdComponents[2].id,
      project_id: createdProjects[2].id,
      quantity: 3,
      purpose: "Circuit prototyping for digital clock project",
      required_date: new Date("2025-02-18"),
      status: "APPROVED" as const,
      approved_date: new Date("2025-02-12"),
      approved_by: createdFaculty[2].faculty?.id || '',
      notes: "Approved for electronics project",
    },
  ];

  for (const request of componentRequests) {
    await prisma.componentRequest.create({
      data: request,
    });
  }

  // Create project submissions
  const projectSubmissions = [
    {
      project_id: createdProjects[0].id,
      student_id: createdStudents[0].student?.id || '',
      content: "Smart Home Automation System - Phase 1 completed. Arduino code implemented with basic sensor integration. Documentation attached.",
      attachments: ["project_report.pdf", "arduino_code.ino", "circuit_diagram.png"],
      marks: 85,
      feedback: "Excellent work on the basic implementation. Consider adding more sensors for enhanced functionality.",
      status: "GRADED" as const,
    },
    {
      project_id: createdProjects[1].id,
      student_id: createdStudents[1].student?.id || '',
      content: "E-commerce Website - Frontend completed with React. Backend API development in progress.",
      attachments: ["frontend_code.zip", "api_documentation.md"],
      marks: null,
      feedback: null,
      status: "SUBMITTED" as const,
    },
  ];

  for (const submission of projectSubmissions) {
    await prisma.projectSubmission.create({
      data: submission,
    });
  }

  // Create project requests (student-proposed projects)
  const projectRequests = [
    {
      project_id: createdProjects[0].id,
      student_id: createdStudents[5].student?.id || '',
      faculty_id: createdFaculty[0].faculty?.id || '',
      request_date: new Date("2025-02-01"),
      status: "APPROVED" as const,
      student_notes: "I would like to work on this project as it aligns with my interest in IoT and automation.",
      faculty_notes: "Approved. Student has shown good understanding of the concepts.",
      accepted_date: new Date("2025-02-03"),
    },
    {
      project_id: createdProjects[1].id,
      student_id: createdStudents[6].student?.id || '',
      faculty_id: createdFaculty[1].faculty?.id || '',
      request_date: new Date("2025-02-05"),
      status: "PENDING" as const,
      student_notes: "Interested in full-stack development and would like to work on this e-commerce project.",
      faculty_notes: null,
    },
  ];

  for (const request of projectRequests) {
    await prisma.projectRequest.create({
      data: request,
    });
  }

  // Enroll students in courses
  // Enroll all students from section A and B in the first two courses
  for (const student of createdStudents) {
    if (!student.student) continue;
    if (student.student.section === 'A' || student.student.section === 'B') {
      await prisma.enrollment.create({
        data: {
          student_id: student.student.id,
          course_id: createdCourses[0].id,
          section: student.student.section,
        },
      });
      await prisma.enrollment.create({
        data: {
          student_id: student.student.id,
          course_id: createdCourses[1].id,
          section: student.student.section,
        },
      });
    }
    // Enroll students from section C in the third course
    if (student.student.section === 'C') {
      await prisma.enrollment.create({
        data: {
          student_id: student.student.id,
          course_id: createdCourses[2].id,
          section: 'C',
        },
      });
    }
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
