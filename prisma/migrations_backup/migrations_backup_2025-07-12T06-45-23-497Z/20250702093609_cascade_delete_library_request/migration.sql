-- DropForeignKey
ALTER TABLE "library_requests" DROP CONSTRAINT "library_requests_item_id_fkey";

-- AddForeignKey
ALTER TABLE "library_requests" ADD CONSTRAINT "library_requests_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "library_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
