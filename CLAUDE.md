# CLAUDE.md - CIE-v2 Project Reference

This file contains comprehensive information about the CIE (College Information Exchange) project for AI assistant reference.

## 🏗️ Project Overview

**CIE-v2** is a comprehensive laboratory and resource management system for educational institutions built with Next.js 14, TypeScript, PostgreSQL, and Prisma ORM.

### Core Purpose
- Manage lab components and library resources
- Handle location bookings and academic workflows
- Support multi-role user management (Admin, Faculty, Student)
- Provide domain-based coordination system

---

## 🚀 Quick Start Commands

### Development Setup
```bash
# Install dependencies
pnpm install

# Database setup (new users)
pnpm prisma migrate deploy
pnpm prisma generate

# Seed database with sample data
pnpm db:seed

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint
```

### Database Management
```bash
# View database in Prisma Studio
pnpm prisma studio

# Reset database (⚠️ Destructive)
pnpm prisma migrate reset

# Check migration status
pnpm prisma migrate status

# Generate Prisma client
pnpm prisma generate
```

---

## 🗄️ Database Schema Overview

### User Management
- **User** → **Admin/Faculty/Student** (role-based profiles)
- **Domain** → **DomainCoordinator** (faculty assigned to domains)

### Academic Management
- **Course** → **CourseUnit** (course structure)
- **Enrollment** (student-course relationships)
- **ClassSchedule** (class timing and faculty assignments)

### Resource Management
- **LabComponent** (lab equipment/components)
- **LibraryItem** (library books/resources)
- **ComponentRequest** (lab component borrowing)
- **LibraryRequest** (library item borrowing)

### Location & Project Management
- **Location** → **LocationBooking** (room/space reservations)
- **Project** → **ProjectRequest** + **ProjectSubmission**

### Key Relationships
```
User → Faculty → DomainCoordinator → Domain → LabComponent/LibraryItem
Student → ComponentRequest/LibraryRequest → LabComponent/LibraryItem
Faculty → LocationBooking → Location
Project → ComponentRequest (required components)
```

---

## 🔄 Core Workflows

### 1. Component Request Workflow
```
Student/Faculty Request → Coordinator Approval → Collection → User Return → Final Return
PENDING → APPROVED → COLLECTED → USER_RETURNED → RETURNED
```

**Key Points:**
- **Domain coordinators** approve requests for their assigned domains
- **Real-time availability** calculated based on current request statuses
- **Simplified return process** - no PENDING_RETURN status
- **Fine system** for overdue returns

### 2. Library Request Workflow
```
User Request → Auto-Approval (2min expiry) → Collection → Return
PENDING → APPROVED → COLLECTED → USER_RETURNED → RETURNED
```

**Key Points:**
- **Auto-approval system** - instant reservations
- **2-minute expiry** for uncollected reservations
- **Quantity tracking** with atomic updates
- **Faculty can manage** library items

### 3. Location Booking Workflow
```
Faculty Request → Conflict Check → Booking Confirmation → Event Completion
```

**Key Points:**
- **Faculty-only booking** system
- **Real-time conflict detection**
- **Multi-location types** (lab, classroom, auditorium, etc.)
- **Calendar interface** for management

### 4. Project Management Workflow
```
Creation (Faculty/Student) → Coordinator Approval → Assignment → Submission → Grading
```

**Two Types:**
- **Faculty-Assigned**: Faculty creates, assigns to students
- **Student-Proposed**: Student proposes, faculty approves

---

## 🔐 Authentication & Authorization

### Authentication Flow
1. **Login**: Email/password → API validates → User session stored
2. **Session**: Local storage with auto-refresh
3. **API Auth**: `x-user-id` header for all authenticated requests

### Role-Based Permissions

#### Admin
- **Full system access**
- Create/manage users, courses, locations
- Assign domain coordinators
- Bulk operations

#### Faculty
- **Course management** (create, modify, enroll students)
- **Location booking** access
- **Domain coordination** (if assigned)
- **Project creation** and management
- **Component/library requests**

#### Student
- **View courses** and projects
- **Request components/library items**
- **Submit projects**
- **View attendance** and grades

#### Domain Coordinators (Faculty subset)
- **Approve requests** for their assigned domain
- **Manage domain items** (components/library)
- **View domain statistics**

---

## 🎨 UI Architecture

### Component Structure
```
App
├── AuthProvider (global auth state)
├── ThemeProvider (dark/light mode)
└── DashboardLayout
    ├── Sidebar (role-based navigation)
    ├── Header (user profile, theme toggle)
    └── Main Content
        ├── AdminDashboard → AdminPages
        ├── FacultyDashboard → FacultyPages  
        └── StudentDashboard → StudentPages
```

### Design System
- **shadcn/ui components** with Radix UI primitives
- **CSS variables** for theming
- **Responsive design** (mobile-first)
- **Role-based color schemes**
- **Consistent animation patterns**

### Key Pages by Role

#### Admin Pages (`/components/pages/admin/`)
- `admin-home.tsx` - Dashboard with statistics
- `manage-faculty.tsx` - Faculty management
- `manage-students.tsx` - Student administration
- `manage-courses.tsx` - Course management
- `manage-locations.tsx` - Location/classroom management
- `manage-lab-components.tsx` - Lab inventory
- `manage-library.tsx` - Library resources
- `manage-domains.tsx` - Coordinator assignments

#### Faculty Pages (`/components/pages/faculty/`)
- `faculty-home.tsx` - Faculty dashboard
- `coordinator-dashboard.tsx` - CIE coordinator interface
- `location-booking.tsx` - Room booking system
- `project-management.tsx` - Project oversight
- `lab-components-management.tsx` - Component oversight (coordinators)
- `library-management.tsx` - Library management

#### Student Pages (`/components/pages/student/`)
- `student-home.tsx` - Student dashboard
- `view-courses.tsx` - Course information
- `lab-components-request.tsx` - Component requests
- `library-request.tsx` - Library requests
- `request-history.tsx` - Request tracking

---

## 🔌 API Routes Reference

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Current user profile

### User Management
- `GET/POST /api/faculty` - Faculty operations
- `GET/POST /api/students` - Student operations
- `POST /api/faculty/upload` - File uploads
- `GET /api/student/projects` - Student projects

### Academic
- `GET/POST /api/courses` - Course management
- `GET/POST /api/enrollments` - Enrollment management
- `GET/POST /api/class-schedules` - Schedule management

### Resources
- `GET/POST /api/lab-components` - Lab component CRUD
- `GET/POST /api/library-items` - Library item CRUD
- `GET/POST /api/component-requests` - Component borrowing
- `GET/POST /api/library-requests` - Library borrowing

### Locations & Projects
- `GET/POST /api/locations` - Location management
- `GET/POST /api/location-bookings` - Booking system
- `GET/POST /api/projects` - Project management
- `GET/POST /api/project-submissions` - Submission handling

### Administration
- `GET/POST /api/domains` - Domain management
- `GET/POST /api/coordinators` - Coordinator assignments

---

## 🔧 Technical Configuration

### Environment Variables
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/cie_database"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Key Files
- `prisma/schema.prisma` - Database schema
- `prisma/seed.ts` - Sample data seeding
- `lib/auth.ts` - Authentication utilities
- `lib/prisma.ts` - Database client
- `lib/utils.ts` - Utility functions
- `components.json` - shadcn/ui configuration

### Development Features
- **TypeScript strict mode** with path aliases
- **ESLint** configuration (builds ignore errors for development)
- **Hot reload** with Next.js
- **Prisma Studio** for database management
- **Image optimization** disabled for development

---

## 📊 Business Logic

### Availability Calculation
Components/items availability = Total quantity - Currently borrowed (COLLECTED status)

### Domain Assignment
- Lab components assigned to "Lab Components" domain
- Library items assigned to "Library" domain
- Faculty assigned as coordinators for specific domains

### Fine System
- Automatic fine calculation for overdue returns
- Payment proof upload system
- Fine tracking per request

### Auto-Expiry System
- Library reservations expire after 2 minutes if not collected
- Automatic cleanup of expired reservations
- Real-time availability updates

---

## 🚨 Common Issues & Solutions

### Database Issues
```bash
# Connection issues
psql -U postgres -d cie_database -c "SELECT 1;"

# Reset migrations
pnpm prisma migrate reset

# Generate client after schema changes
pnpm prisma generate
```

### Development Issues
```bash
# Port conflicts
lsof -i :3000
kill -9 <PID>

# Clear Next.js cache
rm -rf .next
pnpm dev

# Prisma cache issues
rm -rf node_modules/.prisma
pnpm prisma generate
```

### Authentication Issues
- Check `x-user-id` header in API requests
- Verify user exists in database
- Clear localStorage and re-login

---

## 🎯 Default Login Credentials

### Admin
- **Email:** cie.admin@pes.edu
- **Password:** password123

### Faculty
- **Madhukar N (Lab Coordinator):** cieoffice@pes.edu
- **Sathya Prasad (Library Coordinator):** sathya.prasad@pes.edu
- **Tarun R:** tarunrama@pes.edu
- **Password:** password123 (for all)

### Students
- **Preetham Kumar S:** preetham@pes.edu
- **Rishi D V:** rishi@pes.edu
- **Samir G D:** samir@pes.edu
- **Password:** password123 (for all)

---

## 📁 File Structure

```
CIE-v2/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Design system components
│   ├── pages/            # Page components (admin/faculty/student)
│   ├── dashboards/       # Role-based dashboards
│   ├── layout/           # Layout components
│   └── common/           # Shared components
├── lib/                  # Utility libraries
│   ├── prisma.ts         # Database client
│   ├── auth.ts           # Authentication utilities
│   └── utils.ts          # General utilities
├── prisma/               # Database schema and migrations
│   ├── schema.prisma     # Database schema
│   ├── migrations/       # Database migrations
│   └── seed.ts           # Database seeding
├── public/               # Static assets
│   ├── lab-images/       # Component images
│   ├── library-images/   # Library item images
│   ├── location-images/  # Location photos
│   └── profile-img/      # User profile photos
├── scripts/              # Utility scripts
├── hooks/                # Custom React hooks
└── Configuration files
```

---

## 🔍 Testing & Debugging

### API Testing
- Use `/api/health` to check system status
- Check database connections via Prisma Studio
- Verify authentication with `/api/auth/me`

### Common Debug Points
- **Authentication**: Check headers and user session
- **Permissions**: Verify role-based access
- **Database**: Check Prisma query logs
- **File Uploads**: Verify file paths and permissions

### Development Tools
- **Prisma Studio**: Visual database management
- **Browser DevTools**: Network and console debugging
- **Next.js DevTools**: Performance and rendering

---

## 🚀 Deployment Notes

### Docker Deployment
```bash
# Development with database
docker-compose up --build app-dev postgres

# Production build
docker-compose up --build app postgres
```

### Environment Setup
- Configure production database URL
- Set secure NEXTAUTH_SECRET
- Update NEXTAUTH_URL for production domain
- Configure file upload paths

### Migration Deployment
```bash
# Production migration
pnpm prisma migrate deploy

# Never use migrate dev in production
```

---

## 📝 Notes for AI Assistants

### When Working on This Project:
1. **Always check user role** before suggesting modifications
2. **Respect domain coordination** - only coordinators can approve requests
3. **Maintain data consistency** - use transactions for critical operations
4. **Follow TypeScript patterns** - maintain type safety
5. **Use existing UI components** - leverage the design system
6. **Test authentication flow** - verify API access patterns
7. **Consider mobile users** - maintain responsive design
8. **Follow naming conventions** - match existing patterns

### Common Tasks:
- **Adding new components**: Follow existing patterns in `/components/ui/`
- **Creating API routes**: Use authentication middleware and error handling
- **Database changes**: Always create migrations, never modify schema directly
- **Adding features**: Consider all user roles and permissions
- **File uploads**: Use existing upload patterns and validate file types

### Project-Specific Patterns:
- Use `cn()` utility for className merging
- Follow role-based component organization
- Implement proper error boundaries and loading states
- Use consistent toast notifications for user feedback
- Maintain audit trails with created_by/modified_by fields

This project prioritizes type safety, user experience, and institutional workflow management.