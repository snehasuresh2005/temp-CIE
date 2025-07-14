-- DropForeignKey
ALTER TABLE "component_requests" DROP CONSTRAINT "component_requests_student_id_fkey";

-- AlterTable
ALTER TABLE "component_requests" ADD COLUMN     "faculty_id" TEXT,
ALTER COLUMN "student_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "component_requests" ADD CONSTRAINT "component_requests_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_requests" ADD CONSTRAINT "component_requests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;
