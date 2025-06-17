// Centralized data store for the application
export interface LabComponent {
  id: string
  name: string
  description: string
  imageUrl: string
  totalQuantity: number
  availableQuantity: number
  category: string
}

export interface ComponentRequest {
  id: string
  studentId: string
  studentName: string
  studentEmail: string
  componentId: string
  componentName: string
  quantity: number
  requestDate: string
  expectedReturnDate: string
  collectionDate?: string
  returnDate?: string
  status: "pending" | "approved" | "rejected" | "collected" | "returned" | "overdue"
  notes?: string
  facultyNotes?: string
}

export interface ClassSchedule {
  id: string
  courseCode: string
  courseName: string
  facultyId: string
  facultyName: string
  room: string
  dayOfWeek: string
  startTime: string
  endTime: string
  semester: string
  section: string
}

export interface Student {
  id: string
  name: string
  email: string
  studentId: string
  class: string
  section: string
  department: string
}

export interface Faculty {
  id: string
  name: string
  email: string
  department: string
  assignedClasses: string[]
}

export interface Course {
  id: string
  code: string
  name: string
  description: string
  credits: number
  department: string
  semester: string
  instructor: string
  maxStudents: number
  enrolledStudents: number
  status: "active" | "inactive"
  sections: string[]
}

export interface Project {
  id: string
  title: string
  description: string
  courseCode: string
  section: string
  facultyId: string
  facultyName: string
  assignedDate: string
  dueDate: string
  maxMarks: number
  status: "active" | "completed" | "overdue"
  attachments?: string[]
}

export interface ProjectSubmission {
  id: string
  projectId: string
  studentId: string
  studentName: string
  submissionDate: string
  content: string
  attachments?: string[]
  marks?: number
  feedback?: string
  status: "submitted" | "graded" | "late"
}

export interface AttendanceRecord {
  id: string
  courseCode: string
  section: string
  date: string
  facultyId: string
  students: {
    studentId: string
    studentName: string
    status: "present" | "absent" | "late"
  }[]
}

// Mock data
export const labComponents: LabComponent[] = [
  {
    id: "1",
    name: "Arduino Uno R3",
    description: "Microcontroller board based on ATmega328P with USB connection",
    imageUrl: "/placeholder.svg?height=200&width=200",
    totalQuantity: 50,
    availableQuantity: 35,
    category: "Microcontrollers",
  },
  {
    id: "2",
    name: "Breadboard (Half Size)",
    description: "Solderless breadboard for prototyping electronic circuits",
    imageUrl: "/placeholder.svg?height=200&width=200",
    totalQuantity: 30,
    availableQuantity: 22,
    category: "Prototyping",
  },
  {
    id: "3",
    name: "Jumper Wires (40pcs)",
    description: "Male-to-male jumper wires for breadboard connections",
    imageUrl: "/placeholder.svg?height=200&width=200",
    totalQuantity: 25,
    availableQuantity: 18,
    category: "Wires & Cables",
  },
  {
    id: "4",
    name: "LED Kit (Assorted)",
    description: "Pack of 50 LEDs in various colors (red, green, blue, yellow, white)",
    imageUrl: "/placeholder.svg?height=200&width=200",
    totalQuantity: 40,
    availableQuantity: 28,
    category: "Components",
  },
  {
    id: "5",
    name: "Resistor Kit",
    description: "Assorted resistors (1/4W) with common values",
    imageUrl: "/placeholder.svg?height=200&width=200",
    totalQuantity: 20,
    availableQuantity: 15,
    category: "Components",
  },
  {
    id: "6",
    name: "Ultrasonic Sensor HC-SR04",
    description: "Distance measuring sensor module",
    imageUrl: "/placeholder.svg?height=200&width=200",
    totalQuantity: 15,
    availableQuantity: 12,
    category: "Sensors",
  },
]

export const componentRequests: ComponentRequest[] = [
  {
    id: "1",
    studentId: "3",
    studentName: "Jane Doe",
    studentEmail: "student@cie.edu",
    componentId: "1",
    componentName: "Arduino Uno R3",
    quantity: 2,
    requestDate: "2024-01-15",
    expectedReturnDate: "2024-01-29",
    status: "pending",
    notes: "Need for final project - IoT weather station",
  },
  {
    id: "2",
    studentId: "4",
    studentName: "Mike Johnson",
    studentEmail: "mike.johnson@cie.edu",
    componentId: "2",
    componentName: "Breadboard (Half Size)",
    quantity: 1,
    requestDate: "2024-01-14",
    expectedReturnDate: "2024-01-30",
    status: "approved",
    notes: "Circuit prototyping assignment",
  },
]

export const courses: Course[] = [
  {
    id: "1",
    code: "CS101",
    name: "Introduction to Computer Science",
    description: "Basic concepts of computer science and programming fundamentals",
    credits: 3,
    department: "Computer Science",
    semester: "Fall 2024",
    instructor: "Dr. John Smith",
    maxStudents: 90,
    enrolledStudents: 75,
    status: "active",
    sections: ["A", "B", "C"],
  },
  {
    id: "2",
    code: "CS201",
    name: "Data Structures and Algorithms",
    description: "Advanced programming concepts, data structures, and algorithm analysis",
    credits: 4,
    department: "Computer Science",
    semester: "Spring 2024",
    instructor: "Dr. John Smith",
    maxStudents: 75,
    enrolledStudents: 66,
    status: "active",
    sections: ["A", "B", "C"],
  },
  {
    id: "3",
    code: "MATH101",
    name: "Calculus I",
    description: "Differential and integral calculus of functions of one variable",
    credits: 4,
    department: "Mathematics",
    semester: "Fall 2024",
    instructor: "Dr. Sarah Johnson",
    maxStudents: 105,
    enrolledStudents: 90,
    status: "active",
    sections: ["A", "B", "C"],
  },
]

export const classSchedules: ClassSchedule[] = [
  // CS101 - Section A
  {
    id: "1",
    courseCode: "CS101",
    courseName: "Introduction to Computer Science",
    facultyId: "2",
    facultyName: "Dr. John Smith",
    room: "A101",
    dayOfWeek: "Monday",
    startTime: "09:00",
    endTime: "10:30",
    semester: "Fall 2024",
    section: "A",
  },
  {
    id: "2",
    courseCode: "CS101",
    courseName: "Introduction to Computer Science",
    facultyId: "2",
    facultyName: "Dr. John Smith",
    room: "A101",
    dayOfWeek: "Wednesday",
    startTime: "09:00",
    endTime: "10:30",
    semester: "Fall 2024",
    section: "A",
  },
  // CS101 - Section B
  {
    id: "3",
    courseCode: "CS101",
    courseName: "Introduction to Computer Science",
    facultyId: "2",
    facultyName: "Dr. John Smith",
    room: "A102",
    dayOfWeek: "Monday",
    startTime: "11:00",
    endTime: "12:30",
    semester: "Fall 2024",
    section: "B",
  },
  {
    id: "4",
    courseCode: "CS101",
    courseName: "Introduction to Computer Science",
    facultyId: "2",
    facultyName: "Dr. John Smith",
    room: "A102",
    dayOfWeek: "Wednesday",
    startTime: "11:00",
    endTime: "12:30",
    semester: "Fall 2024",
    section: "B",
  },
  // CS101 - Section C
  {
    id: "5",
    courseCode: "CS101",
    courseName: "Introduction to Computer Science",
    facultyId: "2",
    facultyName: "Dr. John Smith",
    room: "A103",
    dayOfWeek: "Monday",
    startTime: "14:00",
    endTime: "15:30",
    semester: "Fall 2024",
    section: "C",
  },
  {
    id: "6",
    courseCode: "CS101",
    courseName: "Introduction to Computer Science",
    facultyId: "2",
    facultyName: "Dr. John Smith",
    room: "A103",
    dayOfWeek: "Wednesday",
    startTime: "14:00",
    endTime: "15:30",
    semester: "Fall 2024",
    section: "C",
  },
]

export const students: Student[] = [
  // Section A students
  {
    id: "3",
    name: "Jane Doe",
    email: "student@cie.edu",
    studentId: "STU001",
    class: "CS101",
    section: "A",
    department: "Computer Science",
  },
  {
    id: "4",
    name: "Mike Johnson",
    email: "mike.johnson@cie.edu",
    studentId: "STU002",
    class: "CS101",
    section: "A",
    department: "Computer Science",
  },
  {
    id: "5",
    name: "Sarah Wilson",
    email: "sarah.wilson@cie.edu",
    studentId: "STU003",
    class: "CS101",
    section: "A",
    department: "Computer Science",
  },
  // Section B students
  {
    id: "6",
    name: "Tom Brown",
    email: "tom.brown@cie.edu",
    studentId: "STU004",
    class: "CS101",
    section: "B",
    department: "Computer Science",
  },
  {
    id: "7",
    name: "Lisa Davis",
    email: "lisa.davis@cie.edu",
    studentId: "STU005",
    class: "CS101",
    section: "B",
    department: "Computer Science",
  },
  {
    id: "8",
    name: "Alex Chen",
    email: "alex.chen@cie.edu",
    studentId: "STU006",
    class: "CS101",
    section: "B",
    department: "Computer Science",
  },
  // Section C students
  {
    id: "9",
    name: "Emma Taylor",
    email: "emma.taylor@cie.edu",
    studentId: "STU007",
    class: "CS101",
    section: "C",
    department: "Computer Science",
  },
  {
    id: "10",
    name: "Ryan Miller",
    email: "ryan.miller@cie.edu",
    studentId: "STU008",
    class: "CS101",
    section: "C",
    department: "Computer Science",
  },
  {
    id: "11",
    name: "Sophia Garcia",
    email: "sophia.garcia@cie.edu",
    studentId: "STU009",
    class: "CS101",
    section: "C",
    department: "Computer Science",
  },
]

export const projects: Project[] = [
  {
    id: "1",
    title: "Database Design Project",
    description: "Design and implement a relational database for a library management system",
    courseCode: "CS101",
    section: "A",
    facultyId: "2",
    facultyName: "Dr. John Smith",
    assignedDate: "2024-01-10",
    dueDate: "2024-02-15",
    maxMarks: 100,
    status: "active",
  },
  {
    id: "2",
    title: "Web Development Portfolio",
    description: "Create a personal portfolio website using HTML, CSS, and JavaScript",
    courseCode: "CS101",
    section: "B",
    facultyId: "2",
    facultyName: "Dr. John Smith",
    assignedDate: "2024-01-12",
    dueDate: "2024-02-20",
    maxMarks: 100,
    status: "active",
  },
]

export const projectSubmissions: ProjectSubmission[] = [
  {
    id: "1",
    projectId: "1",
    studentId: "3",
    studentName: "Jane Doe",
    submissionDate: "2024-02-10",
    content: "Submitted database design with ER diagrams and SQL scripts",
    status: "submitted",
  },
]

export const attendanceRecords: AttendanceRecord[] = [
  {
    id: "1",
    courseCode: "CS101",
    section: "A",
    date: "2024-01-15",
    facultyId: "2",
    students: [
      { studentId: "3", studentName: "Jane Doe", status: "present" },
      { studentId: "4", studentName: "Mike Johnson", status: "present" },
      { studentId: "5", studentName: "Sarah Wilson", status: "absent" },
    ],
  },
  {
    id: "2",
    courseCode: "CS101",
    section: "A",
    date: "2024-01-17",
    facultyId: "2",
    students: [
      { studentId: "3", studentName: "Jane Doe", status: "present" },
      { studentId: "4", studentName: "Mike Johnson", status: "late" },
      { studentId: "5", studentName: "Sarah Wilson", status: "present" },
    ],
  },
  {
    id: "3",
    courseCode: "CS101",
    section: "B",
    date: "2024-01-15",
    facultyId: "2",
    students: [
      { studentId: "6", studentName: "Tom Brown", status: "present" },
      { studentId: "7", studentName: "Lisa Davis", status: "present" },
      { studentId: "8", studentName: "Alex Chen", status: "present" },
    ],
  },
]
