-- Library sharing: who added each folder entry, and folder shares
ALTER TABLE "library_folder_publications" ADD COLUMN "addedById" TEXT;

CREATE TABLE "library_folder_shares" (
    "id" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sharedById" TEXT NOT NULL,
    "permission" TEXT NOT NULL DEFAULT 'CONTRIBUTOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "library_folder_shares_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "library_folder_shares_folderId_userId_key" ON "library_folder_shares"("folderId", "userId");
CREATE INDEX "library_folder_shares_userId_idx" ON "library_folder_shares"("userId");

ALTER TABLE "library_folder_shares" ADD CONSTRAINT "library_folder_shares_folderId_fkey"
    FOREIGN KEY ("folderId") REFERENCES "library_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
