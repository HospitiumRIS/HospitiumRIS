import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';

/**
 * Library sharing.
 *
 * GET  /api/publications/library/shared
 *        -> { sharedWithMe, mySharesByFolder, contributionsByFolder }
 * GET  /api/publications/library/shared?searchUsers=<text>
 *        -> { users } people to share with (active accounts, not yourself)
 * POST /api/publications/library/shared  { action, ... }
 *   share            { folderId, userIds }        owner only
 *   unshare          { folderId, userId }         owner only
 *   leave            { folderId }                 member removes themselves
 *   addPublications  { folderId, publicationIds } owner or member (own publications only)
 *   removePublication{ folderId, publicationId }  owner: anything; member: only what they added
 *
 * A share on a folder covers that folder and all of its subfolders.
 */

const displayName = (u) => (u ? `${u.givenName || ''} ${u.familyName || ''}`.trim() || u.email : 'Unknown');
const userSelect = { id: true, givenName: true, familyName: true, email: true, avatarUrl: true, primaryInstitution: true };

function publicationSummary(p) {
  return {
    id: p.id,
    title: p.title || 'Untitled',
    authors: Array.isArray(p.authors) ? p.authors : [],
    journal: p.journal || null,
    year: p.year || (p.publicationDate ? new Date(p.publicationDate).getFullYear() : null),
    type: p.type || null,
    doi: p.doi || null,
    url: p.url || null,
    abstract: p.abstract || null,
  };
}

async function descendantsOf(rootId, ownerId) {
  const all = await prisma.libraryFolder.findMany({ where: { userId: ownerId }, select: { id: true, name: true, parentId: true } });
  const result = [];
  const walk = (parentId, depth) => {
    all.filter((f) => f.parentId === parentId).forEach((f) => {
      result.push({ id: f.id, name: f.name, parent: f.parentId, depth });
      walk(f.id, depth + 1);
    });
  };
  walk(rootId, 1);
  return result;
}

/** Resolve the caller's access to a folder: 'owner', 'member' (via a share on it or an ancestor) or null. */
async function resolveAccess(folderId, userId) {
  const folder = await prisma.libraryFolder.findUnique({ where: { id: folderId }, select: { id: true, userId: true, parentId: true, name: true } });
  if (!folder) return { role: null };
  if (folder.userId === userId) return { role: 'owner', folder };
  let cursor = folder;
  for (let i = 0; cursor && i < 50; i += 1) {
    const share = await prisma.libraryFolderShare.findUnique({ where: { folderId_userId: { folderId: cursor.id, userId } } });
    if (share) return { role: 'member', folder, share, rootFolderId: cursor.id };
    cursor = cursor.parentId
      ? await prisma.libraryFolder.findUnique({ where: { id: cursor.parentId }, select: { id: true, parentId: true } })
      : null;
  }
  return { role: null, folder };
}

async function userNames(ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return new Map();
  const users = await prisma.user.findMany({ where: { id: { in: unique } }, select: userSelect });
  return new Map(users.map((u) => [u.id, u]));
}

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('searchUsers');
    if (search !== null) {
      const q = search.trim();
      if (q.length < 2) return NextResponse.json({ success: true, users: [] });
      const users = await prisma.user.findMany({
        where: {
          id: { not: user.id },
          status: 'ACTIVE',
          OR: [
            { email: { contains: q, mode: 'insensitive' } },
            { givenName: { contains: q, mode: 'insensitive' } },
            { familyName: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: userSelect,
        take: 8,
        orderBy: [{ givenName: 'asc' }],
      });
      return NextResponse.json({ success: true, users: users.map((u) => ({ ...u, name: displayName(u) })) });
    }

    // ---- folders shared with me
    const myShares = await prisma.libraryFolderShare.findMany({
      where: { userId: user.id },
      include: { folder: { select: { id: true, name: true, userId: true, parentId: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const sharedWithMe = [];
    for (const share of myShares) {
      if (!share.folder) continue;
      const subfolders = await descendantsOf(share.folder.id, share.folder.userId);
      const folderIds = [share.folder.id, ...subfolders.map((f) => f.id)];
      const entries = await prisma.libraryFolderPublication.findMany({
        where: { folderId: { in: folderIds } },
        include: { publication: true },
        orderBy: { addedAt: 'desc' },
      });
      const members = await prisma.libraryFolderShare.findMany({ where: { folderId: share.folder.id }, select: { userId: true, createdAt: true } });
      const people = await userNames([share.folder.userId, share.sharedById, ...members.map((m) => m.userId), ...entries.map((e) => e.addedById)]);
      const owner = people.get(share.folder.userId);
      sharedWithMe.push({
        shareId: share.id,
        folder: { id: share.folder.id, name: share.folder.name },
        subfolders,
        owner: owner ? { id: owner.id, name: displayName(owner), email: owner.email, avatarUrl: owner.avatarUrl } : null,
        sharedBy: people.get(share.sharedById) ? { id: share.sharedById, name: displayName(people.get(share.sharedById)) } : null,
        sharedAt: share.createdAt,
        permission: share.permission,
        members: members.map((m) => {
          const u = people.get(m.userId);
          return { id: m.userId, name: displayName(u), email: u?.email || null, avatarUrl: u?.avatarUrl || null, isMe: m.userId === user.id };
        }),
        items: entries.map((e) => {
          const addedById = e.addedById || share.folder.userId;
          const adder = people.get(addedById);
          return {
            folderId: e.folderId,
            publication: publicationSummary(e.publication),
            addedAt: e.addedAt,
            addedBy: { id: addedById, name: displayName(adder), isMe: addedById === user.id, isOwner: addedById === share.folder.userId },
            canRemove: addedById === user.id,
          };
        }),
      });
    }

    // ---- folders I own that are shared, and what members added to them
    const ownFolders = await prisma.libraryFolder.findMany({ where: { userId: user.id }, select: { id: true } });
    const ownIds = ownFolders.map((f) => f.id);
    const [ownShares, contributions] = ownIds.length ? await Promise.all([
      prisma.libraryFolderShare.findMany({ where: { folderId: { in: ownIds } }, orderBy: { createdAt: 'asc' } }),
      prisma.libraryFolderPublication.findMany({
        where: { folderId: { in: ownIds }, addedById: { not: null }, NOT: { addedById: user.id } },
        include: { publication: true },
        orderBy: { addedAt: 'desc' },
      }),
    ]) : [[], []];
    const people = await userNames([...ownShares.map((s) => s.userId), ...contributions.map((c) => c.addedById)]);

    const mySharesByFolder = {};
    ownShares.forEach((s) => {
      const u = people.get(s.userId);
      (mySharesByFolder[s.folderId] ||= []).push({ userId: s.userId, name: displayName(u), email: u?.email || null, avatarUrl: u?.avatarUrl || null, institution: u?.primaryInstitution || null, sharedAt: s.createdAt });
    });
    const contributionsByFolder = {};
    contributions.forEach((c) => {
      const u = people.get(c.addedById);
      (contributionsByFolder[c.folderId] ||= []).push({
        folderId: c.folderId,
        publication: publicationSummary(c.publication),
        addedAt: c.addedAt,
        addedBy: { id: c.addedById, name: displayName(u) },
        canRemove: true,
      });
    });

    return NextResponse.json({ success: true, sharedWithMe, mySharesByFolder, contributionsByFolder });
  } catch (error) {
    console.error('Error loading shared libraries:', error);
    return NextResponse.json({ success: false, error: 'Failed to load shared libraries' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const { action, folderId } = body;
    if (!folderId) return NextResponse.json({ success: false, error: 'Folder ID is required' }, { status: 400 });

    const access = await resolveAccess(folderId, user.id);
    if (!access.role) return NextResponse.json({ success: false, error: 'Library not found' }, { status: 404 });

    switch (action) {
      case 'share': {
        if (access.role !== 'owner') return NextResponse.json({ success: false, error: 'Only the owner can share this library' }, { status: 403 });
        const ids = [...new Set((body.userIds || []).filter((id) => id && id !== user.id))];
        if (!ids.length) return NextResponse.json({ success: false, error: 'Choose at least one person' }, { status: 400 });
        const valid = await prisma.user.findMany({ where: { id: { in: ids }, status: 'ACTIVE' }, select: { id: true } });
        await prisma.libraryFolderShare.createMany({
          data: valid.map((u) => ({ folderId, userId: u.id, sharedById: user.id })),
          skipDuplicates: true,
        });
        return NextResponse.json({ success: true, shared: valid.length });
      }

      case 'unshare': {
        if (access.role !== 'owner') return NextResponse.json({ success: false, error: 'Only the owner can manage members' }, { status: 403 });
        if (!body.userId) return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
        await prisma.libraryFolderShare.deleteMany({ where: { folderId, userId: body.userId } });
        return NextResponse.json({ success: true });
      }

      case 'leave': {
        if (access.role !== 'member') return NextResponse.json({ success: false, error: 'You are not a member of this library' }, { status: 400 });
        await prisma.libraryFolderShare.deleteMany({ where: { folderId: access.rootFolderId, userId: user.id } });
        return NextResponse.json({ success: true });
      }

      case 'addPublications': {
        const ids = [...new Set((body.publicationIds || []).filter(Boolean))];
        if (!ids.length) return NextResponse.json({ success: false, error: 'Choose at least one publication' }, { status: 400 });
        // Anyone with access may add publications they are an author of.
        const own = await prisma.publication.findMany({
          where: { id: { in: ids }, OR: [{ authorId: user.id }, { authorRelations: { some: { userId: user.id } } }] },
          select: { id: true },
        });
        if (!own.length) return NextResponse.json({ success: false, error: 'You can only add your own publications' }, { status: 400 });
        const result = await prisma.libraryFolderPublication.createMany({
          data: own.map((p) => ({ folderId, publicationId: p.id, addedById: user.id })),
          skipDuplicates: true,
        });
        return NextResponse.json({ success: true, added: result.count, skipped: ids.length - result.count });
      }

      case 'removePublication': {
        if (!body.publicationId) return NextResponse.json({ success: false, error: 'Publication ID is required' }, { status: 400 });
        const entry = await prisma.libraryFolderPublication.findUnique({
          where: { folderId_publicationId: { folderId, publicationId: body.publicationId } },
          select: { id: true, addedById: true },
        });
        if (!entry) return NextResponse.json({ success: false, error: 'Not in this library' }, { status: 404 });
        const ownerOfFolder = access.role === 'owner';
        if (!ownerOfFolder && entry.addedById !== user.id) {
          return NextResponse.json({ success: false, error: 'You can only remove publications you added' }, { status: 403 });
        }
        await prisma.libraryFolderPublication.delete({ where: { id: entry.id } });
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in shared library action:', error);
    return NextResponse.json({ success: false, error: 'Failed to update shared library' }, { status: 500 });
  }
}
