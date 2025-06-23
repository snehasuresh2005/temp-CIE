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
  student_id: string
  student_name: string
  student_email: string
  component_id: string
  component_name: string
  quantity: number
  request_date: string
  expected_return_date: string
  collection_date?: string
  return_date?: string
  status: "pending" | "approved" | "rejected" | "collected" | "returned" | "overdue"
  notes?: string
  faculty_notes?: string
}

export interface ClassSchedule {
  id: string
  course_code: string
  course_name: string
  faculty_id: string
  faculty_name: string
  room: string
  day_of_week: string
  start_time: string
  end_time: string
  semester: string
  section: string
}

export interface Student {
  id: string
  name: string
  email: string
  student_id: string
  class: string
  section: string
  department: string
}

export interface Faculty {
  id: string
  name: string
  email: string
  department: string
  assigned_classes: string[]
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
  max_students: number
  enrolled_students: number
  status: "active" | "inactive"
  sections: string[]
}

export interface Project {
  id: string
  title: string
  description: string
  course_code: string
  section: string
  faculty_id: string
  faculty_name: string
  assigned_date: string
  due_date: string
  max_marks: number
  status: "active" | "completed" | "overdue"
  attachments?: string[]
}

export interface ProjectSubmission {
  id: string
  project_id: string
  student_id: string
  student_name: string
  submission_date: string
  content: string
  attachments?: string[]
  marks?: number
  feedback?: string
  status: "submitted" | "graded" | "late"
}

export interface AttendanceRecord {
  id: string
  course_code: string
  section: string
  date: string
  faculty_id: string
  students: {
    student_id: string
    student_name: string
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
    student_id: "3",
    student_name: "Jane Doe",
    student_email: "student@cie.edu",
    component_id: "1",
    component_name: "Arduino Uno R3",
    quantity: 2,
    request_date: "2024-01-15",
    expected_return_date: "2024-01-29",
    status: "pending",
    notes: "Need for final project - IoT weather station",
  },
  {
    id: "2",
    student_id: "4",
    student_name: "Mike Johnson",
    student_email: "mike.johnson@cie.edu",
    component_id: "2",
    component_name: "Breadboard (Half Size)",
    quantity: 1,
    request_date: "2024-01-14",
    expected_return_date: "2024-01-30",
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
    max_students: 90,
    enrolled_students: 75,
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
    max_students: 75,
    enrolled_students: 66,
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
    max_students: 105,
    enrolled_students: 90,
    status: "active",
    sections: ["A", "B", "C"],
  },
]

export const classSchedules: ClassSchedule[] = [
  // CS101 - Section A
  {
    id: "1",
    course_code: "CS101",
    course_name: "Introduction to Computer Science",
    faculty_id: "2",
    faculty_name: "Dr. John Smith",
    room: "A101",
    day_of_week: "Monday",
    start_time: "09:00",
    end_time: "10:30",
    semester: "Fall 2024",
    section: "A",
  },
  {
    id: "2",
    course_code: "CS101",
    course_name: "Introduction to Computer Science",
    faculty_id: "2",
    faculty_name: "Dr. John Smith",
    room: "A101",
    day_of_week: "Wednesday",
    start_time: "09:00",
    end_time: "10:30",
    semester: "Fall 2024",
    section: "A",
  },
  // CS101 - Section B
  {
    id: "3",
    course_code: "CS101",
    course_name: "Introduction to Computer Science",
    faculty_id: "2",
    faculty_name: "Dr. John Smith",
    room: "A102",
    day_of_week: "Monday",
    start_time: "11:00",
    end_time: "12:30",
    semester: "Fall 2024",
    section: "B",
  },
  {
    id: "4",
    course_code: "CS101",
    course_name: "Introduction to Computer Science",
    faculty_id: "2",
    faculty_name: "Dr. John Smith",
    room: "A102",
    day_of_week: "Wednesday",
    start_time: "11:00",
    end_time: "12:30",
    semester: "Fall 2024",
    section: "B",
  },
  // CS101 - Section C
  {
    id: "5",
    course_code: "CS101",
    course_name: "Introduction to Computer Science",
    faculty_id: "2",
    faculty_name: "Dr. John Smith",
    room: "A103",
    day_of_week: "Monday",
    start_time: "14:00",
    end_time: "15:30",
    semester: "Fall 2024",
    section: "C",
  },
  {
    id: "6",
    course_code: "CS101",
    course_name: "Introduction to Computer Science",
    faculty_id: "2",
    faculty_name: "Dr. John Smith",
    room: "A103",
    day_of_week: "Wednesday",
    start_time: "14:00",
    end_time: "15:30",
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
    student_id: "STU001",
    class: "CS101",
    section: "A",
    department: "Computer Science",
  },
  {
    id: "4",
    name: "Mike Johnson",
    email: "mike.johnson@cie.edu",
    student_id: "STU002",
    class: "CS101",
    section: "A",
    department: "Computer Science",
  },
  {
    id: "5",
    name: "Sarah Wilson",
    email: "sarah.wilson@cie.edu",
    student_id: "STU003",
    class: "CS101",
    section: "A",
    department: "Computer Science",
  },
  // Section B students
  {
    id: "6",
    name: "Tom Brown",
    email: "tom.brown@cie.edu",
    student_id: "STU004",
    class: "CS101",
    section: "B",
    department: "Computer Science",
  },
  {
    id: "7",
    name: "Lisa Davis",
    email: "lisa.davis@cie.edu",
    student_id: "STU005",
    class: "CS101",
    section: "B",
    department: "Computer Science",
  },
  {
    id: "8",
    name: "Alex Chen",
    email: "alex.chen@cie.edu",
    student_id: "STU006",
    class: "CS101",
    section: "B",
    department: "Computer Science",
  },
  // Section C students
  {
    id: "9",
    name: "Emma Taylor",
    email: "emma.taylor@cie.edu",
    student_id: "STU007",
    class: "CS101",
    section: "C",
    department: "Computer Science",
  },
  {
    id: "10",
    name: "Ryan Miller",
    email: "ryan.miller@cie.edu",
    student_id: "STU008",
    class: "CS101",
    section: "C",
    department: "Computer Science",
  },
  {
    id: "11",
    name: "Sophia Garcia",
    email: "sophia.garcia@cie.edu",
    student_id: "STU009",
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
    course_code: "CS101",
    section: "A",
    faculty_id: "2",
    faculty_name: "Dr. John Smith",
    assigned_date: "2024-01-10",
    due_date: "2024-02-15",
    max_marks: 100,
    status: "active",
  },
  {
    id: "2",
    title: "Web Development Portfolio",
    description: "Create a personal portfolio website using HTML, CSS, and JavaScript",
    course_code: "CS101",
    section: "B",
    faculty_id: "2",
    faculty_name: "Dr. John Smith",
    assigned_date: "2024-01-12",
    due_date: "2024-02-20",
    max_marks: 100,
    status: "active",
  },
]

export const projectSubmissions: ProjectSubmission[] = [
  {
    id: "1",
    project_id: "1",
    student_id: "3",
    student_name: "Jane Doe",
    submission_date: "2024-02-10",
    content: "Submitted database design with ER diagrams and SQL scripts",
    status: "submitted",
  },
]

export const attendanceRecords: AttendanceRecord[] = [
  {
    id: "1",
    course_code: "CS101",
    section: "A",
    date: "2024-01-15",
    faculty_id: "2",
    students: [
      { student_id: "3", student_name: "Jane Doe", status: "present" },
      { student_id: "4", student_name: "Mike Johnson", status: "present" },
      { student_id: "5", student_name: "Sarah Wilson", status: "absent" },
    ],
  },
  {
    id: "2",
    course_code: "CS101",
    section: "A",
    date: "2024-01-17",
    faculty_id: "2",
    students: [
      { student_id: "3", student_name: "Jane Doe", status: "present" },
      { student_id: "4", student_name: "Mike Johnson", status: "late" },
      { student_id: "5", student_name: "Sarah Wilson", status: "present" },
    ],
  },
  {
    id: "3",
    course_code: "CS101",
    section: "B",
    date: "2024-01-15",
    faculty_id: "2",
    students: [
      { student_id: "6", student_name: "Tom Brown", status: "present" },
      { student_id: "7", student_name: "Lisa Davis", status: "present" },
      { student_id: "8", student_name: "Alex Chen", status: "present" },
    ],
  },
]
