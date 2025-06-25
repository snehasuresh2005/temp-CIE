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
    where: { email: 'cie.admin@pes.edu' },
    include: { admin: true }
  });

  if (!adminUser) {
    // Hash password for admin user
    const hashedPassword = await hash('password123', 10);

    // Create Admin User
    adminUser = await prisma.user.create({
      data: {
        email: 'cie.admin@pes.edu',
        name: 'Admin',
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
        faculty_id: 'FAC001',
        department: 'Computer Science',
        office: 'CS Block - 301',
        specialization: 'Data Structures and Algorithms',
        phone: '+91-9876543211',
      },
      {
        name: 'Prof. Priya Sharma',
        email: 'priya.sharma@college.edu',
        faculty_id: 'FAC002',
        department: 'Information Technology',
        office: 'IT Block - 205',
        specialization: 'Web Development and Databases',
        phone: '+91-9876543212',
      },
      {
        name: 'Dr. Amit Patel',
        email: 'amit.patel@college.edu',
        faculty_id: 'FAC003',
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
                faculty_id: fac.faculty_id,
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

  // Count users to confirm creation
  const userCount = await prisma.user.count();
  const adminCount = await prisma.admin.count();
  const facultyCount = await prisma.faculty.count();
  const studentCount = await prisma.student.count();

  console.log('✅ Database seeded with users only!');
  console.log(`📊 User counts:`);
  console.log(`   - Total Users: ${userCount}`);
  console.log(`   - Admins: ${adminCount}`);
  console.log(`   - Faculty: ${facultyCount}`);
  console.log(`   - Students: ${studentCount}`);
  console.log('');
  console.log('🔑 Login Credentials:');
  console.log('   Admin: admin@college.edu / password123');
  console.log('   Faculty: rajesh.kumar@college.edu / password123');
  console.log('   Student: student001@college.edu / password123');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
