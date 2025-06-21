/*
  Warnings:

  - The values [COMPLETED] on the enum `CourseStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [LABORATORY,AUDITORIUM,LIBRARY] on the enum `LocationType` will be removed. If these variants are still used in the database, this will fail.
  - The values [OVERDUE] on the enum `RequestStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [LATE] on the enum `SubmissionStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `userId` on the `admins` table. All the data in the column will be lost.
  - You are about to drop the column `workingHours` on the `admins` table. All the data in the column will be lost.
  - You are about to drop the column `courseId` on the `attendance_records` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `attendance_records` table. All the data in the column will be lost.
  - You are about to drop the column `facultyId` on the `attendance_records` table. All the data in the column will be lost.
  - You are about to drop the column `courseId` on the `class_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `dayOfWeek` on the `class_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `class_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `facultyId` on the `class_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `class_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `collection_date` on the `component_requests` table. All the data in the column will be lost.
  - You are about to drop the column `expected_return_date` on the `component_requests` table. All the data in the column will be lost.
  - You are about to drop the column `faculty_id` on the `component_requests` table. All the data in the column will be lost.
  - You are about to drop the column `faculty_notes` on the `component_requests` table. All the data in the column will be lost.
  - You are about to drop the column `enrolledStudents` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `facultyId` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `maxStudents` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `courseId` on the `enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `enrolledAt` on the `enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `studentId` on the `enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `employeeId` on the `faculty` table. All the data in the column will be lost.
  - You are about to drop the column `officeHours` on the `faculty` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `faculty` table. All the data in the column will be lost.
  - You are about to drop the column `created_date` on the `lab_components` table. All the data in the column will be lost.
  - You are about to drop the column `modified_date` on the `lab_components` table. All the data in the column will be lost.
  - You are about to drop the column `building` on the `locations` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `locations` table. All the data in the column will be lost.
  - You are about to drop the column `facilities` on the `locations` table. All the data in the column will be lost.
  - You are about to drop the column `floor` on the `locations` table. All the data in the column will be lost.
  - You are about to drop the column `isAvailable` on the `locations` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `locations` table. All the data in the column will be lost.
  - You are about to drop the column `projectId` on the `project_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `studentId` on the `project_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `submissionDate` on the `project_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `attendanceRecordId` on the `student_attendance` table. All the data in the column will be lost.
  - You are about to drop the column `studentId` on the `student_attendance` table. All the data in the column will be lost.
  - You are about to drop the column `advisorId` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `studentId` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `joinDate` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id]` on the table `admins` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[student_id,course_id]` on the table `enrollments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id]` on the table `faculty` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[employee_id]` on the table `faculty` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `locations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[project_id,student_id]` on the table `project_submissions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[attendance_record_id,student_id]` on the table `student_attendance` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id]` on the table `students` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[student_id]` on the table `students` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user_id` to the `admins` table without a default value. This is not possible if the table is not empty.
  - Added the required column `working_hours` to the `admins` table without a default value. This is not possible if the table is not empty.
  - Added the required column `course_id` to the `attendance_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `faculty_id` to the `attendance_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `course_id` to the `class_schedules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `day_of_week` to the `class_schedules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `end_time` to the `class_schedules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `faculty_id` to the `class_schedules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_time` to the `class_schedules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `project_id` to the `component_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `purpose` to the `component_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `required_date` to the `component_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `faculty_id` to the `courses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `max_students` to the `courses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `course_id` to the `enrollments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `student_id` to the `enrollments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `employee_id` to the `faculty` table without a default value. This is not possible if the table is not empty.
  - Added the required column `office_hours` to the `faculty` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `faculty` table without a default value. This is not possible if the table is not empty.
  - Added the required column `modified_at` to the `lab_components` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `locations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `project_id` to the `project_submissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `student_id` to the `project_submissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `attendance_record_id` to the `student_attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `student_id` to the `student_attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `student_id` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "AttendanceStatus" ADD VALUE 'EXCUSED';

-- AlterEnum
BEGIN;
CREATE TYPE "CourseStatus_new" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
ALTER TABLE "courses" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "courses" ALTER COLUMN "status" TYPE "CourseStatus_new" USING ("status"::text::"CourseStatus_new");
ALTER TYPE "CourseStatus" RENAME TO "CourseStatus_old";
ALTER TYPE "CourseStatus_new" RENAME TO "CourseStatus";
DROP TYPE "CourseStatus_old";
ALTER TABLE "courses" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "LocationType_new" AS ENUM ('LAB', 'CLASSROOM', 'OFFICE', 'WAREHOUSE', 'OTHER');
ALTER TABLE "locations" ALTER COLUMN "type" TYPE "LocationType_new" USING ("type"::text::"LocationType_new");
ALTER TYPE "LocationType" RENAME TO "LocationType_old";
ALTER TYPE "LocationType_new" RENAME TO "LocationType";
DROP TYPE "LocationType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "RequestStatus_new" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COLLECTED', 'RETURNED', 'PENDING_RETURN');
ALTER TABLE "component_requests" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "component_requests" ALTER COLUMN "status" TYPE "RequestStatus_new" USING ("status"::text::"RequestStatus_new");
ALTER TYPE "RequestStatus" RENAME TO "RequestStatus_old";
ALTER TYPE "RequestStatus_new" RENAME TO "RequestStatus";
DROP TYPE "RequestStatus_old";
ALTER TABLE "component_requests" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "SubmissionStatus_new" AS ENUM ('SUBMITTED', 'GRADED', 'REVISION_REQUESTED');
ALTER TABLE "project_submissions" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "project_submissions" ALTER COLUMN "status" TYPE "SubmissionStatus_new" USING ("status"::text::"SubmissionStatus_new");
ALTER TYPE "SubmissionStatus" RENAME TO "SubmissionStatus_old";
ALTER TYPE "SubmissionStatus_new" RENAME TO "SubmissionStatus";
DROP TYPE "SubmissionStatus_old";
ALTER TABLE "project_submissions" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED';
COMMIT;

-- DropForeignKey
ALTER TABLE "admins" DROP CONSTRAINT "admins_userId_fkey";

-- DropForeignKey
ALTER TABLE "attendance_records" DROP CONSTRAINT "attendance_records_facultyId_fkey";

-- DropForeignKey
ALTER TABLE "class_schedules" DROP CONSTRAINT "class_schedules_courseId_fkey";

-- DropForeignKey
ALTER TABLE "class_schedules" DROP CONSTRAINT "class_schedules_facultyId_fkey";

-- DropForeignKey
ALTER TABLE "component_requests" DROP CONSTRAINT "component_requests_faculty_id_fkey";

-- DropForeignKey
ALTER TABLE "courses" DROP CONSTRAINT "courses_facultyId_fkey";

-- DropForeignKey
ALTER TABLE "enrollments" DROP CONSTRAINT "enrollments_courseId_fkey";

-- DropForeignKey
ALTER TABLE "enrollments" DROP CONSTRAINT "enrollments_studentId_fkey";

-- DropForeignKey
ALTER TABLE "faculty" DROP CONSTRAINT "faculty_userId_fkey";

-- DropForeignKey
ALTER TABLE "project_submissions" DROP CONSTRAINT "project_submissions_projectId_fkey";

-- DropForeignKey
ALTER TABLE "project_submissions" DROP CONSTRAINT "project_submissions_studentId_fkey";

-- DropForeignKey
ALTER TABLE "student_attendance" DROP CONSTRAINT "student_attendance_attendanceRecordId_fkey";

-- DropForeignKey
ALTER TABLE "student_attendance" DROP CONSTRAINT "student_attendance_studentId_fkey";

-- DropForeignKey
ALTER TABLE "students" DROP CONSTRAINT "students_userId_fkey";

-- DropIndex
DROP INDEX "admins_userId_key";

-- DropIndex
DROP INDEX "enrollments_studentId_courseId_key";

-- DropIndex
DROP INDEX "faculty_employeeId_key";

-- DropIndex
DROP INDEX "faculty_userId_key";

-- DropIndex
DROP INDEX "lab_components_component_category_idx";

-- DropIndex
DROP INDEX "lab_components_component_location_idx";

-- DropIndex
DROP INDEX "lab_components_created_by_idx";

-- DropIndex
DROP INDEX "project_submissions_projectId_studentId_key";

-- DropIndex
DROP INDEX "student_attendance_attendanceRecordId_studentId_key";

-- DropIndex
DROP INDEX "students_studentId_key";

-- DropIndex
DROP INDEX "students_userId_key";

-- AlterTable
ALTER TABLE "admins" DROP COLUMN "userId",
DROP COLUMN "workingHours",
ADD COLUMN     "user_id" TEXT NOT NULL,
ADD COLUMN     "working_hours" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "attendance_records" DROP COLUMN "courseId",
DROP COLUMN "createdAt",
DROP COLUMN "facultyId",
ADD COLUMN     "course_id" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "faculty_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "class_schedules" DROP COLUMN "courseId",
DROP COLUMN "dayOfWeek",
DROP COLUMN "endTime",
DROP COLUMN "facultyId",
DROP COLUMN "startTime",
ADD COLUMN     "course_id" TEXT NOT NULL,
ADD COLUMN     "day_of_week" TEXT NOT NULL,
ADD COLUMN     "end_time" TEXT NOT NULL,
ADD COLUMN     "faculty_id" TEXT NOT NULL,
ADD COLUMN     "start_time" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "component_requests" DROP COLUMN "collection_date",
DROP COLUMN "expected_return_date",
DROP COLUMN "faculty_id",
DROP COLUMN "faculty_notes",
ADD COLUMN     "approved_by" TEXT,
ADD COLUMN     "approved_date" TIMESTAMP(3),
ADD COLUMN     "project_id" TEXT NOT NULL,
ADD COLUMN     "purpose" TEXT NOT NULL,
ADD COLUMN     "required_date" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "courses" DROP COLUMN "enrolledStudents",
DROP COLUMN "facultyId",
DROP COLUMN "maxStudents",
ADD COLUMN     "enrolled_students" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "faculty_id" TEXT NOT NULL,
ADD COLUMN     "max_students" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "enrollments" DROP COLUMN "courseId",
DROP COLUMN "enrolledAt",
DROP COLUMN "studentId",
ADD COLUMN     "course_id" TEXT NOT NULL,
ADD COLUMN     "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "student_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "faculty" DROP COLUMN "employeeId",
DROP COLUMN "officeHours",
DROP COLUMN "userId",
ADD COLUMN     "employee_id" TEXT NOT NULL,
ADD COLUMN     "office_hours" TEXT NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "lab_components" DROP COLUMN "created_date",
DROP COLUMN "modified_date",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "modified_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "locations" DROP COLUMN "building",
DROP COLUMN "createdAt",
DROP COLUMN "facilities",
DROP COLUMN "floor",
DROP COLUMN "isAvailable",
DROP COLUMN "updatedAt",
ADD COLUMN     "contact_email" TEXT,
ADD COLUMN     "contact_person" TEXT,
ADD COLUMN     "contact_phone" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "in_charge_id" TEXT,
ADD COLUMN     "is_available" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "project_submissions" DROP COLUMN "projectId",
DROP COLUMN "studentId",
DROP COLUMN "submissionDate",
ADD COLUMN     "project_id" TEXT NOT NULL,
ADD COLUMN     "student_id" TEXT NOT NULL,
ADD COLUMN     "submission_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "student_attendance" DROP COLUMN "attendanceRecordId",
DROP COLUMN "studentId",
ADD COLUMN     "attendance_record_id" TEXT NOT NULL,
ADD COLUMN     "student_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "students" DROP COLUMN "advisorId",
DROP COLUMN "studentId",
DROP COLUMN "userId",
ADD COLUMN     "advisor_id" TEXT,
ADD COLUMN     "student_id" TEXT NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "createdAt",
DROP COLUMN "joinDate",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "join_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "admins_user_id_key" ON "admins"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_student_id_course_id_key" ON "enrollments"("student_id", "course_id");

-- CreateIndex
CREATE UNIQUE INDEX "faculty_user_id_key" ON "faculty"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "faculty_employee_id_key" ON "faculty"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "locations_name_key" ON "locations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "project_submissions_project_id_student_id_key" ON "project_submissions"("project_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_attendance_attendance_record_id_student_id_key" ON "student_attendance"("attendance_record_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_user_id_key" ON "students"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_student_id_key" ON "students"("student_id");

-- AddForeignKey
ALTER TABLE "admins" ADD CONSTRAINT "admins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty" ADD CONSTRAINT "faculty_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_submissions" ADD CONSTRAINT "project_submissions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_submissions" ADD CONSTRAINT "project_submissions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_attendance" ADD CONSTRAINT "student_attendance_attendance_record_id_fkey" FOREIGN KEY ("attendance_record_id") REFERENCES "attendance_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_attendance" ADD CONSTRAINT "student_attendance_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_requests" ADD CONSTRAINT "component_requests_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_requests" ADD CONSTRAINT "component_requests_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "faculty"("id") ON DELETE SET NULL ON UPDATE CASCADE;
