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
  
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 