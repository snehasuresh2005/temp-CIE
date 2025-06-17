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
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@college.edu',
      name: 'System Administrator',
      password: hashedPassword,
      role: 'ADMIN',
      phone: '+91-9876543210',
    },
  });

  const admin = await prisma.admin.create({
    data: {
      userId: adminUser.id,
      department: 'Information Technology',
      office: 'Admin Block - 201',
      workingHours: '9:00 AM - 5:00 PM',
      permissions: ['MANAGE_USERS', 'MANAGE_COURSES', 'MANAGE_COMPONENTS', 'ASSIGN_FACULTY'],
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

  const faculties = [];
  for (const fac of facultyData) {
    const facultyUser = await prisma.user.create({
      data: {
        email: fac.email,
        name: fac.name,
        password: hashedPassword,
        role: 'FACULTY',
        phone: fac.phone,
      },
    });

    const faculty = await prisma.faculty.create({
      data: {
        userId: facultyUser.id,
        employeeId: fac.employeeId,
        department: fac.department,
        office: fac.office,
        specialization: fac.specialization,
        officeHours: '10:00 AM - 4:00 PM',
      },
    });

    faculties.push(faculty);
  }

  // Create Student Users and Student records (30 students, 10 in each section)
  const sections = ['A', 'B', 'C'];
  const programs = ['BTech CSE', 'BTech IT', 'BTech ECE'];
  const students = [];

  for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
    const section = sections[sectionIndex];
    const program = programs[sectionIndex];

    for (let i = 1; i <= 10; i++) {
      const studentNumber = (sectionIndex * 10 + i).toString().padStart(3, '0');
      const studentUser = await prisma.user.create({
        data: {
          email: `student${studentNumber}@college.edu`,
          name: `Student ${studentNumber}`,
          password: hashedPassword,
          role: 'STUDENT',
          phone: `+91-98765432${studentNumber.slice(-2)}`,
        },
      });

      const student = await prisma.student.create({
        data: {
          userId: studentUser.id,
          studentId: `STU${studentNumber}`,
          program: program,
          year: '2024',
          section: section,
          gpa: 7.5 + Math.random() * 2.5, // Random GPA between 7.5 and 10
          advisorId: faculties[sectionIndex].id,
        },
      });

      students.push(student);
    }
  }

  // Create Courses (3 courses, one for each faculty)
  const courseData = [
    {
      code: 'CSE301',
      name: 'Data Structures and Algorithms',
      description: 'Comprehensive study of data structures, algorithms, and their analysis',
      credits: 4,
      department: 'Computer Science',
      semester: 'Fall 2024',
      maxStudents: 40,
      sections: ['A'],
      facultyId: faculties[0].id,
    },
    {
      code: 'IT302',
      name: 'Web Development',
      description: 'Full-stack web development using modern technologies',
      credits: 3,
      department: 'Information Technology',
      semester: 'Fall 2024',
      maxStudents: 40,
      sections: ['B'],
      facultyId: faculties[1].id,
    },
    {
      code: 'ECE303',
      name: 'Digital Electronics',
      description: 'Digital circuits, logic gates, and microprocessor fundamentals',
      credits: 4,
      department: 'Electronics',
      semester: 'Fall 2024',
      maxStudents: 40,
      sections: ['C'],
      facultyId: faculties[2].id,
    },
  ];

  const courses = [];
  for (const courseInfo of courseData) {
    const course = await prisma.course.create({
      data: {
        ...courseInfo,
        enrolledStudents: 10, // 10 students per section
      },
    });
    courses.push(course);
  }

  // Create Enrollments (students enrolled in their respective section courses)
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const courseIndex = Math.floor(i / 10); // 0, 1, or 2 based on section
    const course = courses[courseIndex];

    await prisma.enrollment.create({
      data: {
        studentId: student.id,
        courseId: course.id,
        section: student.section,
      },
    });
  }

  // Create Class Schedules
  const scheduleData = [
    { courseIndex: 0, dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:30', room: 'CS-101' },
    { courseIndex: 0, dayOfWeek: 'Wednesday', startTime: '09:00', endTime: '10:30', room: 'CS-101' },
    { courseIndex: 1, dayOfWeek: 'Tuesday', startTime: '11:00', endTime: '12:30', room: 'IT-201' },
    { courseIndex: 1, dayOfWeek: 'Thursday', startTime: '11:00', endTime: '12:30', room: 'IT-201' },
    { courseIndex: 2, dayOfWeek: 'Monday', startTime: '14:00', endTime: '15:30', room: 'ECE-301' },
    { courseIndex: 2, dayOfWeek: 'Friday', startTime: '14:00', endTime: '15:30', room: 'ECE-301' },
  ];

  for (const schedule of scheduleData) {
    const course = courses[schedule.courseIndex];
    await prisma.classSchedule.create({
      data: {
        courseId: course.id,
        facultyId: course.facultyId,
        room: schedule.room,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        section: course.sections[0],
      },
    });
  }

  // Create Lab Components (4 components)
  const labComponents = [
    {
      name: 'Arduino Uno R3',
      description: 'Microcontroller development board based on ATmega328P',
      imageUrl: '/images/arduino-uno.jpg',
      totalQuantity: 20,
      availableQuantity: 15,
      category: 'Microcontrollers',
    },
    {
      name: 'Breadboard (Half-size)',
      description: 'Solderless prototyping breadboard for electronic circuits',
      imageUrl: '/images/breadboard.jpg',
      totalQuantity: 30,
      availableQuantity: 25,
      category: 'Prototyping',
    },
    {
      name: 'Digital Multimeter',
      description: 'Handheld digital multimeter for electrical measurements',
      imageUrl: '/images/multimeter.jpg',
      totalQuantity: 15,
      availableQuantity: 10,
      category: 'Measuring Instruments',
    },
    {
      name: 'Raspberry Pi 4',
      description: 'Single-board computer for IoT and embedded projects',
      imageUrl: '/images/raspberry-pi.jpg',
      totalQuantity: 12,
      availableQuantity: 8,
      category: 'Single Board Computers',
    },
  ];

  const components = [];
  for (const comp of labComponents) {
    const component = await prisma.labComponent.create({
      data: comp,
    });
    components.push(component);
  }

  // Create Projects (one project per course)
  const projectData = [
    {
      title: 'Binary Search Tree Implementation',
      description: 'Implement a complete binary search tree with insertion, deletion, and traversal operations',
      courseIndex: 0,
      section: 'A',
      maxMarks: 100,
      assignedDate: new Date('2024-09-01'),
      dueDate: new Date('2024-09-30'),
    },
    {
      title: 'E-commerce Website',
      description: 'Build a full-stack e-commerce website with user authentication and payment integration',
      courseIndex: 1,
      section: 'B',
      maxMarks: 150,
      assignedDate: new Date('2024-09-15'),
      dueDate: new Date('2024-10-30'),
    },
    {
      title: 'Digital Clock with Alarm',
      description: 'Design and implement a digital clock with alarm functionality using digital circuits',
      courseIndex: 2,
      section: 'C',
      maxMarks: 120,
      assignedDate: new Date('2024-09-10'),
      dueDate: new Date('2024-10-15'),
    },
  ];

  const projects = [];
  for (const proj of projectData) {
    const course = courses[proj.courseIndex];
    const project = await prisma.project.create({
      data: {
        title: proj.title,
        description: proj.description,
        courseId: course.id,
        facultyId: course.facultyId,
        section: proj.section,
        assignedDate: proj.assignedDate,
        dueDate: proj.dueDate,
        maxMarks: proj.maxMarks,
        attachments: [`/attachments/project_${proj.courseIndex + 1}_instructions.pdf`],
      },
    });
    projects.push(project);
  }

  // Create Project Submissions (some students have submitted, others haven't)
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const projectIndex = Math.floor(i / 10);
    const project = projects[projectIndex];

    // Only 60% of students have submitted so far
    if (Math.random() < 0.6) {
      const isGraded = Math.random() < 0.5; // 50% of submissions are graded
      await prisma.projectSubmission.create({
        data: {
          projectId: project.id,
          studentId: student.id,
          content: `This is the project submission for ${project.title} by ${student.studentId}. The implementation includes all required features and has been thoroughly tested.`,
          attachments: [`/submissions/${student.studentId}_${project.title.replace(/\s+/g, '_').toLowerCase()}.zip`],
          marks: isGraded ? Math.floor(60 + Math.random() * 40) : null, // Random marks between 60-100
          feedback: isGraded ? 'Good work! Consider adding more error handling and documentation.' : null,
          status: isGraded ? 'GRADED' : 'SUBMITTED',
          submissionDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
        },
      });
    }
  }

  // Create Component Requests (students requesting lab components)
  const requestStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'COLLECTED', 'RETURNED'];
  
  for (let i = 0; i < 20; i++) { // Create 20 component requests
    const student = students[Math.floor(Math.random() * students.length)];
    const component = components[Math.floor(Math.random() * components.length)];
    const faculty = faculties[Math.floor(Math.random() * faculties.length)];
    const status = requestStatuses[Math.floor(Math.random() * requestStatuses.length)];
    
    const requestDate = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000); // Random date within last 60 days
    const expectedReturnDate = new Date(requestDate.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days after request
    
    await prisma.componentRequest.create({
      data: {
        studentId: student.id,
        componentId: component.id,
        facultyId: status === 'PENDING' ? null : faculty.id,
        quantity: Math.floor(Math.random() * 3) + 1, // 1-3 quantity
        requestDate: requestDate,
        expectedReturnDate: expectedReturnDate,
        collectionDate: ['COLLECTED', 'RETURNED'].includes(status) ? 
          new Date(requestDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
        returnDate: status === 'RETURNED' ? 
          new Date(expectedReturnDate.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
        status: status as any,
        notes: `Request for ${component.name} for project work`,
        facultyNotes: status !== 'PENDING' ? 
          (status === 'REJECTED' ? 'Component not available for requested duration' : 'Approved for academic use') : 
          null,
      },
    });
  }

  // Create Locations
  const locations = [
    {
      name: 'Computer Science Lab 1',
      building: 'CS Block',
      floor: '3rd Floor',
      capacity: 40,
      type: 'LABORATORY',
      facilities: ['Computers', 'Projector', 'Whiteboard', 'Air Conditioning'],
    },
    {
      name: 'IT Lab 2',
      building: 'IT Block',
      floor: '2nd Floor',
      capacity: 35,
      type: 'LABORATORY',
      facilities: ['Computers', 'Network Equipment', 'Servers', 'Projector'],
    },
    {
      name: 'Electronics Lab',
      building: 'ECE Block',
      floor: '4th Floor',
      capacity: 30,
      type: 'LABORATORY',
      facilities: ['Oscilloscopes', 'Function Generators', 'Power Supplies', 'Component Storage'],
    },
    {
      name: 'Main Auditorium',
      building: 'Main Block',
      floor: 'Ground Floor',
      capacity: 200,
      type: 'AUDITORIUM',
      facilities: ['Sound System', 'Projector', 'Stage', 'Air Conditioning'],
    },
  ];

  for (const loc of locations) {
    await prisma.location.create({
      data: loc as any,
    });
  }

  // Create some Attendance Records
  for (let i = 0; i < courses.length; i++) {
    const course = courses[i];
    const faculty = faculties[i];
    const sectionStudents = students.slice(i * 10, (i + 1) * 10);
    
    // Create attendance for last 5 days
    for (let day = 0; day < 5; day++) {
      const attendanceDate = new Date(Date.now() - day * 24 * 60 * 60 * 1000);
      
      const attendanceRecord = await prisma.attendanceRecord.create({
        data: {
          courseId: course.id,
          facultyId: faculty.id,
          section: course.sections[0],
          date: attendanceDate,
        },
      });

      // Mark attendance for each student in the section
      for (const student of sectionStudents) {
        const attendanceStatus = Math.random() < 0.85 ? 'PRESENT' : (Math.random() < 0.7 ? 'ABSENT' : 'LATE');
        
        await prisma.studentAttendance.create({
          data: {
            attendanceRecordId: attendanceRecord.id,
            studentId: student.id,
            status: attendanceStatus as any,
          },
        });
      }
    }
  }

  console.log('Database seeded successfully!');
  console.log('='.repeat(50));
  console.log('LOGIN CREDENTIALS:');
  console.log('='.repeat(50));
  console.log('Admin:');
  console.log('  Email: admin@college.edu');
  console.log('  Password: password123');
  console.log('');
  console.log('Faculty:');
  console.log('  Dr. Rajesh Kumar - rajesh.kumar@college.edu');
  console.log('  Prof. Priya Sharma - priya.sharma@college.edu');
  console.log('  Dr. Amit Patel - amit.patel@college.edu');
  console.log('  Password: password123 (for all)');
  console.log('');
  console.log('Students:');
  console.log('  student001@college.edu to student030@college.edu');
  console.log('  Password: password123 (for all)');
  console.log('='.repeat(50));
  console.log('SUMMARY:');
  console.log(`- 1 Admin with full permissions`);
  console.log(`- 3 Faculty members (one per course/section)`);
  console.log(`- 30 Students (10 per section A, B, C)`);
  console.log(`- 3 Courses with enrollments and schedules`);
  console.log(`- 4 Lab Components available for requests`);
  console.log(`- 3 Projects assigned with partial submissions`);
  console.log(`- 20 Component requests with various statuses`);
  console.log(`- Attendance records for last 5 days`);
  console.log(`- 4 Locations (labs and auditorium)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
