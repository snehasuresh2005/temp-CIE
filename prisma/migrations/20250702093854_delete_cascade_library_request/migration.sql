/*
  Warnings:

  - You are about to drop the column `faculty_id` on the `library_items` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "library_items" DROP CONSTRAINT "library_items_faculty_id_fkey";

-- AlterTable
ALTER TABLE "library_items" DROP COLUMN "faculty_id";
