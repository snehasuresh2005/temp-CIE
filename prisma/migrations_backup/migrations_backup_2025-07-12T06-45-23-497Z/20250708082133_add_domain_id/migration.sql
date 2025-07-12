-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'PROFESSOR';

-- DropForeignKey
ALTER TABLE "attendance_records" DROP CONSTRAINT "attendance_records_faculty_id_fkey";

-- DropForeignKey
ALTER TABLE "class_schedules" DROP CONSTRAINT "class_schedules_faculty_id_fkey";

-- DropForeignKey
ALTER TABLE "library_requests" DROP CONSTRAINT "library_requests_student_id_fkey";

-- AlterTable
ALTER TABLE "attendance_records" ADD COLUMN     "professor_id" TEXT,
ALTER COLUMN "faculty_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "class_schedules" ADD COLUMN     "professor_id" TEXT,
ALTER COLUMN "faculty_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "library_requests" ADD COLUMN     "professor_id" TEXT,
ALTER COLUMN "student_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "location_bookings" ADD COLUMN     "professor_id" TEXT,
ALTER COLUMN "faculty_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "professors" (
    "id" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "office" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "professor_id" TEXT NOT NULL,
    "office_hours" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "image_id" TEXT,
    "image_path" TEXT DEFAULT 'profile-img',
    "resume_id" TEXT,
    "resume_path" TEXT DEFAULT 'resumes',

    CONSTRAINT "professors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "professors_professor_id_key" ON "professors"("professor_id");

-- CreateIndex
CREATE UNIQUE INDEX "professors_user_id_key" ON "professors"("user_id");

-- AddForeignKey
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_professor_id_fkey" FOREIGN KEY ("professor_id") REFERENCES "professors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_professor_id_fkey" FOREIGN KEY ("professor_id") REFERENCES "professors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_bookings" ADD CONSTRAINT "location_bookings_professor_id_fkey" FOREIGN KEY ("professor_id") REFERENCES "professors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_requests" ADD CONSTRAINT "library_requests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_requests" ADD CONSTRAINT "library_requests_professor_id_fkey" FOREIGN KEY ("professor_id") REFERENCES "professors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professors" ADD CONSTRAINT "professors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
