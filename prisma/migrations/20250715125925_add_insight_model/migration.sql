-- CreateEnum
CREATE TYPE "InsightStatus" AS ENUM ('PENDING', 'APPROVED', 'IN_PROGRESS', 'DONE', 'REJECTED', 'COMPLETED');

-- CreateTable
CREATE TABLE "Insight" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "InsightStatus" NOT NULL DEFAULT 'PENDING',
    "created_by" TEXT NOT NULL,
    "approved_by" TEXT,
    "developer_id" TEXT,
    "completed_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Insight_pkey" PRIMARY KEY ("id")
);
