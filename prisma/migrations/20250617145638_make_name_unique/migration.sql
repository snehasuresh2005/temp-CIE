/*
  Warnings:

  - You are about to drop the `lab_components` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "component_requests" DROP CONSTRAINT "component_requests_componentId_fkey";

-- DropTable
DROP TABLE "lab_components";

-- CreateTable
CREATE TABLE "LabComponent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "totalQuantity" INTEGER NOT NULL,
    "availableQuantity" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabComponent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LabComponent_name_key" ON "LabComponent"("name");

-- AddForeignKey
ALTER TABLE "component_requests" ADD CONSTRAINT "component_requests_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "LabComponent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
