# Tournament App

Step 1 project scaffold: Next.js App Router + TypeScript + Tailwind CSS + Prisma/PostgreSQL.

## Requirements

- Node.js 20+
- npm 10+
- PostgreSQL 14+

## Setup

```bash
npm install
cp .env.example .env
```

Update `DATABASE_URL` in `.env` if your PostgreSQL credentials or database name differ.

## Prisma

```bash
npx prisma generate
npx prisma db push
```

The placeholder `Test` model is in `prisma/schema.prisma` and is intentionally minimal so the database connection can be verified before the tournament schema is added.

## Run locally

```bash
npm run dev
```

Open http://localhost:3000.

## Structure

```text
app/           Next.js App Router pages, layout, and global styles
components/    Reusable UI components
lib/            Shared application utilities, including Prisma
prisma/        Prisma schema and database configuration
public/        Static assets
```
