/*
  Warnings:

  - You are about to drop the column `employee_id` on the `faculty` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[faculty_id]` on the table `faculty` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `faculty_id` to the `faculty` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "faculty_employee_id_key";

-- AlterTable
ALTER TABLE "faculty" DROP COLUMN "employee_id",
ADD COLUMN     "faculty_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "faculty_faculty_id_key" ON "faculty"("faculty_id");
