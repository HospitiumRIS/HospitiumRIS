import prisma from '@/lib/prisma';

export function userLibraryWhere(userId) {
  return {
    authorRelations: {
      some: { userId },
    },
  };
}

export async function findExistingPublication(pub) {
  if (pub.doi) {
    const byDoi = await prisma.publication.findFirst({ where: { doi: pub.doi } });
    if (byDoi) return byDoi;
  }

  if (pub.pubmedId) {
    const byPubmed = await prisma.publication.findFirst({
      where: { url: { contains: pub.pubmedId } },
    });
    if (byPubmed) return byPubmed;
  }

  if (pub.title && pub.year) {
    const byTitleYear = await prisma.publication.findFirst({
      where: {
        title: pub.title,
        year: parseInt(pub.year, 10),
      },
    });
    if (byTitleYear) return byTitleYear;
  }

  return null;
}

export async function userOwnsPublication(userId, publicationId) {
  const link = await prisma.publicationAuthor.findUnique({
    where: {
      userId_publicationId: { userId, publicationId },
    },
    select: { id: true },
  });
  return Boolean(link);
}

export async function addPublicationToUserLibrary(userId, publicationId) {
  await prisma.publicationAuthor.upsert({
    where: {
      userId_publicationId: { userId, publicationId },
    },
    create: {
      userId,
      publicationId,
      authorOrder: 1,
    },
    update: {},
  });
}

export async function removePublicationFromUserLibrary(userId, publicationId) {
  const link = await prisma.publicationAuthor.findUnique({
    where: {
      userId_publicationId: { userId, publicationId },
    },
    select: { id: true },
  });

  if (!link) return false;

  const userFolders = await prisma.libraryFolder.findMany({
    where: { userId },
    select: { id: true },
  });

  await prisma.$transaction([
    prisma.publicationAuthor.delete({ where: { id: link.id } }),
    prisma.libraryFolderPublication.deleteMany({
      where: {
        publicationId,
        folderId: { in: userFolders.map((folder) => folder.id) },
      },
    }),
  ]);

  const remaining = await prisma.publicationAuthor.count({
    where: { publicationId },
  });
  if (remaining === 0) {
    await prisma.publication.delete({ where: { id: publicationId } });
  }

  return true;
}
