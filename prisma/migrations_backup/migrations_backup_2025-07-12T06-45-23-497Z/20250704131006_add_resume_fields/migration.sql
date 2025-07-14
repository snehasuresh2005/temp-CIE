-- AlterTable
ALTER TABLE "faculty" ADD COLUMN     "resume_id" TEXT,
ADD COLUMN     "resume_path" TEXT DEFAULT 'resumes';

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "resume_id" TEXT,
ADD COLUMN     "resume_path" TEXT DEFAULT 'resumes';
