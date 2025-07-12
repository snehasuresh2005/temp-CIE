-- CreateTable
CREATE TABLE "library_items" (
    "id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "item_description" TEXT NOT NULL,
    "item_specification" TEXT,
    "item_quantity" INTEGER NOT NULL,
    "item_tag_id" TEXT,
    "item_category" TEXT NOT NULL,
    "item_location" TEXT NOT NULL,
    "image_path" TEXT NOT NULL DEFAULT 'library-images',
    "front_image_id" TEXT,
    "back_image_id" TEXT,
    "invoice_number" TEXT,
    "purchase_value" DECIMAL(10,2),
    "purchased_from" TEXT,
    "purchase_currency" TEXT NOT NULL DEFAULT 'INR',
    "purchase_date" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "modified_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "library_items_pkey" PRIMARY KEY ("id")
);
