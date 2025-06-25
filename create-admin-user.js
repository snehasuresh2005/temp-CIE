import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        email: 'admin@cie.edu'
      }
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      console.log('User ID:', existingAdmin.id);
      return existingAdmin.id;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@cie.edu',
        name: 'System Administrator',
        password: hashedPassword,
        role: 'ADMIN',
        phone: '+1234567890'
      }
    });

    // Create admin profile
    const adminProfile = await prisma.admin.create({
      data: {
        department: 'IT',
        office: 'Main Building, Room 101',
        permissions: ['manage_locations', 'manage_users', 'manage_courses'],
        working_hours: '9:00 AM - 5:00 PM',
        user_id: adminUser.id
      }
    });

    console.log('Admin user created successfully!');
    console.log('User ID:', adminUser.id);
    console.log('Email: admin@cie.edu');
    console.log('Password: admin123');
    
    return adminUser.id;
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser(); 