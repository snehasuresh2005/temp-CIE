-- AlterTable
ALTER TABLE "library_items" ADD COLUMN     "faculty_id" TEXT;

-- AddForeignKey
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculty"("id") ON DELETE SET NULL ON UPDATE CASCADE;
