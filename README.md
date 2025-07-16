# CIE - College Information Exchange

A comprehensive laboratory management system built with Next.js, Prisma, and PostgreSQL.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL
- pnpm or npm

### Option 1: Local PostgreSQL Setup

### 1. Clone the repository
```bash
git clone https://github.com/preeeetham/CIE-v2.git
cd CIE-v2
```

### 2. Install dependencies
```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install
```

### 3. Create `.env` file
Add a `.env` file in the root directory with the following content:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google Gemini AI (for image analysis feature)
GOOGLE_GEMINI_API_KEY="your-gemini-api-key-here"

# App
NODE_ENV="development"
```

### 4. Prisma setup
```bash
# Using pnpm
pnpm prisma generate
pnpm prisma migrate dev --name update_insight_flow
pnpm prisma db seed

# Or using npm
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 5. Run the dev server
```bash
# Using pnpm
pnpm dev

# Or using npm
npm run dev
```

Visit: http://localhost:3000

### Option 2: PostgreSQL with Docker

If you prefer to use Docker for PostgreSQL only:

```bash
# Start PostgreSQL with Docker
docker run --name cie-postgres \
  -e POSTGRES_DB=cie_database \
  -e POSTGRES_USER=cie_user \
  -e POSTGRES_PASSWORD=cie_password \
  -p 5432:5432 \
  -d postgres:15

# Update your .env file with Docker PostgreSQL connection
DATABASE_URL="postgresql://cie_user:cie_password@localhost:5432/cie_database"
```

Then follow steps 1-5 from Option 1 above.

## 📊 Demo Users

Demo users are automatically created when you run the seed script. Check the `prisma/seed.ts` file for the complete list of demo users and their credentials.

**Default password for all users:** `password123`

## 🚀 Features

- **AI-Powered Image Analysis**: Automatically generate descriptions and specifications for lab components and library items using Google Gemini AI
- **User Management**: Admin, Faculty, and Student roles with different permissions
- **Lab Component Management**: Track, request, and manage laboratory components
- **Library Management**: Manage library items and book requests
- **Project Management**: Create and manage student and faculty projects
- **Location Booking**: Book and manage laboratory and meeting spaces
- **Real-time Notifications**: Get updates on requests and approvals

## 📁 Tech Stack

- **Next.js** - React framework for production
- **TypeScript** - Type-safe JavaScript
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **NextAuth** - Authentication
- **Tailwind CSS** - Styling
- **Radix UI** - Component library
- **Google Gemini AI** - AI-powered image analysis

## 🧪 Development Notes

- Ensure PostgreSQL is running locally
- The project supports both `pnpm` and `npm` as package managers
- AI features require a valid Google Gemini API key
- Live code editing is available in development mode

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
