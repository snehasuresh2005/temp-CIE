-- AlterEnum
ALTER TYPE "RequestStatus" ADD VALUE 'OVERDUE';

-- AlterTable
ALTER TABLE "library_items" ADD COLUMN     "available_quantity" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "library_requests" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "purpose" TEXT NOT NULL,
    "request_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "required_date" TIMESTAMP(3) NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "collection_date" TIMESTAMP(3),
    "return_date" TIMESTAMP(3),
    "notes" TEXT,
    "faculty_notes" TEXT,
    "faculty_id" TEXT,

    CONSTRAINT "library_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "library_requests" ADD CONSTRAINT "library_requests_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "library_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_requests" ADD CONSTRAINT "library_requests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_requests" ADD CONSTRAINT "library_requests_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculty"("id") ON DELETE SET NULL ON UPDATE CASCADE;
