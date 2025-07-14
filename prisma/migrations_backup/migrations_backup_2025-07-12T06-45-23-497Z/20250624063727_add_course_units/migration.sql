-- CreateTable
CREATE TABLE "course_units" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "unit_number" INTEGER NOT NULL,
    "unit_name" TEXT NOT NULL,
    "unit_description" TEXT NOT NULL,
    "assignment_count" INTEGER NOT NULL DEFAULT 0,
    "hours_per_unit" INTEGER NOT NULL DEFAULT 1,
    "created_by" TEXT NOT NULL,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_by" TEXT,
    "modified_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_units_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_units_course_id_unit_number_key" ON "course_units"("course_id", "unit_number");

-- AddForeignKey
ALTER TABLE "course_units" ADD CONSTRAINT "course_units_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
