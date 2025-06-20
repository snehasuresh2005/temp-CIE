/*
  Warnings:

  - You are about to drop the column `project_accepted_by` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `project_components_needed` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `project_course` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `project_created_by` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `project_created_date` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `project_description` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `project_expected_completion_date` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `project_modified_by` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `project_modified_date` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `project_name` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `project_status` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `project_type` on the `projects` table. All the data in the column will be lost.
  - Added the required column `course_id` to the `projects` table without a default value. This is not possible if the table is not empty.
  - Added the required column `created_by` to the `projects` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `projects` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expected_completion_date` to the `projects` table without a default value. This is not possible if the table is not empty.
  - Added the required column `modified_date` to the `projects` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `projects` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "projects" DROP COLUMN "project_accepted_by",
DROP COLUMN "project_components_needed",
DROP COLUMN "project_course",
DROP COLUMN "project_created_by",
DROP COLUMN "project_created_date",
DROP COLUMN "project_description",
DROP COLUMN "project_expected_completion_date",
DROP COLUMN "project_modified_by",
DROP COLUMN "project_modified_date",
DROP COLUMN "project_name",
DROP COLUMN "project_status",
DROP COLUMN "project_type",
ADD COLUMN     "accepted_by" TEXT,
ADD COLUMN     "components_needed" TEXT[],
ADD COLUMN     "course_id" TEXT NOT NULL,
ADD COLUMN     "created_by" TEXT NOT NULL,
ADD COLUMN     "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "expected_completion_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "modified_by" TEXT,
ADD COLUMN     "modified_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "status" "ProjectStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "type" "ProjectType" NOT NULL DEFAULT 'FACULTY_ASSIGNED';
