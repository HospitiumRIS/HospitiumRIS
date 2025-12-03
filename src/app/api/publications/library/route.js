import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../lib/auth-server';

/**
 * GET /api/publications/library
 * Get all library folders and their publications for the current user
 */
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all folders for the user with their publications
    const folders = await prisma.libraryFolder.findMany({
      where: { userId: user.id },
      include: {
        publications: {
          include: {
            publication: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Transform to the format expected by the frontend
    const transformedFolders = folders.map(folder => ({
      id: folder.id,
      name: folder.name,
      parent: folder.parentId,
      expanded: folder.expanded,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt
    }));

    // Create a map of folder ID to publication IDs
    const folderPublications = {};
    folders.forEach(folder => {
      folderPublications[folder.id] = folder.publications.map(fp => fp.publicationId);
    });

    return NextResponse.json({
      success: true,
      folders: transformedFolders,
      folderPublications
    });

  } catch (error) {
    console.error('Error fetching library:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch library' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/publications/library
 * Create a new folder or add a publication to a folder
 */
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'createFolder': {
        const { name, parentId } = body;
        
        if (!name || !name.trim()) {
          return NextResponse.json(
            { success: false, error: 'Folder name is required' },
            { status: 400 }
          );
        }

        // If parentId is provided, verify it belongs to the user
        if (parentId) {
          const parentFolder = await prisma.libraryFolder.findFirst({
            where: { id: parentId, userId: user.id }
          });
          
          if (!parentFolder) {
            return NextResponse.json(
              { success: false, error: 'Parent folder not found' },
              { status: 404 }
            );
          }
        }

        const folder = await prisma.libraryFolder.create({
          data: {
            name: name.trim(),
            parentId: parentId || null,
            userId: user.id,
            expanded: false
          }
        });

        return NextResponse.json({
          success: true,
          folder: {
            id: folder.id,
            name: folder.name,
            parent: folder.parentId,
            expanded: folder.expanded
          }
        });
      }

      case 'addPublication': {
        const { folderId, publicationId } = body;
        
        if (!folderId || !publicationId) {
          return NextResponse.json(
            { success: false, error: 'Folder ID and publication ID are required' },
            { status: 400 }
          );
        }

        // Verify folder belongs to user
        const folder = await prisma.libraryFolder.findFirst({
          where: { id: folderId, userId: user.id }
        });
        
        if (!folder) {
          return NextResponse.json(
            { success: false, error: 'Folder not found' },
            { status: 404 }
          );
        }

        // Check if publication exists
        const publication = await prisma.publication.findUnique({
          where: { id: publicationId }
        });
        
        if (!publication) {
          return NextResponse.json(
            { success: false, error: 'Publication not found' },
            { status: 404 }
          );
        }

        // Add publication to folder (upsert to handle duplicates)
        await prisma.libraryFolderPublication.upsert({
          where: {
            folderId_publicationId: {
              folderId,
              publicationId
            }
          },
          create: {
            folderId,
            publicationId
          },
          update: {} // No update needed, just ensuring it exists
        });

        return NextResponse.json({ success: true });
      }

      case 'removePublication': {
        const { folderId, publicationId } = body;
        
        if (!folderId || !publicationId) {
          return NextResponse.json(
            { success: false, error: 'Folder ID and publication ID are required' },
            { status: 400 }
          );
        }

        // Verify folder belongs to user
        const folder = await prisma.libraryFolder.findFirst({
          where: { id: folderId, userId: user.id }
        });
        
        if (!folder) {
          return NextResponse.json(
            { success: false, error: 'Folder not found' },
            { status: 404 }
          );
        }

        await prisma.libraryFolderPublication.deleteMany({
          where: {
            folderId,
            publicationId
          }
        });

        return NextResponse.json({ success: true });
      }

      case 'movePublication': {
        const { sourceFolderId, targetFolderId, publicationId } = body;
        
        if (!sourceFolderId || !targetFolderId || !publicationId) {
          return NextResponse.json(
            { success: false, error: 'Source folder, target folder, and publication ID are required' },
            { status: 400 }
          );
        }

        // Verify both folders belong to user
        const folders = await prisma.libraryFolder.findMany({
          where: { 
            id: { in: [sourceFolderId, targetFolderId] },
            userId: user.id 
          }
        });
        
        if (folders.length !== 2) {
          return NextResponse.json(
            { success: false, error: 'One or both folders not found' },
            { status: 404 }
          );
        }

        // Remove from source and add to target in a transaction
        await prisma.$transaction([
          prisma.libraryFolderPublication.deleteMany({
            where: { folderId: sourceFolderId, publicationId }
          }),
          prisma.libraryFolderPublication.upsert({
            where: {
              folderId_publicationId: {
                folderId: targetFolderId,
                publicationId
              }
            },
            create: { folderId: targetFolderId, publicationId },
            update: {}
          })
        ]);

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in library POST:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/publications/library
 * Update a folder (rename, move, toggle expanded)
 */
export async function PUT(request) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, folderId } = body;

    if (!folderId) {
      return NextResponse.json(
        { success: false, error: 'Folder ID is required' },
        { status: 400 }
      );
    }

    // Verify folder belongs to user
    const folder = await prisma.libraryFolder.findFirst({
      where: { id: folderId, userId: user.id }
    });
    
    if (!folder) {
      return NextResponse.json(
        { success: false, error: 'Folder not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'rename': {
        const { name } = body;
        
        if (!name || !name.trim()) {
          return NextResponse.json(
            { success: false, error: 'Folder name is required' },
            { status: 400 }
          );
        }

        const updatedFolder = await prisma.libraryFolder.update({
          where: { id: folderId },
          data: { name: name.trim() }
        });

        return NextResponse.json({
          success: true,
          folder: {
            id: updatedFolder.id,
            name: updatedFolder.name,
            parent: updatedFolder.parentId,
            expanded: updatedFolder.expanded
          }
        });
      }

      case 'move': {
        const { parentId } = body;
        
        // If parentId is provided, verify it belongs to the user and is not a descendant
        if (parentId) {
          const targetFolder = await prisma.libraryFolder.findFirst({
            where: { id: parentId, userId: user.id }
          });
          
          if (!targetFolder) {
            return NextResponse.json(
              { success: false, error: 'Target folder not found' },
              { status: 404 }
            );
          }

          // Prevent moving a folder into its own descendant
          const descendants = await getDescendantIds(folderId, user.id);
          if (descendants.includes(parentId)) {
            return NextResponse.json(
              { success: false, error: 'Cannot move folder into its own descendant' },
              { status: 400 }
            );
          }
        }

        const updatedFolder = await prisma.libraryFolder.update({
          where: { id: folderId },
          data: { parentId: parentId || null }
        });

        return NextResponse.json({
          success: true,
          folder: {
            id: updatedFolder.id,
            name: updatedFolder.name,
            parent: updatedFolder.parentId,
            expanded: updatedFolder.expanded
          }
        });
      }

      case 'toggleExpanded': {
        const updatedFolder = await prisma.libraryFolder.update({
          where: { id: folderId },
          data: { expanded: !folder.expanded }
        });

        return NextResponse.json({
          success: true,
          folder: {
            id: updatedFolder.id,
            name: updatedFolder.name,
            parent: updatedFolder.parentId,
            expanded: updatedFolder.expanded
          }
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in library PUT:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update folder' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/publications/library
 * Delete a folder and all its contents
 */
export async function DELETE(request) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');

    if (!folderId) {
      return NextResponse.json(
        { success: false, error: 'Folder ID is required' },
        { status: 400 }
      );
    }

    // Verify folder belongs to user
    const folder = await prisma.libraryFolder.findFirst({
      where: { id: folderId, userId: user.id }
    });
    
    if (!folder) {
      return NextResponse.json(
        { success: false, error: 'Folder not found' },
        { status: 404 }
      );
    }

    // Delete folder (cascade will handle children and publications)
    await prisma.libraryFolder.delete({
      where: { id: folderId }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in library DELETE:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete folder' },
      { status: 500 }
    );
  }
}

// Helper function to get all descendant folder IDs
async function getDescendantIds(folderId, userId) {
  const descendants = [];
  
  async function findDescendants(parentId) {
    const children = await prisma.libraryFolder.findMany({
      where: { parentId, userId },
      select: { id: true }
    });
    
    for (const child of children) {
      descendants.push(child.id);
      await findDescendants(child.id);
    }
  }
  
  await findDescendants(folderId);
  return descendants;
}

