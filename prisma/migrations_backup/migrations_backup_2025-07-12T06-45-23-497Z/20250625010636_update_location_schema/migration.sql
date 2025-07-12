/*
  Warnings:

  - You are about to drop the column `contact_email` on the `locations` table. All the data in the column will be lost.
  - You are about to drop the column `contact_person` on the `locations` table. All the data in the column will be lost.
  - You are about to drop the column `contact_phone` on the `locations` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `locations` table. All the data in the column will be lost.
  - You are about to drop the column `in_charge_id` on the `locations` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `locations` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `locations` table. All the data in the column will be lost.
  - Added the required column `building` to the `locations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `created_by` to the `locations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `floor` to the `locations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location_type` to the `locations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `modified_date` to the `locations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `room_number` to the `locations` table without a default value. This is not possible if the table is not empty.
  - Made the column `capacity` on table `locations` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LocationType" ADD VALUE 'CABIN';
ALTER TYPE "LocationType" ADD VALUE 'LECTURE_HALL';
ALTER TYPE "LocationType" ADD VALUE 'AUDITORIUM';
ALTER TYPE "LocationType" ADD VALUE 'SEMINAR_HALL';

-- DropIndex
DROP INDEX "locations_name_key";

-- AlterTable
ALTER TABLE "locations" DROP COLUMN "contact_email",
DROP COLUMN "contact_person",
DROP COLUMN "contact_phone",
DROP COLUMN "created_at",
DROP COLUMN "in_charge_id",
DROP COLUMN "type",
DROP COLUMN "updated_at",
ADD COLUMN     "building" TEXT NOT NULL,
ADD COLUMN     "created_by" TEXT NOT NULL,
ADD COLUMN     "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "floor" TEXT NOT NULL,
ADD COLUMN     "images" TEXT[],
ADD COLUMN     "location_type" "LocationType" NOT NULL,
ADD COLUMN     "modified_by" TEXT,
ADD COLUMN     "modified_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "room_number" TEXT NOT NULL,
ADD COLUMN     "wing" TEXT,
ALTER COLUMN "capacity" SET NOT NULL;

-- CreateTable
CREATE TABLE "location_bookings" (
    "id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "faculty_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "purpose" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "location_bookings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "location_bookings" ADD CONSTRAINT "location_bookings_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_bookings" ADD CONSTRAINT "location_bookings_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;
