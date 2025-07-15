-- AlterTable
ALTER TABLE "lab_components" ADD COLUMN     "individual_items" JSONB,
ADD COLUMN     "track_individual" BOOLEAN NOT NULL DEFAULT false;
