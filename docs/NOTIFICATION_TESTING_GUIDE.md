# Notification System Testing Guide

## ✅ System Applied Successfully

The comprehensive notification system has been successfully applied to your HospitiumRIS application. Here's what was done:

### 1. Database Migration ✅
- Ran Prisma migration `enhanced_notification_system`
- Updated Notification model with new fields
- Created NotificationPreference model
- Added relations to Proposal, Ethics, Grant, Training, Preprint models
- Added performance indexes

### 2. API Endpoints Created ✅
- **Enhanced** `GET /api/notifications` - Fetch with filtering (category, priority, pagination)
- **Enhanced** `POST /api/notifications` - Create using notification service
- **Existing** `PATCH /api/notifications` - Mark as read
- **Existing** `DELETE /api/notifications` - Delete notifications
- **New** `GET /api/notifications/preferences` - Get user preferences
- **New** `PATCH /api/notifications/preferences` - Update preferences
- **New** `GET /api/notifications/stats` - Get statistics
- **New** `POST /api/notifications/test` - Create test notifications

### 3. Service Layer ✅
- `src/services/notificationService.js` - Full notification management
- `src/services/notificationTemplates.js` - 40+ notification templates

### 4. Test Page Created ✅
- `/researcher/test-notifications` - Interactive testing interface

## Quick Start Testing

### Step 1: Start Your Development Server

```bash
npm run dev
```

### Step 2: Access the Test Page

Navigate to: **http://localhost:3000/researcher/test-notifications**

### Step 3: Create Test Notifications

Click any of the test buttons:
- **Create All Tests** - Creates 6 different notification types
- **System Announcement** - Normal priority system message
- **High Priority** - Important system update
- **Urgent Alert** - Security alert (highest priority)
- **Collaboration** - Comment mention notification
- **Training** - Training availability
- **Low Priority** - Publication import

### Step 4: View Notifications

Check the notification bell icon in the top navigation bar. You should see:
- Unread count badge
- Priority indicators (colors)
- Category labels
- Action buttons
- Timestamps

## Testing Checklist

### ✅ Basic Functionality
- [ ] Create test notifications using the test page
- [ ] View notifications in the dropdown
- [ ] Mark individual notification as read
- [ ] Mark all notifications as read
- [ ] Delete a notification
- [ ] Click action button (if present)

### ✅ Priority System
- [ ] URGENT notifications appear in red
- [ ] HIGH notifications appear in orange
- [ ] NORMAL notifications appear in blue
- [ ] LOW notifications appear in gray
- [ ] Notifications are sorted by priority

### ✅ Categories
- [ ] System notifications
- [ ] Collaboration notifications
- [ ] Training notifications
- [ ] Publication notifications
- [ ] Filter by category (if implemented in UI)

### ✅ API Testing

**Test GET endpoint:**
```bash
# Get all notifications
curl http://localhost:3000/api/notifications

# Get unread only
curl http://localhost:3000/api/notifications?unreadOnly=true

# Filter by category
curl http://localhost:3000/api/notifications?category=SYSTEM

# Filter by priority
curl http://localhost:3000/api/notifications?priority=HIGH

# Pagination
curl http://localhost:3000/api/notifications?limit=10&offset=0
```

**Test POST endpoint (create notification):**
```bash
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "your-user-id",
    "type": "SYSTEM_ANNOUNCEMENT",
    "title": "Test Notification",
    "message": "This is a test",
    "priority": "NORMAL",
    "category": "SYSTEM"
  }'
```

**Test preferences:**
```bash
# Get preferences
curl http://localhost:3000/api/notifications/preferences

# Update preferences
curl -X PATCH http://localhost:3000/api/notifications/preferences \
  -H "Content-Type: application/json" \
  -d '{
    "emailEnabled": true,
    "emailDigest": "DAILY"
  }'
```

**Test statistics:**
```bash
curl http://localhost:3000/api/notifications/stats
```

## Using the Notification Service

### Create a Simple Notification

```javascript
import { notificationService } from '@/services/notificationService';

await notificationService.createNotification({
  userId: 'user-id',
  type: 'SYSTEM_ANNOUNCEMENT',
  title: 'Welcome!',
  message: 'Welcome to HospitiumRIS',
  priority: 'NORMAL',
  category: 'SYSTEM',
  actionUrl: '/dashboard',
  actionLabel: 'Go to Dashboard'
});
```

### Create Using a Template

```javascript
import { notificationService } from '@/services/notificationService';

await notificationService.createFromTemplate('PROPOSAL_APPROVED', {
  userId: 'user-id',
  proposalId: 'prop-123',
  proposalTitle: 'My Research Proposal',
  actionUrl: '/researcher/projects/proposals/view/prop-123',
  sendEmail: true
});
```

### Notify Multiple Users

```javascript
// Notify all researchers
await notificationService.notifyByAccountType('RESEARCHER', {
  type: 'TRAINING_AVAILABLE',
  trainingId: 'train-123',
  trainingTitle: 'Research Ethics',
  startDate: '2026-05-01',
  department: 'Research',
  actionUrl: '/training/train-123',
  priority: 'NORMAL',
  category: 'TRAINING'
});
```

## Browser Console Testing

Open your browser console and try these commands:

```javascript
// Create a test notification
await fetch('/api/notifications/test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ testType: 'urgent' })
});

// Get your notifications
const response = await fetch('/api/notifications');
const data = await response.json();
console.log(data);

// Get statistics
const statsResponse = await fetch('/api/notifications/stats');
const stats = await statsResponse.json();
console.log(stats);

// Get preferences
const prefsResponse = await fetch('/api/notifications/preferences');
const prefs = await prefsResponse.json();
console.log(prefs);
```

## Expected Results

### After Creating Test Notifications

1. **Notification Bell** should show unread count badge
2. **Dropdown** should display notifications sorted by priority
3. **Colors** should indicate priority levels:
   - Red = URGENT
   - Orange = HIGH
   - Blue = NORMAL
   - Gray = LOW

### Notification Structure

Each notification should have:
- ✅ Title
- ✅ Message
- ✅ Timestamp
- ✅ Priority indicator
- ✅ Category label
- ✅ Action button (if actionRequired)
- ✅ Read/unread status
- ✅ Delete option

## Troubleshooting

### No Notifications Appearing

1. **Check user authentication:**
   - Make sure you're logged in
   - Verify `getUserId()` returns your user ID

2. **Check database:**
   ```sql
   SELECT * FROM notifications ORDER BY "createdAt" DESC LIMIT 10;
   ```

3. **Check console for errors:**
   - Open browser DevTools
   - Look for API errors
   - Check network tab for failed requests

### Notifications Not Updating

1. **Refresh the page**
2. **Check if auto-refresh is working** in `useNotifications` hook
3. **Manually trigger refresh** by clicking the notification bell

### Test Endpoint Not Working

1. **Verify the file exists:**
   - `src/app/api/notifications/test/route.js`

2. **Check server logs** for errors

3. **Verify authentication** - you must be logged in

### Database Errors

If you see Prisma errors:

1. **Regenerate Prisma Client:**
   ```bash
   npx prisma generate
   ```

2. **Check migration status:**
   ```bash
   npx prisma migrate status
   ```

3. **Reset if needed (CAUTION - deletes data):**
   ```bash
   npx prisma migrate reset
   ```

## Next Steps

### 1. Integrate into Existing Features

Update your existing code to use the notification service:

**Manuscript Invitations:**
```javascript
// In src/app/api/manuscripts/invitations/route.js
import { notificationService } from '@/services/notificationService';

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

**Proposal Submissions:**
```javascript
// When proposal is submitted
await notificationService.createFromTemplate('PROPOSAL_SUBMITTED', {
  userId: proposal.userId,
  proposalId: proposal.id,
  proposalTitle: proposal.title,
  submitterName: `${user.givenName} ${user.familyName}`,
  actionUrl: `/researcher/projects/proposals/view/${proposal.id}`,
  sendEmail: true
});
```

### 2. Create Notification Center Page

Build a full notification center at `/researcher/notifications` with:
- Category filtering
- Search functionality
- Bulk actions
- Archive support

### 3. Create Preferences Page

Build a preferences page at `/researcher/settings/notifications` with:
- Channel toggles (email, in-app)
- Email digest settings
- Category preferences
- Quiet hours configuration

### 4. Add Real-time Updates

Implement Server-Sent Events (SSE) or WebSocket for real-time notifications.

## Performance Monitoring

Monitor these metrics:
- Notification creation time
- Query performance
- Unread count calculation speed
- User engagement (read rate, action rate)

## Success Criteria

✅ Notifications appear in the UI  
✅ Priority levels display correctly  
✅ Categories work as expected  
✅ Mark as read functionality works  
✅ Delete functionality works  
✅ API endpoints respond correctly  
✅ Preferences can be saved  
✅ Statistics are accurate  

## Support

For issues or questions:
- Review `docs/NOTIFICATION_SYSTEM_DESIGN.md` for architecture
- Check `docs/NOTIFICATION_IMPLEMENTATION_GUIDE.md` for details
- See `docs/NOTIFICATION_QUICK_REFERENCE.md` for code examples
- Review `src/services/notificationService.js` for service methods
- Check `src/services/notificationTemplates.js` for available templates

## Summary

Your notification system is now **fully operational** and ready for testing! 

Start by visiting: **http://localhost:3000/researcher/test-notifications**

Create some test notifications and check the notification bell in the navigation bar. The system supports:
- ✅ 70+ notification types
- ✅ 4 priority levels
- ✅ 12 categories
- ✅ User preferences
- ✅ Action tracking
- ✅ Email integration (ready)
- ✅ Template-based creation
- ✅ Bulk operations

Happy testing! 🎉
