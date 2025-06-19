# CIE Project - Docker Setup

This guide will help your teammates set up the CIE project quickly using Docker.

## Prerequisites

- Docker Desktop installed on your machine
- Git

## Quick Start

### 1. Clone the repository
```bash
git clone <repository-url>
cd CIE
```

### 2. Set up environment variables
```bash
# Copy the example environment file
cp env.example .env

# Edit the .env file with your secure credentials
nano .env
```

### 3. Start the application with Docker
```bash
# Start the database and run migrations
docker-compose --profile migrate up -d

# Start the application (in a new terminal)
docker-compose up -d
```

### 4. Access the application
- **Application**: http://localhost:3000 (or your configured APP_PORT)
- **Database**: localhost:5432 (or your configured POSTGRES_PORT)

## Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# Database Configuration
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_PORT=5432

# Application Configuration
APP_PORT=3000
NODE_ENV=production
```

## Alternative Setup (Step by Step)

### Option 1: Full Docker Setup (Recommended)
```bash
# Build and start all services
docker-compose up --build -d

# Run migrations (if needed)
docker-compose --profile migrate up -d
```

### Option 2: Development Setup
```bash
# Start only the database
docker-compose up postgres -d

# Install dependencies locally
pnpm install

# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate deploy

# Start development server
pnpm dev
```

## Useful Commands

### View logs
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f app
docker-compose logs -f postgres
```

### Stop services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ This will delete all data)
docker-compose down -v
```

### Reset database
```bash
# Stop services and remove volumes
docker-compose down -v

# Start fresh
docker-compose up --build -d
```

### Access database
```bash
# Connect to PostgreSQL container
docker exec -it cie_postgres psql -U postgres -d postgres

# Run Prisma commands
docker exec -it cie_app pnpm prisma studio
```

## Security Considerations

⚠️ **Important Security Notes:**

1. **Never commit `.env` files** - They contain sensitive credentials
2. **Use strong passwords** - Change the default password in production
3. **Limit database access** - Only expose necessary ports
4. **Regular updates** - Keep Docker images updated for security patches

## Troubleshooting

### Port conflicts
If ports are already in use:
```bash
# Check what's using the ports
lsof -i :3000
lsof -i :5432

# Modify .env file to use different ports
POSTGRES_PORT=5433
APP_PORT=3001
```

### Database connection issues
```bash
# Check if PostgreSQL is running
docker-compose ps

# Check database logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### Prisma issues
```bash
# Regenerate Prisma client
docker exec -it cie_app pnpm prisma generate

# Reset database and run migrations
docker-compose down -v
docker-compose --profile migrate up -d
```

## Development Workflow

1. **Start services**: `docker-compose up -d`
2. **Make changes** to your code
3. **Rebuild**: `docker-compose up --build -d`
4. **View logs**: `docker-compose logs -f app`

## Production Deployment

For production, consider:
- Using environment-specific docker-compose files
- Setting up proper secrets management
- Configuring reverse proxy (nginx)
- Setting up monitoring and logging
- Using Docker secrets or external secret management

---

**That's it!** Your teammates can now get started with just a few Docker commands. 🚀 