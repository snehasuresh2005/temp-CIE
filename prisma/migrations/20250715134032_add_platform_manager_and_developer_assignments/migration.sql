-- CreateTable
CREATE TABLE "platform_manager_assignments" (
    "id" TEXT NOT NULL,
    "faculty_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" TEXT NOT NULL,

    CONSTRAINT "platform_manager_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "developer_assignments" (
    "id" TEXT NOT NULL,
    "faculty_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" TEXT NOT NULL,

    CONSTRAINT "developer_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_manager_assignments_faculty_id_key" ON "platform_manager_assignments"("faculty_id");

-- CreateIndex
CREATE UNIQUE INDEX "developer_assignments_faculty_id_key" ON "developer_assignments"("faculty_id");

-- AddForeignKey
ALTER TABLE "platform_manager_assignments" ADD CONSTRAINT "platform_manager_assignments_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "developer_assignments" ADD CONSTRAINT "developer_assignments_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;
