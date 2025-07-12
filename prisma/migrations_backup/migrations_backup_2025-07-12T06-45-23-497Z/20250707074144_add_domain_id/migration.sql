-- DropForeignKey
ALTER TABLE "component_requests" DROP CONSTRAINT "component_requests_project_id_fkey";

-- AlterTable
ALTER TABLE "component_requests" ADD COLUMN     "collection_date" TIMESTAMP(3),
ADD COLUMN     "due_date" TIMESTAMP(3),
ADD COLUMN     "faculty_notes" TEXT,
ADD COLUMN     "fine_amount" DECIMAL(10,2),
ADD COLUMN     "fine_paid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "payment_proof" TEXT,
ALTER COLUMN "project_id" DROP NOT NULL,
ALTER COLUMN "purpose" DROP NOT NULL,
ALTER COLUMN "required_date" DROP NOT NULL;

-- AlterTable
ALTER TABLE "lab_components" ADD COLUMN     "domain_id" TEXT;

-- AlterTable
ALTER TABLE "library_items" ADD COLUMN     "domain_id" TEXT;

-- AlterTable
ALTER TABLE "library_requests" ADD COLUMN     "due_date" TIMESTAMP(3),
ADD COLUMN     "fine_amount" DECIMAL(10,2),
ADD COLUMN     "fine_paid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "payment_proof" TEXT,
ALTER COLUMN "purpose" DROP NOT NULL,
ALTER COLUMN "required_date" DROP NOT NULL;

-- CreateTable
CREATE TABLE "domains" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domain_coordinators" (
    "id" TEXT NOT NULL,
    "domain_id" TEXT NOT NULL,
    "faculty_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" TEXT NOT NULL,

    CONSTRAINT "domain_coordinators_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "domains_name_key" ON "domains"("name");

-- CreateIndex
CREATE UNIQUE INDEX "domain_coordinators_domain_id_faculty_id_key" ON "domain_coordinators"("domain_id", "faculty_id");

-- AddForeignKey
ALTER TABLE "domain_coordinators" ADD CONSTRAINT "domain_coordinators_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain_coordinators" ADD CONSTRAINT "domain_coordinators_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_components" ADD CONSTRAINT "lab_components_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "domains"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_requests" ADD CONSTRAINT "component_requests_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "domains"("id") ON DELETE SET NULL ON UPDATE CASCADE;
