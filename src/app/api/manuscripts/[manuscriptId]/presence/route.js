import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma.js';
import { getUserId, getAuthenticatedUser } from '../../../../../lib/auth-server.js';

// In-memory presence store (in production, use Redis or database)
// Map: manuscriptId -> Map(userId -> { user info, lastSeen })
const presenceStore = new Map();

// Presence timeout in milliseconds (30 seconds)
const PRESENCE_TIMEOUT = 30000;

// Clean up stale presence entries
function cleanupStalePresence(manuscriptId) {
  const manuscriptPresence = presenceStore.get(manuscriptId);
  if (!manuscriptPresence) return;
  
  const now = Date.now();
  for (const [userId, presence] of manuscriptPresence.entries()) {
    if (now - presence.lastSeen > PRESENCE_TIMEOUT) {
      manuscriptPresence.delete(userId);
    }
  }
  
  // Clean up empty manuscript entries
  if (manuscriptPresence.size === 0) {
    presenceStore.delete(manuscriptId);
  }
}

// GET - Get all online users for a manuscript
export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const { manuscriptId } = resolvedParams;
    
    if (!manuscriptId) {
      return NextResponse.json(
        { error: 'Manuscript ID is required' },
        { status: 400 }
      );
    }
    
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Clean up stale entries first
    cleanupStalePresence(manuscriptId);
    
    // Get current presence for this manuscript
    const manuscriptPresence = presenceStore.get(manuscriptId);
    const onlineUsers = [];
    
    if (manuscriptPresence) {
      for (const [onlineUserId, presence] of manuscriptPresence.entries()) {
        onlineUsers.push({
          id: onlineUserId,
          name: presence.name,
          givenName: presence.givenName,
          familyName: presence.familyName,
          email: presence.email,
          lastSeen: presence.lastSeen,
          isCurrentUser: onlineUserId === userId
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        manuscriptId,
        onlineUsers,
        onlineCount: onlineUsers.length
      }
    });
    
  } catch (error) {
    console.error('Error getting presence:', error);
    return NextResponse.json(
      { error: 'Failed to get presence data' },
      { status: 500 }
    );
  }
}

// POST - Update presence (heartbeat)
export async function POST(request, { params }) {
  try {
    const resolvedParams = await params;
    const { manuscriptId } = resolvedParams;
    
    if (!manuscriptId) {
      return NextResponse.json(
        { error: 'Manuscript ID is required' },
        { status: 400 }
      );
    }
    
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Clean up stale entries first
    cleanupStalePresence(manuscriptId);
    
    // Initialize manuscript presence map if needed
    if (!presenceStore.has(manuscriptId)) {
      presenceStore.set(manuscriptId, new Map());
    }
    
    const manuscriptPresence = presenceStore.get(manuscriptId);
    
    // Update user presence
    manuscriptPresence.set(user.id, {
      name: `${user.givenName || ''} ${user.familyName || ''}`.trim() || user.email,
      givenName: user.givenName,
      familyName: user.familyName,
      email: user.email,
      lastSeen: Date.now()
    });
    
    // Get all online users
    const onlineUsers = [];
    for (const [onlineUserId, presence] of manuscriptPresence.entries()) {
      onlineUsers.push({
        id: onlineUserId,
        name: presence.name,
        givenName: presence.givenName,
        familyName: presence.familyName,
        email: presence.email,
        lastSeen: presence.lastSeen,
        isCurrentUser: onlineUserId === user.id
      });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        manuscriptId,
        onlineUsers,
        onlineCount: onlineUsers.length
      }
    });
    
  } catch (error) {
    console.error('Error updating presence:', error);
    return NextResponse.json(
      { error: 'Failed to update presence' },
      { status: 500 }
    );
  }
}

// DELETE - Remove presence (user leaves)
export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params;
    const { manuscriptId } = resolvedParams;
    
    if (!manuscriptId) {
      return NextResponse.json(
        { error: 'Manuscript ID is required' },
        { status: 400 }
      );
    }
    
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Remove user from presence
    const manuscriptPresence = presenceStore.get(manuscriptId);
    if (manuscriptPresence) {
      manuscriptPresence.delete(userId);
      
      // Clean up empty manuscript entries
      if (manuscriptPresence.size === 0) {
        presenceStore.delete(manuscriptId);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Presence removed'
    });
    
  } catch (error) {
    console.error('Error removing presence:', error);
    return NextResponse.json(
      { error: 'Failed to remove presence' },
      { status: 500 }
    );
  }
}

