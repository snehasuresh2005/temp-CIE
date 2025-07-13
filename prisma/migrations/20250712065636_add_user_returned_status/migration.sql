/*
  Warnings:

  - The values [PENDING_RETURN] on the enum `RequestStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RequestStatus_new" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COLLECTED', 'RETURNED', 'USER_RETURNED', 'OVERDUE');
ALTER TABLE "component_requests" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "library_requests" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "component_requests" ALTER COLUMN "status" TYPE "RequestStatus_new" USING ("status"::text::"RequestStatus_new");
ALTER TABLE "library_requests" ALTER COLUMN "status" TYPE "RequestStatus_new" USING ("status"::text::"RequestStatus_new");
ALTER TYPE "RequestStatus" RENAME TO "RequestStatus_old";
ALTER TYPE "RequestStatus_new" RENAME TO "RequestStatus";
DROP TYPE "RequestStatus_old";
ALTER TABLE "component_requests" ALTER COLUMN "status" SET DEFAULT 'PENDING';
ALTER TABLE "library_requests" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
