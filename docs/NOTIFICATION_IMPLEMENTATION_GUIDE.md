# Notification System Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the comprehensive notification system in HospitiumRIS.

## What Has Been Created

### 1. Database Schema Updates (`prisma/schema.prisma`)

**Enhanced Notification Model:**
- ✅ Added multiple entity relations (proposal, ethics, grant, training, preprint)
- ✅ Added priority and category fields
- ✅ Added action tracking (actionRequired, actionUrl, actionLabel, actionTaken)
- ✅ Added archiving support (isArchived, archivedAt)
- ✅ Added email delivery tracking (sentViaEmail, emailSentAt)
- ✅ Added expiry support (expiresAt)
- ✅ Added database indexes for performance

**New Enums:**
- ✅ `NotificationType` - Expanded to 70+ notification types
- ✅ `NotificationPriority` - LOW, NORMAL, HIGH, URGENT
- ✅ `NotificationCategory` - 12 categories for organization
- ✅ `EmailDigestFrequency` - IMMEDIATE, HOURLY, DAILY, WEEKLY, NEVER

**New NotificationPreference Model:**
- ✅ Channel preferences (email, in-app, push)
- ✅ Email digest settings
- ✅ Category-specific preferences
- ✅ Quiet hours configuration
- ✅ Do not disturb mode

### 2. Service Layer

**`src/services/notificationService.js`:**
- ✅ Centralized notification creation
- ✅ Bulk notification support
- ✅ Template-based notifications
- ✅ User preference checking
- ✅ Email delivery integration
- ✅ Notification management (read, archive, delete)
- ✅ Statistics and analytics
- ✅ Auto-cleanup and archiving

**`src/services/notificationTemplates.js`:**
- ✅ 40+ pre-defined notification templates
- ✅ Dynamic content generation
- ✅ Consistent messaging across all notification types
- ✅ Category and priority assignment

### 3. Documentation

**`docs/NOTIFICATION_SYSTEM_DESIGN.md`:**
- ✅ Complete system architecture
- ✅ All notification events mapped
- ✅ User experience design
- ✅ Implementation phases
- ✅ Performance considerations

## Implementation Steps

### Step 1: Database Migration

Run the Prisma migration to update the database schema:

```bash
# Generate migration
npx prisma migrate dev --name enhanced_notification_system

# Apply migration
npx prisma generate
```

**Expected Changes:**
- Notification table will be updated with new fields
- NotificationPreference table will be created
- New enums will be added
- Indexes will be created

### Step 2: Update Existing Notification API

**File:** `src/app/api/notifications/route.js`

**Changes Needed:**

1. **Import the notification service:**
```javascript
import { notificationService } from '../../../services/notificationService.js';
```

2. **Enhance GET endpoint to support filtering:**
```javascript
export async function GET(request) {
  const userId = await getUserId();
  const { searchParams } = new URL(request.url);
  
  const unreadOnly = searchParams.get('unreadOnly') === 'true';
  const category = searchParams.get('category');
  const priority = searchParams.get('priority');
  const limit = parseInt(searchParams.get('limit')) || 20;
  const offset = parseInt(searchParams.get('offset')) || 0;
  
  const whereClause = {
    userId,
    isArchived: false,
    ...(unreadOnly && { isRead: false }),
    ...(category && { category }),
    ...(priority && { priority })
  };
  
  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: whereClause,
      include: {
        manuscript: { select: { id: true, title: true, type: true } },
        proposal: { select: { id: true, title: true } },
        training: { select: { id: true, title: true } },
        ethicsApplication: { select: { id: true, title: true } },
        grantApplication: { select: { id: true, applicationTitle: true } },
        preprint: { select: { id: true, title: true } }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset
    }),
    prisma.notification.count({ where: whereClause }),
    prisma.notification.count({ where: { userId, isRead: false, isArchived: false } })
  ]);
  
  return NextResponse.json({
    success: true,
    data: {
      notifications,
      total,
      unreadCount,
      hasMore: offset + notifications.length < total
    }
  });
}
```

3. **Update POST endpoint to use service:**
```javascript
export async function POST(request) {
  const body = await request.json();
  const notification = await notificationService.createNotification(body);
  
  return NextResponse.json({
    success: true,
    notification
  });
}
```

### Step 3: Create Notification Preferences API

**File:** `src/app/api/notifications/preferences/route.js`

```javascript
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserId } from '../../../../lib/auth-server.js';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId }
    });

    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: { userId }
      });
    }

    return NextResponse.json({ success: true, preferences });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const preferences = await prisma.notificationPreference.upsert({
      where: { userId },
      update: body,
      create: { userId, ...body }
    });

    return NextResponse.json({ success: true, preferences });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Step 4: Create Notification Statistics API

**File:** `src/app/api/notifications/stats/route.js`

```javascript
import { NextResponse } from 'next/server';
import { getUserId } from '../../../../lib/auth-server.js';
import { notificationService } from '../../../../services/notificationService.js';

export async function GET(request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await notificationService.getStatistics(userId);
    
    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Step 5: Integrate Notifications into Existing Features

#### Manuscript Collaboration

**File:** `src/app/api/manuscripts/invitations/route.js`

Replace existing notification code with:

```javascript
import { notificationService } from '../../../../services/notificationService.js';

// After creating invitation
await notificationService.createFromTemplate('COLLABORATION_INVITATION', {
  userId: invitedUserId,
  manuscriptId,
  inviterName: `${inviter.givenName} ${inviter.familyName}`,
  manuscriptTitle: manuscript.title,
  role: role,
  actionUrl: `/researcher/publications/collaborate/edit/${manuscriptId}`,
  sendEmail: true
});
```

#### Proposal Submission

**File:** `src/app/api/proposals/route.js` (or wherever proposals are created)

```javascript
import { notificationService } from '../../../services/notificationService.js';

// When proposal is submitted
await notificationService.createFromTemplate('PROPOSAL_SUBMITTED', {
  userId: proposal.userId,
  proposalId: proposal.id,
  proposalTitle: proposal.title,
  submitterName: `${user.givenName} ${user.familyName}`,
  actionUrl: `/researcher/projects/proposals/view/${proposal.id}`,
  sendEmail: true
});

// Notify admins
await notificationService.notifyByAccountType('RESEARCH_ADMIN', {
  type: 'PROPOSAL_REVIEW_ASSIGNED',
  proposalId: proposal.id,
  proposalTitle: proposal.title,
  submitterName: `${user.givenName} ${user.familyName}`,
  actionUrl: `/institution/proposals/review/${proposal.id}`,
  actionRequired: true,
  priority: 'HIGH',
  category: 'PROPOSAL',
  sendEmail: true
});
```

#### Training Creation

**File:** `src/app/api/institution/training/route.js`

Replace existing notification logic:

```javascript
import { notificationService } from '../../../../services/notificationService.js';

// After creating training
await notificationService.notifyTargetGroups(training.targetGroup, {
  type: 'TRAINING_AVAILABLE',
  trainingId: training.id,
  trainingTitle: training.title,
  startDate: training.startDate.toLocaleDateString(),
  department: training.department,
  actionUrl: `/researcher/training/${training.id}`,
  priority: 'NORMAL',
  category: 'TRAINING',
  sendEmail: true
});
```

### Step 6: Update Frontend Components

#### Update useNotifications Hook

**File:** `src/hooks/useNotifications.js`

Add support for categories and filtering:

```javascript
export function useNotifications(options = {}) {
  const { 
    unreadOnly = true, 
    category = null,
    priority = null 
  } = options;
  
  const fetchNotifications = useCallback(async (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.unreadOnly ?? unreadOnly) searchParams.append('unreadOnly', 'true');
    if (params.category ?? category) searchParams.append('category', params.category ?? category);
    if (params.priority ?? priority) searchParams.append('priority', params.priority ?? priority);
    searchParams.append('limit', params.limit || 20);
    searchParams.append('offset', params.offset || 0);
    
    const response = await fetch(`/api/notifications?${searchParams}`);
    const data = await response.json();
    
    // ... rest of implementation
  }, [unreadOnly, category, priority]);
  
  // ... rest of hook
}
```

#### Enhance NotificationDropdown

**File:** `src/components/Notifications/NotificationDropdown.jsx`

Add category filtering and priority indicators:

```javascript
// Add category filter
const [selectedCategory, setSelectedCategory] = useState('all');

// Add priority badge rendering
const getPriorityBadge = (priority) => {
  const colors = {
    URGENT: '#d32f2f',
    HIGH: '#f57c00',
    NORMAL: '#1976d2',
    LOW: '#757575'
  };
  
  if (priority === 'NORMAL') return null;
  
  return (
    <Chip
      label={priority}
      size="small"
      sx={{
        bgcolor: colors[priority],
        color: 'white',
        fontSize: '0.65rem',
        height: 18
      }}
    />
  );
};
```

### Step 7: Create Notification Center Page

**File:** `src/app/researcher/notifications/page.js`

```javascript
'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  List,
  ListItem,
  Button,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useNotifications } from '../../../hooks/useNotifications';

export default function NotificationsPage() {
  const [category, setCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { notifications, unreadCount, isLoading } = useNotifications({ 
    unreadOnly: false,
    category: category !== 'all' ? category : null 
  });
  
  // Implementation of full notification center
  // - Category tabs
  // - Search functionality
  // - Bulk actions
  // - Notification list with full details
  // - Link to preferences
  
  return (
    <Container maxWidth="lg">
      {/* Implementation */}
    </Container>
  );
}
```

### Step 8: Create Notification Preferences Page

**File:** `src/app/researcher/settings/notifications/page.js`

```javascript
'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  Divider,
  Button
} from '@mui/material';

export default function NotificationPreferencesPage() {
  const [preferences, setPreferences] = useState(null);
  
  useEffect(() => {
    fetchPreferences();
  }, []);
  
  const fetchPreferences = async () => {
    const response = await fetch('/api/notifications/preferences');
    const data = await response.json();
    setPreferences(data.preferences);
  };
  
  const savePreferences = async () => {
    await fetch('/api/notifications/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences)
    });
  };
  
  // Implementation of preferences UI
  // - Channel toggles (email, in-app, push)
  // - Email digest frequency
  // - Category-specific preferences
  // - Quiet hours configuration
  // - Do not disturb toggle
  
  return (
    <Container maxWidth="md">
      {/* Implementation */}
    </Container>
  );
}
```

## Testing the System

### 1. Test Notification Creation

```javascript
// In browser console or API test
const response = await fetch('/api/notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'your-user-id',
    type: 'SYSTEM_ANNOUNCEMENT',
    title: 'Test Notification',
    message: 'This is a test notification',
    priority: 'HIGH',
    category: 'SYSTEM'
  })
});
```

### 2. Test Template-Based Notifications

```javascript
import { notificationService } from './src/services/notificationService.js';

await notificationService.createFromTemplate('PROPOSAL_APPROVED', {
  userId: 'user-id',
  proposalId: 'proposal-id',
  proposalTitle: 'My Research Proposal',
  actionUrl: '/researcher/projects/proposals/view/proposal-id'
});
```

### 3. Test Bulk Notifications

```javascript
await notificationService.notifyByAccountType('RESEARCHER', {
  type: 'SYSTEM_ANNOUNCEMENT',
  title: 'System Update',
  message: 'New features available!',
  priority: 'NORMAL',
  category: 'SYSTEM'
});
```

## Maintenance Tasks

### Scheduled Jobs

Create cron jobs or scheduled tasks for:

1. **Auto-archive old notifications** (daily)
```javascript
// scripts/cleanup-notifications.js
import { notificationService } from '../src/services/notificationService.js';

async function cleanup() {
  await notificationService.autoArchiveOld();
  await notificationService.cleanupExpired();
}

cleanup();
```

2. **Send email digests** (hourly/daily/weekly)
```javascript
// scripts/send-email-digests.js
// Implementation for sending digest emails based on user preferences
```

## Performance Optimization

1. **Database Indexes** - Already added in schema
2. **Caching** - Implement Redis caching for unread counts
3. **Pagination** - Use cursor-based pagination for large datasets
4. **Background Jobs** - Use a queue system (Bull, BullMQ) for bulk notifications

## Monitoring

Track these metrics:
- Notification delivery rate
- Read rate by type/category
- Email open rate
- Action completion rate
- System performance (creation time, query time)

## Next Steps

1. ✅ Run database migration
2. ⏳ Update notification API routes
3. ⏳ Create preferences API
4. ⏳ Integrate into existing features
5. ⏳ Update frontend components
6. ⏳ Create notification center page
7. ⏳ Create preferences page
8. ⏳ Set up scheduled jobs
9. ⏳ Test thoroughly
10. ⏳ Deploy to production

## Support

For questions or issues:
- Review `docs/NOTIFICATION_SYSTEM_DESIGN.md` for architecture details
- Check `src/services/notificationTemplates.js` for available templates
- Refer to Prisma schema for data model details
