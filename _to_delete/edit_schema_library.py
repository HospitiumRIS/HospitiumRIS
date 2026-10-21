import sys, os
root = sys.argv[1]
p = os.path.join(root, 'prisma/schema.prisma')
s = open(p, encoding='utf-8').read()

def rep(old, new):
    global s
    assert s.count(old) == 1, f'NOT UNIQUE/FOUND ({s.count(old)}): {old[:80]}'
    s = s.replace(old, new)

rep("""  // Publications in this folder
  publications LibraryFolderPublication[]

  @@map("library_folders")
}""", """  // Publications in this folder
  publications LibraryFolderPublication[]

  // People this folder (and its subfolders) is shared with
  shares LibraryFolderShare[]

  @@map("library_folders")
}

// A library folder shared with another researcher. Sharing covers the folder and all
// its subfolders. Members can view and add publications, and remove only what they added.
model LibraryFolderShare {
  id         String   @id @default(cuid())
  folderId   String
  userId     String // Member the folder is shared with
  sharedById String // Owner who shared it
  permission String   @default("CONTRIBUTOR")
  createdAt  DateTime @default(now())

  folder LibraryFolder @relation(fields: [folderId], references: [id], onDelete: Cascade)

  @@unique([folderId, userId])
  @@index([userId])
  @@map("library_folder_shares")
}""")

rep("""  // When the publication was added to the folder
  addedAt DateTime @default(now())
""", """  // When the publication was added to the folder, and by whom (null = folder owner)
  addedAt   DateTime @default(now())
  addedById String?
""")
open(p, 'w', encoding='utf-8').write(s)
print('schema edited')

mdir = os.path.join(root, 'prisma/migrations/20261021030000_library_folder_sharing')
os.makedirs(mdir, exist_ok=True)
open(os.path.join(mdir, 'migration.sql'), 'w', encoding='utf-8').write('''-- Library sharing: who added each folder entry, and folder shares
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
''')
print('migration written')

# existing library route: record who added each entry
p = os.path.join(root, 'src/app/api/publications/library/route.js')
r = open(p, encoding='utf-8').read()
def rr(old, new, count=1):
    global r
    assert r.count(old) == count, f'route: ({r.count(old)}) {old[:80]}'
    r = r.replace(old, new)
rr("""          create: {
            folderId,
            publicationId
          },
          update: {} // No update needed, just ensuring it exists""", """          create: {
            folderId,
            publicationId,
            addedById: user.id
          },
          update: {} // No update needed, just ensuring it exists""")
rr("data: ownedIds.map((publicationId) => ({ folderId, publicationId })),", "data: ownedIds.map((publicationId) => ({ folderId, publicationId, addedById: user.id })),")
rr("data: uniqueIds.map((publicationId) => ({ folderId: targetFolderId, publicationId })),", "data: uniqueIds.map((publicationId) => ({ folderId: targetFolderId, publicationId, addedById: user.id })),")
rr("create: { folderId: targetFolderId, publicationId },", "create: { folderId: targetFolderId, publicationId, addedById: user.id },")
open(p, 'w', encoding='utf-8').write(r)
print('library route edited')
