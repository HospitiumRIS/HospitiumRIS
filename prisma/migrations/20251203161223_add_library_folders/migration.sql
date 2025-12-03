-- CreateTable
CREATE TABLE "public"."library_folders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "expanded" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "library_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."library_items" (
    "id" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "library_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "library_folders_userId_name_parentId_key" ON "public"."library_folders"("userId", "name", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "library_items_folderId_publicationId_key" ON "public"."library_items"("folderId", "publicationId");

-- AddForeignKey
ALTER TABLE "public"."library_folders" ADD CONSTRAINT "library_folders_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."library_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."library_items" ADD CONSTRAINT "library_items_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "public"."library_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."library_items" ADD CONSTRAINT "library_items_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "public"."publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
