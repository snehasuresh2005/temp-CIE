import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function setupTestData() {
  try {
    console.log('Setting up test data...')

    // Get existing faculty and students
    const faculty = await prisma.faculty.findFirst({
      include: { user: true }
    })
    
    const students = await prisma.student.findMany({
      include: { user: true },
      take: 2
    })

    const courses = await prisma.course.findMany({ take: 1 })

    if (!faculty || students.length === 0 || courses.length === 0) {
      console.error('Required data not found. Please ensure faculty, students, and courses exist.')
      return
    }

    console.log(`Using faculty: ${faculty.user.name}`)
    console.log(`Using students: ${students.map(s => s.user.name).join(', ')}`)
    console.log(`Using course: ${courses[0].name}`)

    // Get available locations
    const locations = await prisma.location.findMany({
      where: { location_type: 'LAB' },
      take: 3
    })

    if (locations.length === 0) {
      console.error('No lab locations found. Please run the seed script first.')
      return
    }

    // Create 5 lab components
    console.log('\nCreating lab components...')
    const components = await Promise.all([
      prisma.labComponent.create({
        data: {
          component_name: 'Arduino Uno R3',
          component_description: 'Microcontroller board based on the ATmega328P',
          component_specification: 'Operating Voltage: 5V, Digital I/O Pins: 14, Analog Input Pins: 6',
          component_quantity: 20,
          component_tag_id: 'ARDUINO-001',
          component_category: 'Microcontrollers',
          component_location: locations[0].name,
          created_by: faculty.user.email,
        }
      }),
      prisma.labComponent.create({
        data: {
          component_name: 'Raspberry Pi 4 Model B',
          component_description: 'Single-board computer with 4GB RAM',
          component_specification: '1.5GHz quad-core ARM Cortex-A72, 4GB LPDDR4 RAM',
          component_quantity: 10,
          component_tag_id: 'RASPBERRY-001',
          component_category: 'Single Board Computers',
          component_location: locations[1]?.name || locations[0].name,
          created_by: faculty.user.email,
        }
      }),
      prisma.labComponent.create({
        data: {
          component_name: 'DHT22 Temperature Sensor',
          component_description: 'Digital temperature and humidity sensor',
          component_specification: 'Temperature Range: -40°C to 80°C, Humidity Range: 0-100%',
          component_quantity: 30,
          component_tag_id: 'SENSOR-001',
          component_category: 'Sensors',
          component_location: locations[0].name,
          created_by: faculty.user.email,
        }
      }),
      prisma.labComponent.create({
        data: {
          component_name: '16x2 LCD Display',
          component_description: 'Liquid Crystal Display with 16 columns and 2 rows',
          component_specification: 'Operating Voltage: 5V, Interface: I2C/SPI',
          component_quantity: 25,
          component_tag_id: 'DISPLAY-001',
          component_category: 'Displays',
          component_location: locations[2]?.name || locations[0].name,
          created_by: faculty.user.email,
        }
      }),
      prisma.labComponent.create({
        data: {
          component_name: 'Servo Motor SG90',
          component_description: 'Micro servo motor for precise positioning',
          component_specification: 'Operating Voltage: 4.8V-6V, Torque: 1.8kg/cm',
          component_quantity: 40,
          component_tag_id: 'MOTOR-001',
          component_category: 'Motors',
          component_location: locations[1]?.name || locations[0].name,
          created_by: faculty.user.email,
        }
      })
    ])

    console.log(`Created ${components.length} components`)

    // Create 2 faculty-assigned projects
    console.log('\nCreating faculty-assigned projects...')
    const facultyProjects = await Promise.all([
      prisma.project.create({
        data: {
          name: 'Smart Home Automation System',
          description: 'Design and implement a smart home automation system using Arduino and sensors',
          components_needed: [components[0].id, components[2].id, components[3].id], // Arduino, DHT22, LCD
          expected_completion_date: new Date('2025-03-15'),
          course_id: courses[0].id,
          created_by: faculty.id,
          type: 'FACULTY_ASSIGNED',
          status: 'PENDING',
        }
      }),
      prisma.project.create({
        data: {
          name: 'IoT Weather Station',
          description: 'Build an IoT weather station using Raspberry Pi and various sensors',
          components_needed: [components[1].id, components[2].id, components[4].id], // Raspberry Pi, DHT22, Servo
          expected_completion_date: new Date('2025-04-20'),
          course_id: courses[0].id,
          created_by: faculty.id,
          type: 'FACULTY_ASSIGNED',
          status: 'PENDING',
        }
      })
    ])

    console.log(`Created ${facultyProjects.length} faculty-assigned projects`)

    // Create 2 student-proposed projects
    console.log('\nCreating student-proposed projects...')
    const studentProjects = await Promise.all([
      prisma.project.create({
        data: {
          name: 'Automated Plant Watering System',
          description: 'Create an automated system to water plants based on soil moisture',
          components_needed: [components[0].id, components[2].id, components[4].id], // Arduino, DHT22, Servo
          expected_completion_date: new Date('2025-05-10'),
          course_id: courses[0].id,
          created_by: students[0].id,
          accepted_by: faculty.id,
          type: 'STUDENT_PROPOSED',
          status: 'PENDING',
        }
      }),
      prisma.project.create({
        data: {
          name: 'Digital Notice Board',
          description: 'Build a digital notice board using Raspberry Pi and LCD display',
          components_needed: [components[1].id, components[3].id], // Raspberry Pi, LCD
          expected_completion_date: new Date('2025-06-01'),
          course_id: courses[0].id,
          created_by: students[1].id,
          accepted_by: faculty.id,
          type: 'STUDENT_PROPOSED',
          status: 'PENDING',
        }
      })
    ])

    console.log(`Created ${studentProjects.length} student-proposed projects`)

    // Create project requests for student-proposed projects
    console.log('\nCreating project requests...')
    await Promise.all([
      prisma.projectRequest.create({
        data: {
          project_id: studentProjects[0].id,
          student_id: students[0].id,
          faculty_id: faculty.id,
          status: 'APPROVED',
          accepted_date: new Date(),
        }
      }),
      prisma.projectRequest.create({
        data: {
          project_id: studentProjects[1].id,
          student_id: students[1].id,
          faculty_id: faculty.id,
          status: 'APPROVED',
          accepted_date: new Date(),
        }
      })
    ])

    console.log('Created project requests')

    console.log('\n✅ Test data setup completed!')
    console.log('\nSummary:')
    console.log(`- Components: ${components.length}`)
    console.log(`- Faculty Projects: ${facultyProjects.length}`)
    console.log(`- Student Projects: ${studentProjects.length}`)
    console.log('\nComponent assignments:')
    console.log('1. Smart Home Automation: Arduino, DHT22, LCD')
    console.log('2. IoT Weather Station: Raspberry Pi, DHT22, Servo')
    console.log('3. Plant Watering System: Arduino, DHT22, Servo')
    console.log('4. Digital Notice Board: Raspberry Pi, LCD')

  } catch (error) {
    console.error('Error setting up test data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupTestData() 