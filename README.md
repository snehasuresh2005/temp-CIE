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

# AI/ML Configuration
MISTRAL_API_KEY="your-mistral-api-key-here"          # For AI resume analysis
GEMINI_API_KEY="your-gemini-api-key-here"           # For image analysis features

# App
NODE_ENV="development"

# Python Virtual Environment (optional - will auto-detect if not specified)
# PYTHON_VENV_PATH="C:/path/to/your/.venv/Scripts/python.exe"  # Windows
# PYTHON_VENV_PATH="/path/to/your/.venv/bin/python"           # Linux/Mac
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

## � Python AI Setup (for AI Resume Analysis)

The project includes AI-powered resume analysis features that require Python. Here's how to set it up for your team:

### Prerequisites
- Python 3.8 or higher
- pip (Python package installer)

### 1. Create Python Virtual Environment

**For Windows:**
```bash
# Navigate to project root (or parent directory)
cd /path/to/your/project

# Create virtual environment
python -m venv .venv

# Activate virtual environment
.venv\Scripts\activate
```

**For Linux/Mac:**
```bash
# Navigate to project root (or parent directory)
cd /path/to/your/project

# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate
```

### 2. Install Required Python Packages

**Option A: Using the automated setup scripts (Recommended)**

**For Windows:**
```bash
# PowerShell script (modern, with better feedback)
.\scripts\setup-python-env.ps1

# Or use the batch file
.\scripts\reinstall-ai-packages.bat
```

**For Linux/Mac:**
```bash
# Make the script executable and run it
chmod +x scripts/setup-python-env.sh
./scripts/setup-python-env.sh
```

**Option B: Manual installation**
```bash
# Make sure virtual environment is activated
pip install --upgrade pip
pip install numpy sentence-transformers faiss-cpu pdfplumber mistralai python-dotenv
```

### 3. Environment Configuration

The application automatically detects your Python virtual environment in these locations:
1. `./venv/` (in project directory)
2. `../.venv/` (in parent directory)  
3. System Python (fallback)

**Optional: Manual Configuration**
If you have a custom Python setup, add this to your `.env` file:

```env
# Python Virtual Environment (optional - will auto-detect if not specified)
PYTHON_VENV_PATH="C:/path/to/your/.venv/Scripts/python.exe"  # Windows
# PYTHON_VENV_PATH="/path/to/your/.venv/bin/python"           # Linux/Mac
```

### 4. Add AI API Keys

Make sure your `.env` file includes:

```env
# AI/ML Configuration
MISTRAL_API_KEY="your-mistral-api-key-here"
GEMINI_API_KEY="your-gemini-api-key-here"
```

### 5. Test Python Setup

```bash
# Test if all packages are installed correctly
python -c "import numpy, sentence_transformers, faiss, pdfplumber, mistralai; print('✅ All packages installed successfully!')"
```

### Team Setup Notes

- **For Team Members**: The Python path is now dynamic - just create a `.venv` folder in your project root or parent directory
- **Cross-Platform**: Works on Windows, Linux, and Mac with automatic platform detection
- **No Hardcoded Paths**: The system automatically finds your virtual environment
- **Easy Package Management**: Use the provided batch script or manual pip install commands

### Troubleshooting

**Virtual Environment Not Found:**
```bash
# Create virtual environment in project root
python -m venv .venv

# Activate it
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Linux/Mac

# Install packages
pip install numpy sentence-transformers faiss-cpu pdfplumber mistralai python-dotenv
```

**Permission Issues (Windows):**
```bash
# Run PowerShell as Administrator if needed
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## �📊 Demo Users

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
