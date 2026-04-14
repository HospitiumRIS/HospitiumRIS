# Notification System Quick Reference

## Quick Start

### Creating a Notification

```javascript
import { notificationService } from '@/services/notificationService';

// Using a template (recommended)
await notificationService.createFromTemplate('PROPOSAL_APPROVED', {
  userId: 'user-123',
  proposalId: 'prop-456',
  proposalTitle: 'My Research Proposal',
  actionUrl: '/researcher/projects/proposals/view/prop-456',
  sendEmail: true
});

// Manual creation
await notificationService.createNotification({
  userId: 'user-123',
  type: 'SYSTEM_ANNOUNCEMENT',
  title: 'New Feature Available',
  message: 'Check out our new collaboration tools!',
  priority: 'NORMAL',
  category: 'SYSTEM',
  actionUrl: '/features',
  actionLabel: 'Learn More',
  sendEmail: false
});
```

### Notifying Multiple Users

```javascript
// By account type
await notificationService.notifyByAccountType('RESEARCHER', {
  type: 'TRAINING_AVAILABLE',
  trainingId: 'train-789',
  trainingTitle: 'Research Ethics Workshop',
  startDate: '2026-05-01',
  department: 'Research',
  actionUrl: '/training/train-789',
  priority: 'NORMAL',
  category: 'TRAINING'
});

// All manuscript collaborators
await notificationService.notifyCollaborators(
  'manuscript-123',
  {
    type: 'MANUSCRIPT_STATUS_CHANGED',
    manuscriptTitle: 'Cancer Research Paper',
    oldStatus: 'DRAFT',
    newStatus: 'IN_REVIEW',
    changedBy: 'Dr. Smith',
    actionUrl: '/manuscripts/manuscript-123',
    priority: 'HIGH',
    category: 'COLLABORATION'
  },
  'user-who-made-change' // Exclude this user
);
```

## Available Templates

### Collaboration
- `COLLABORATION_INVITATION` - Invite to collaborate
- `COLLABORATION_ACCEPTED` - Invitation accepted
- `COLLABORATION_DECLINED` - Invitation declined
- `COLLABORATOR_ROLE_CHANGED` - Role updated
- `COLLABORATOR_REMOVED` - Removed from collaboration
- `MANUSCRIPT_VERSION_CREATED` - New version saved
- `MANUSCRIPT_STATUS_CHANGED` - Status updated
- `COMMENT_ADDED` - New comment
- `COMMENT_REPLY` - Reply to comment
- `COMMENT_MENTION` - Mentioned in comment
- `TRACKED_CHANGE_ADDED` - New tracked change
- `TRACKED_CHANGE_ACCEPTED` - Change accepted
- `TRACKED_CHANGE_REJECTED` - Change rejected

### Proposals
- `PROPOSAL_SUBMITTED` - Proposal submitted
- `PROPOSAL_REVIEW_ASSIGNED` - Assigned to review
- `PROPOSAL_REVIEWED` - Review completed
- `PROPOSAL_APPROVED` - Proposal approved
- `PROPOSAL_REJECTED` - Proposal rejected
- `PROPOSAL_REVISION_REQUESTED` - Revision needed
- `PROPOSAL_DEADLINE_APPROACHING` - Deadline reminder

### Ethics
- `ETHICS_SUBMITTED` - Application submitted
- `ETHICS_REVIEW_ASSIGNED` - Assigned to review
- `ETHICS_APPROVED` - Application approved
- `ETHICS_CONDITIONAL_APPROVAL` - Conditional approval
- `ETHICS_REJECTED` - Application rejected
- `ETHICS_EXPIRING_SOON` - Approval expiring

### Grants
- `GRANT_AWARDED` - Grant awarded
- `GRANT_REJECTED` - Grant rejected
- `GRANT_DEADLINE_APPROACHING` - Deadline reminder
- `GRANT_MILESTONE_DUE` - Milestone due
- `GRANT_REPORT_DUE` - Report due
- `GRANT_COMMUNICATION_RECEIVED` - New communication

### Training
- `TRAINING_AVAILABLE` - New training available
- `TRAINING_REGISTERED` - Registration confirmed
- `TRAINING_STARTING_SOON` - Training reminder
- `TRAINING_CERTIFICATE_ISSUED` - Certificate ready
- `TRAINING_NEW_REGISTRATION` - New participant (for admins)

### Publications & Preprints
- `PUBLICATION_IMPORTED` - Publications imported
- `COAUTHOR_PUBLICATION_DETECTED` - Co-author publication found
- `PREPRINT_ACCEPTED` - Preprint accepted
- `PREPRINT_PUBLISHED` - Preprint published
- `PREPRINT_REJECTED` - Preprint rejected

### Account & System
- `ACCOUNT_ACTIVATED` - Account activated
- `ACCOUNT_TYPE_CHANGED` - Account type changed
- `NEW_USER_REGISTRATION` - New user (for admins)
- `SYSTEM_MAINTENANCE` - Maintenance scheduled
- `SYSTEM_ANNOUNCEMENT` - System announcement
- `SECURITY_ALERT` - Security alert

### Campaigns & Internal Grants
- `DONATION_RECEIVED` - New donation
- `CAMPAIGN_MILESTONE_REACHED` - Campaign milestone
- `INTERNAL_GRANT_APPROVED` - Internal grant approved
- `INTERNAL_GRANT_REVIEW_ASSIGNED` - Review assignment

## Priority Levels

- `URGENT` - Critical, requires immediate attention (red)
- `HIGH` - Important, should be addressed soon (orange)
- `NORMAL` - Standard notification (blue)
- `LOW` - Informational only (gray)

## Categories

- `GENERAL` - General notifications
- `COLLABORATION` - Manuscript collaboration
- `PROPOSAL` - Research proposals
- `ETHICS` - Ethics applications
- `GRANT` - Grant applications
- `TRAINING` - Training programs
- `PUBLICATION` - Publications
- `PREPRINT` - Preprint submissions
- `CAMPAIGN` - Fundraising campaigns
- `INTERNAL_GRANT` - Internal grants
- `SYSTEM` - System notifications
- `ACCOUNT` - Account management

## Common Patterns

### Proposal Workflow

```javascript
// 1. Proposal submitted
await notificationService.createFromTemplate('PROPOSAL_SUBMITTED', {
  userId: applicantId,
  proposalId,
  proposalTitle,
  submitterName,
  actionUrl: `/researcher/projects/proposals/view/${proposalId}`
});

// 2. Notify reviewers
await notificationService.notifyByAccountType('RESEARCH_ADMIN', {
  type: 'PROPOSAL_REVIEW_ASSIGNED',
  proposalId,
  proposalTitle,
  submitterName,
  actionUrl: `/institution/proposals/review/${proposalId}`,
  actionRequired: true,
  priority: 'HIGH',
  category: 'PROPOSAL'
});

// 3. Review completed - notify applicant
await notificationService.createFromTemplate('PROPOSAL_REVIEWED', {
  userId: applicantId,
  proposalId,
  proposalTitle,
  reviewerName,
  decision: 'APPROVED',
  actionUrl: `/researcher/projects/proposals/view/${proposalId}`
});

// 4. Final decision
await notificationService.createFromTemplate('PROPOSAL_APPROVED', {
  userId: applicantId,
  proposalId,
  proposalTitle,
  actionUrl: `/researcher/projects/proposals/view/${proposalId}`,
  sendEmail: true
});
```

### Training Registration

```javascript
// 1. New training created - notify target groups
await notificationService.notifyTargetGroups(training.targetGroup, {
  type: 'TRAINING_AVAILABLE',
  trainingId: training.id,
  trainingTitle: training.title,
  startDate: formatDate(training.startDate),
  department: training.department,
  actionUrl: `/training/${training.id}`,
  priority: 'NORMAL',
  category: 'TRAINING'
});

// 2. User registers - confirm
await notificationService.createFromTemplate('TRAINING_REGISTERED', {
  userId: participant.id,
  trainingId: training.id,
  trainingTitle: training.title,
  startDate: formatDate(training.startDate),
  actionUrl: `/training/${training.id}`
});

// 3. Notify admin of new registration
await notificationService.createFromTemplate('TRAINING_NEW_REGISTRATION', {
  userId: training.createdBy,
  trainingId: training.id,
  trainingTitle: training.title,
  participantName: `${participant.givenName} ${participant.familyName}`,
  currentCount: registrationCount,
  maxParticipants: training.maxParticipants,
  actionUrl: `/institution/training/${training.id}/registrations`
});

// 4. Send reminder before training starts
await notificationService.createFromTemplate('TRAINING_STARTING_SOON', {
  userId: participant.id,
  trainingId: training.id,
  trainingTitle: training.title,
  startTime: 'in 1 hour',
  location: training.location,
  actionUrl: `/training/${training.id}`,
  priority: 'HIGH'
});
```

### Manuscript Collaboration

```javascript
// 1. Invite collaborator
await notificationService.createFromTemplate('COLLABORATION_INVITATION', {
  userId: invitedUserId,
  manuscriptId,
  inviterName: `${inviter.givenName} ${inviter.familyName}`,
  manuscriptTitle: manuscript.title,
  role: 'EDITOR',
  actionUrl: `/manuscripts/${manuscriptId}`,
  sendEmail: true
});

// 2. Invitation accepted - notify inviter
await notificationService.createFromTemplate('COLLABORATION_ACCEPTED', {
  userId: inviterId,
  manuscriptId,
  collaboratorName: `${collaborator.givenName} ${collaborator.familyName}`,
  manuscriptTitle: manuscript.title,
  actionUrl: `/manuscripts/${manuscriptId}`
});

// 3. New comment - notify all collaborators
await notificationService.notifyCollaborators(manuscriptId, {
  type: 'COMMENT_ADDED',
  manuscriptTitle: manuscript.title,
  commenterName: `${commenter.givenName} ${commenter.familyName}`,
  commentPreview: comment.content.substring(0, 100),
  actionUrl: `/manuscripts/${manuscriptId}#comment-${comment.id}`,
  priority: 'NORMAL',
  category: 'COLLABORATION'
}, commenterId);

// 4. Status changed - notify all
await notificationService.notifyCollaborators(manuscriptId, {
  type: 'MANUSCRIPT_STATUS_CHANGED',
  manuscriptTitle: manuscript.title,
  oldStatus: 'DRAFT',
  newStatus: 'IN_REVIEW',
  changedBy: `${user.givenName} ${user.familyName}`,
  actionUrl: `/manuscripts/${manuscriptId}`,
  priority: 'HIGH',
  category: 'COLLABORATION'
}, userId);
```

## User Preferences

Users can control:
- Email notifications on/off
- In-app notifications on/off
- Email digest frequency (immediate, hourly, daily, weekly, never)
- Category-specific preferences
- Quiet hours (e.g., 10 PM - 8 AM)
- Do not disturb mode

## API Endpoints

- `GET /api/notifications` - Fetch notifications
  - Query params: `unreadOnly`, `category`, `priority`, `limit`, `offset`
- `POST /api/notifications` - Create notification
- `PATCH /api/notifications` - Mark as read
- `DELETE /api/notifications?id=xxx` - Delete notification
- `GET /api/notifications/preferences` - Get user preferences
- `PATCH /api/notifications/preferences` - Update preferences
- `GET /api/notifications/stats` - Get statistics

## Frontend Hook

```javascript
import { useNotifications } from '@/hooks/useNotifications';

function MyComponent() {
  const { 
    notifications, 
    unreadCount, 
    isLoading,
    markAsRead,
    deleteNotification,
    refresh 
  } = useNotifications({ 
    unreadOnly: true,
    category: 'COLLABORATION'
  });
  
  // Use notifications...
}
```

## Best Practices

1. **Always use templates** when available for consistency
2. **Set appropriate priority** - don't overuse URGENT
3. **Include actionUrl** for actionable notifications
4. **Set actionRequired** for items needing user response
5. **Use sendEmail** sparingly - respect user preferences
6. **Exclude the actor** when notifying groups (they know what they did)
7. **Set expiresAt** for time-sensitive notifications
8. **Use meaningful titles** - be specific and clear
9. **Keep messages concise** - under 200 characters when possible
10. **Test notifications** before deploying to production

## Troubleshooting

**Notifications not appearing?**
- Check user preferences (may have category disabled)
- Verify user ID is correct
- Check if in quiet hours or DND mode
- Look for errors in server logs

**Email not sending?**
- Check user has emailEnabled: true
- Verify email digest setting
- Ensure sendEmail: true in notification creation
- Check email service configuration

**Performance issues?**
- Use bulk operations for multiple notifications
- Implement caching for unread counts
- Add database indexes (already in schema)
- Use pagination for large result sets

## Support

- Design Doc: `docs/NOTIFICATION_SYSTEM_DESIGN.md`
- Implementation Guide: `docs/NOTIFICATION_IMPLEMENTATION_GUIDE.md`
- Service Code: `src/services/notificationService.js`
- Templates: `src/services/notificationTemplates.js`
- Schema: `prisma/schema.prisma`
