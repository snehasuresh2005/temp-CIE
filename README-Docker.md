# CIE Application - Docker Setup

This document describes how to run the CIE (College Information Exchange) application using Docker with automatic database seeding.

## 🚀 Quick Start

### Prerequisites
- Docker
- Docker Compose

### 1. Clone the Repository
```bash
git clone <repository-url>
cd CIE
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```bash
# Database Configuration
POSTGRES_DB=cie_db
POSTGRES_USER=cie_user
POSTGRES_PASSWORD=cie_password
POSTGRES_PORT=5433

# Application Configuration
APP_PORT=3005
NODE_ENV=production

# Database URL (auto-generated from above variables)
DATABASE_URL=postgresql://cie_user:cie_password@postgres:5432/cie_db

# NextAuth Configuration
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3005"
```

### 3. Choose Your Setup

#### Option A: Production Mode (Recommended for deployment)
```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up --build -d
```

**Features:**
- ✅ Optimized production build
- ✅ Automatic database seeding
- ✅ Health checks
- ❌ No live code editing

#### Option B: Development Mode (Recommended for development)
```bash
# Start development environment with live editing
docker-compose up --build app-dev postgres

# Or run in detached mode
docker-compose up --build -d app-dev postgres
```

**Features:**
- ✅ Live code editing (changes reflect immediately)
- ✅ Hot reload
- ✅ Automatic database seeding
- ✅ Development tools and debugging

### 4. Access the Application

- **Production:** http://localhost:3005
- **Development:** http://localhost:3006

## 🔧 Development Workflow

### For Live Editing:
1. Start the development environment:
   ```bash
   docker-compose up --build app-dev postgres
   ```

2. Edit your code files locally
3. Changes will automatically reflect in the browser
4. The development server runs on http://localhost:3006

### For Production Testing:
1. Start the production environment:
   ```bash
   docker-compose up --build app postgres
   ```

2. Test the optimized build on http://localhost:3005

## 📊 Default Login Credentials

### Admin
- **Email:** admin@college.edu
- **Password:** password123

### Faculty
- **Dr. Rajesh Kumar:** rajesh.kumar@college.edu
- **Prof. Priya Sharma:** priya.sharma@college.edu  
- **Dr. Amit Patel:** amit.patel@college.edu
- **Password:** password123 (for all)

### Students
- **Emails:** student001@college.edu to student030@college.edu
- **Password:** password123 (for all)

## 🛠️ Management Commands

### View Logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs app-dev
docker-compose logs postgres
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (resets database)
docker-compose down -v
```

### Rebuild After Changes
```bash
# Rebuild and restart
docker-compose up --build

# Rebuild specific service
docker-compose up --build app-dev
```

## 🔍 Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL container is healthy: `docker-compose ps`
- Check logs: `docker-compose logs postgres`

### Application Issues
- Check application logs: `docker-compose logs app-dev`
- Verify environment variables in `.env` file

### Port Conflicts
- Change ports in `.env` file if 3005/3006 or 5433 are in use
- Update `NEXTAUTH_URL` accordingly

## 📁 Project Structure

```
CIE/
├── app/                    # Next.js application
├── components/             # React components
├── prisma/                 # Database schema and migrations
├── public/                 # Static assets
├── Dockerfile              # Container configuration
├── docker-compose.yml      # Multi-container setup
├── .env                    # Environment variables
└── README-Docker.md        # This file
```

## 🚀 Deployment

The production setup is ready for deployment. Simply run:
```bash
docker-compose up --build -d
```

The application will be available on the configured port with automatic database seeding and health monitoring.

## 🔧 What Happens During Startup

The application container automatically performs the following steps:

1. **Wait for Database**: Waits for PostgreSQL to be ready
2. **Run Migrations**: Applies all Prisma migrations
3. **Seed Database**: Populates the database with initial data
4. **Start Application**: Launches the Next.js application

## 📊 Seeded Data

The database is automatically populated with:

- **1 Admin user**
- **3 Faculty users** (Computer Science, IT, Electronics departments)
- **30 Student users** (10 students in each of 3 sections)
- **3 Sample Lab Components** (Arduino, Raspberry Pi, Breadboard)
- **Complete database schema** with all tables and relationships

## 🐳 Docker Services

### 1. PostgreSQL Database (`cie_postgres`)
- **Image**: postgres:15-alpine
- **Port**: 5432
- **Volume**: postgres_data (persistent storage)
- **Health Check**: Monitors database connectivity

### 2. Next.js Application (`cie_app`)
- **Build**: Custom Dockerfile
- **Port**: 3000
- **Features**:
  - Automatic database migration
  - Automatic seeding
  - Health monitoring
  - Volume mounting for public files and lab images

## 🔍 Health Monitoring

The application includes health checks:

- **Database**: Monitored via `pg_isready`
- **Application**: HTTP health check at `/api/health`
- **Container**: Automatic restart on failure

## 📁 Volume Mounts

- **Public Files**: `./public` → `/app/public`
- **Lab Images**: `./lab-images` → `/app/public/lab-images`
- **Database**: `postgres_data` (Docker managed volume)

## 🛠️ Development Commands

```bash
# View logs
docker-compose logs -f app

# Access database
docker-compose exec postgres psql -U cie_user -d cie_db

# Run commands in app container
docker-compose exec app sh

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ This will delete all data)
docker-compose down -v

# Rebuild and restart
docker-compose up --build --force-recreate
```

## 🔄 Reseeding the Database

To reseed the database with fresh data:

```bash
# Stop the application
docker-compose stop app

# Remove the database volume
docker-compose down -v

# Start fresh
docker-compose up --build
```

## 🚨 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   lsof -i :3000
   lsof -i :5432
   
   # Change ports in .env file
   APP_PORT=3001
   POSTGRES_PORT=5433
   ```

2. **Database Connection Issues**
   ```bash
   # Check database logs
   docker-compose logs postgres
   
   # Check application logs
   docker-compose logs app
   ```

3. **Permission Issues**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   ```

4. **Build Failures**
   ```bash
   # Clean build
   docker-compose build --no-cache
   docker-compose up --build
   ```

### Health Check Endpoint

The application provides a health check endpoint:
- **URL**: http://localhost:3000/api/health
- **Response**: JSON with status and database connectivity

## 📝 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_DB` | `cie_db` | Database name |
| `POSTGRES_USER` | `cie_user` | Database user |
| `POSTGRES_PASSWORD` | `cie_password` | Database password |
| `POSTGRES_PORT` | `5432` | Database port |
| `APP_PORT` | `3000` | Application port |
| `NODE_ENV` | `production` | Node.js environment |

## 🔒 Security Notes

- Change default passwords in production
- Use strong passwords for database
- Consider using Docker secrets for sensitive data
- Restrict database port access in production

## 📈 Performance

- **Memory**: ~512MB per container
- **Storage**: ~2GB for application + database
- **Startup Time**: ~2-3 minutes (including seeding)

## 🆘 Support

If you encounter issues:

1. Check the logs: `docker-compose logs`
2. Verify environment variables
3. Ensure ports are available
4. Check Docker and Docker Compose versions 