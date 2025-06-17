# CIE - Next.js + Prisma Starter

A boilerplate project using Next.js, Prisma, and PostgreSQL.

## 🛠 Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/preeeetham/CIE.git
cd cie
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Create `.env` file

Add a `.env` file in the root directory with the following content:

```env
# Database
DATABASE_URL="postgresql://postgres:mysecretpassword@localhost:5432/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="7BzK+Flmt+PZq+NsmLSMLdPZ8WYoJ8v3A7VtdNFBH6Y="

# App
NODE_ENV="development"
```

### 4. Prisma setup

```bash
pnpm prisma generate
pnpm prisma migrate dev --name init
pnpm prisma db seed
```

> **Note:** Make sure `prisma/seed.ts` is configured correctly and that `ts-node` is installed.

### 5. Run the dev server

```bash
pnpm dev
```

Visit: http://localhost:3000

## 📁 Tech Stack

- **Next.js** - React framework for production
- **TypeScript** - Type-safe JavaScript
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **NextAuth** - Authentication

## 🧪 Development Notes

- Ensure PostgreSQL is running locally
- Use `.env` values suited for your local environment
- Update the `DATABASE_URL` in `.env` to match your PostgreSQL configuration

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
