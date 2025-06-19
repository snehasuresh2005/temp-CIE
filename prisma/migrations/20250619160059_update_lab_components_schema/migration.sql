/*
  Warnings:

  - You are about to drop the column `collectionDate` on the `component_requests` table. All the data in the column will be lost.
  - You are about to drop the column `componentId` on the `component_requests` table. All the data in the column will be lost.
  - You are about to drop the column `expectedReturnDate` on the `component_requests` table. All the data in the column will be lost.
  - You are about to drop the column `facultyId` on the `component_requests` table. All the data in the column will be lost.
  - You are about to drop the column `facultyNotes` on the `component_requests` table. All the data in the column will be lost.
  - You are about to drop the column `requestDate` on the `component_requests` table. All the data in the column will be lost.
  - You are about to drop the column `returnDate` on the `component_requests` table. All the data in the column will be lost.
  - You are about to drop the column `studentId` on the `component_requests` table. All the data in the column will be lost.
  - You are about to drop the `LabComponent` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `component_id` to the `component_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expected_return_date` to the `component_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `student_id` to the `component_requests` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "component_requests" DROP CONSTRAINT "component_requests_componentId_fkey";

-- DropForeignKey
ALTER TABLE "component_requests" DROP CONSTRAINT "component_requests_facultyId_fkey";

-- DropForeignKey
ALTER TABLE "component_requests" DROP CONSTRAINT "component_requests_studentId_fkey";

-- AlterTable
ALTER TABLE "component_requests" DROP COLUMN "collectionDate",
DROP COLUMN "componentId",
DROP COLUMN "expectedReturnDate",
DROP COLUMN "facultyId",
DROP COLUMN "facultyNotes",
DROP COLUMN "requestDate",
DROP COLUMN "returnDate",
DROP COLUMN "studentId",
ADD COLUMN     "collection_date" TIMESTAMP(3),
ADD COLUMN     "component_id" TEXT NOT NULL,
ADD COLUMN     "expected_return_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "faculty_id" TEXT,
ADD COLUMN     "faculty_notes" TEXT,
ADD COLUMN     "request_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "return_date" TIMESTAMP(3),
ADD COLUMN     "student_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "LabComponent";

-- CreateTable
CREATE TABLE "lab_components" (
    "id" TEXT NOT NULL,
    "component_name" TEXT NOT NULL,
    "component_description" TEXT NOT NULL,
    "component_specification" TEXT,
    "component_quantity" INTEGER NOT NULL,
    "component_tag_id" TEXT,
    "component_category" TEXT NOT NULL,
    "component_location" TEXT NOT NULL,
    "image_path" TEXT NOT NULL DEFAULT 'lab-images',
    "front_image_id" TEXT,
    "back_image_id" TEXT,
    "invoice_number" TEXT,
    "purchase_value" DECIMAL(10,2),
    "purchased_from" TEXT,
    "purchase_currency" TEXT NOT NULL DEFAULT 'INR',
    "purchase_date" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_date" TIMESTAMP(3) NOT NULL,
    "modified_by" TEXT,

    CONSTRAINT "lab_components_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lab_components_component_category_idx" ON "lab_components"("component_category");

-- CreateIndex
CREATE INDEX "lab_components_component_location_idx" ON "lab_components"("component_location");

-- CreateIndex
CREATE INDEX "lab_components_created_by_idx" ON "lab_components"("created_by");

-- AddForeignKey
ALTER TABLE "component_requests" ADD CONSTRAINT "component_requests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_requests" ADD CONSTRAINT "component_requests_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "lab_components"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_requests" ADD CONSTRAINT "component_requests_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculty"("id") ON DELETE SET NULL ON UPDATE CASCADE;
