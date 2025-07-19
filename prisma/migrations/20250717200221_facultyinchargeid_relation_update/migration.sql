/*
  Warnings:

  - You are about to drop the column `facultyId` on the `Opportunity` table. All the data in the column will be lost.
  - Added the required column `facultyInChargeId` to the `Opportunity` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Opportunity" DROP CONSTRAINT "Opportunity_facultyId_fkey";

-- Step 1: Add new column as nullable
ALTER TABLE "Opportunity" ADD COLUMN "facultyInChargeId" TEXT;

-- Step 2: Copy data from old column
UPDATE "Opportunity" SET "facultyInChargeId" = "facultyId" WHERE "facultyId" IS NOT NULL;

-- Step 3: Set NOT NULL
ALTER TABLE "Opportunity" ALTER COLUMN "facultyInChargeId" SET NOT NULL;

-- Step 4: Drop old column
ALTER TABLE "Opportunity" DROP COLUMN "facultyId";

-- Step 5: Add new foreign key
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_facultyInChargeId_fkey" FOREIGN KEY ("facultyInChargeId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
