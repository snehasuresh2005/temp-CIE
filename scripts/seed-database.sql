-- Insert sample users
INSERT INTO users (id, email, name, password, role, phone, join_date) VALUES
('admin1', 'admin@cie.edu', 'Admin User', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ADMIN', '+1-555-0101', NOW()),
('faculty1', 'faculty@cie.edu', 'Dr. John Smith', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'FACULTY', '+1-555-0102', NOW()),
('student1', 'student@cie.edu', 'Jane Doe', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'STUDENT', '+1-555-0103', NOW());

-- Insert admin data
INSERT INTO admins (id, user_id, department, office, working_hours, permissions) VALUES
('admin_profile1', 'admin1', 'Administration', 'Admin Building, Room 101', '9:00 AM - 5:00 PM', ARRAY['Full System Access', 'User Management', 'System Configuration']);

-- Insert faculty data
INSERT INTO faculty (id, user_id, employee_id, department, office, specialization, office_hours) VALUES
('faculty_profile1', 'faculty1', 'FAC001', 'Computer Science', 'Engineering Building, Room 205', 'Software Engineering', 'Mon-Wed-Fri: 2:00 PM - 4:00 PM');

-- Insert student data
INSERT INTO students (id, user_id, student_id, program, year, section, gpa) VALUES
('student_profile1', 'student1', 'STU2024001', 'Bachelor of Computer Science', '3rd Year', 'Section A', 3.85);

-- Insert sample courses
INSERT INTO courses (id, code, name, description, credits, department, semester, max_students, faculty_id, sections) VALUES
('course1', 'CS101', 'Introduction to Computer Science', 'Basic concepts of computer science and programming fundamentals', 3, 'Computer Science', 'Fall 2024', 90, 'faculty_profile1', ARRAY['A', 'B', 'C']),
('course2', 'CS201', 'Data Structures and Algorithms', 'Advanced programming concepts, data structures, and algorithm analysis', 4, 'Computer Science', 'Spring 2024', 75, 'faculty_profile1', ARRAY['A', 'B']);

-- Insert sample lab components
INSERT INTO lab_components (id, name, description, total_quantity, available_quantity, category) VALUES
('comp1', 'Arduino Uno R3', 'Microcontroller board based on ATmega328P with USB connection', 50, 35, 'Microcontrollers'),
('comp2', 'Breadboard (Half Size)', 'Solderless breadboard for prototyping electronic circuits', 30, 22, 'Prototyping'),
('comp3', 'Jumper Wires (40pcs)', 'Male-to-male jumper wires for breadboard connections', 25, 18, 'Wires & Cables');

-- Insert sample locations
INSERT INTO locations (id, name, building, floor, capacity, type, facilities, is_available) VALUES
('loc1', 'Room A101', 'Engineering Building', '1st Floor', 30, 'CLASSROOM', ARRAY['Projector', 'Whiteboard', 'AC'], true),
('loc2', 'Lab B205', 'Engineering Building', '2nd Floor', 25, 'LABORATORY', ARRAY['Computers', 'Lab Equipment', 'AC'], true);
