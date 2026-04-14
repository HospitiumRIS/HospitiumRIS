# Comprehensive Notification System Design for HospitiumRIS

## Executive Summary

This document outlines a comprehensive notification system for HospitiumRIS that covers all user types and key system events. The system builds upon the existing notification infrastructure and extends it to provide complete coverage across all modules.

## Current State Analysis

### Existing Infrastructure

**Database Schema:**
- `Notification` model exists with basic fields:
  - `id`, `userId`, `manuscriptId`, `type`, `title`, `message`, `data`, `isRead`, `readAt`, `createdAt`, `updatedAt`
  - `NotificationType` enum: `COLLABORATION_INVITATION`, `MANUSCRIPT_UPDATE`, `COMMENT_MENTION`, `SYSTEM_NOTIFICATION`

**Current Implementation:**
- ✅ Notification API (`/api/notifications`) - GET, POST, PATCH, DELETE
- ✅ `useNotifications` hook with auto-refresh (30s)
- ✅ NotificationDropdown component with UI
- ✅ Basic notifications for:
  - Manuscript collaboration invitations
  - Manuscript collaborator updates
  - Training creation (for specific target groups)

### User Types in System

1. **RESEARCHER** - Individual researchers
2. **RESEARCH_ADMIN** - Institutional research administrators
3. **FOUNDATION_ADMIN** - Foundation administrators
4. **OPERATIONS** - Operations staff
5. **SUPER_ADMIN** - System administrators
6. **Custom Account Types** - Dynamically created via AccountType model

## Comprehensive Notification Events

### 1. Manuscript & Collaboration Events

#### For All Collaborators
- ✅ **Collaboration invitation received** (existing)
- ✅ **Invitation accepted/declined** (existing)
- ✅ **Collaborator role changed** (existing)
- ✅ **Collaborator removed** (existing)
- 🔴 **New manuscript version created**
- 🔴 **Manuscript status changed** (DRAFT → IN_REVIEW → PUBLISHED)
- 🔴 **New comment added**
- 🔴 **Comment reply received**
- 🔴 **Mentioned in comment** (partial - exists as type)
- 🔴 **Tracked change added**
- 🔴 **Tracked change accepted/rejected**
- 🔴 **Manuscript citation added**
- 🔴 **Manuscript deadline approaching**

### 2. Proposal Management Events

#### For Proposal Creators & Collaborators
- 🔴 **Proposal submitted for review**
- 🔴 **Proposal review assigned**
- 🔴 **Proposal review completed**
- 🔴 **Proposal status changed** (DRAFT → SUBMITTED → APPROVED/REJECTED)
- 🔴 **Proposal revision requested**
- 🔴 **Proposal approved**
- 🔴 **Proposal rejected**
- 🔴 **Proposal deadline approaching**

#### For Reviewers (RESEARCH_ADMIN)
- 🔴 **New proposal submitted for review**
- 🔴 **Proposal review reminder**

### 3. Ethics Application Events

#### For Applicants
- 🔴 **Ethics application submitted**
- 🔴 **Ethics review assigned**
- 🔴 **Ethics review completed**
- 🔴 **Ethics approval granted**
- 🔴 **Ethics conditional approval** (with conditions)
- 🔴 **Ethics application rejected**
- 🔴 **Ethics revision requested**
- 🔴 **Ethics approval expiring soon**
- 🔴 **Ethics amendment submitted**
- 🔴 **Ethics amendment approved/rejected**

#### For Ethics Committee Members
- 🔴 **New ethics application for review**
- 🔴 **Ethics review deadline approaching**

### 4. Grant Management Events

#### For Grant Applicants
- 🔴 **Grant application status changed**
- 🔴 **Grant submission deadline approaching**
- 🔴 **Grant awarded**
- 🔴 **Grant rejected**
- 🔴 **Grant additional information requested**
- 🔴 **Grant milestone due soon**
- 🔴 **Grant report due soon**
- 🔴 **Grant communication received**
- 🔴 **Grant follow-up required**

#### For Foundation Admins
- 🔴 **New grant application received**
- 🔴 **Grant opportunity deadline approaching**
- 🔴 **Grant report submitted**

### 5. Training Events

#### For Participants
- ✅ **New training available** (existing - partial)
- 🔴 **Training registration confirmed**
- 🔴 **Training starting soon** (24h, 1h reminders)
- 🔴 **Training module completed**
- 🔴 **Training certificate issued**
- 🔴 **Training cancelled**
- 🔴 **Training materials updated**

#### For Training Creators (RESEARCH_ADMIN)
- 🔴 **New training registration**
- 🔴 **Training capacity reached**
- 🔴 **Training completion rate milestone**

### 6. Publication Events

#### For Researchers
- 🔴 **Publication imported successfully**
- 🔴 **Publication import failed**
- 🔴 **Co-author publication detected** (from ORCID sync)
- 🔴 **Publication added to library folder**
- 🔴 **Publication citation count updated**

### 7. Preprint Submission Events

#### For Submitters
- 🔴 **Preprint submission received**
- 🔴 **Preprint under review**
- 🔴 **Preprint accepted**
- 🔴 **Preprint published** (with DOI)
- 🔴 **Preprint rejected**
- 🔴 **Preprint DOI assigned**

### 8. User & Account Events

#### For All Users
- 🔴 **Account activated**
- 🔴 **Account status changed**
- 🔴 **Password changed**
- 🔴 **Email verified**
- 🔴 **Profile updated**
- 🔴 **Account type changed**

#### For Admins
- 🔴 **New user registration** (RESEARCH_ADMIN, SUPER_ADMIN)
- 🔴 **User pending approval**
- 🔴 **User account suspended**

### 9. Campaign & Donation Events (Foundation)

#### For Foundation Admins
- 🔴 **New donation received**
- 🔴 **Campaign milestone reached**
- 🔴 **Campaign activity scheduled**
- 🔴 **Campaign deadline approaching**
- 🔴 **Donation refund processed**

### 10. Internal Grant Request Events

#### For Applicants
- 🔴 **Internal grant request submitted**
- 🔴 **Internal grant under review**
- 🔴 **Internal grant approved**
- 🔴 **Internal grant rejected**
- 🔴 **Internal grant revision requested**
- 🔴 **Internal grant report due**

#### For Reviewers
- 🔴 **New internal grant request for review**
- 🔴 **Internal grant review assigned**

### 11. System Events

#### For All Users
- 🔴 **System maintenance scheduled**
- 🔴 **System update available**
- 🔴 **Important announcement**
- 🔴 **Feature release**
- 🔴 **Terms of service updated**

#### For Admins
- 🔴 **System error detected**
- 🔴 **Database backup completed/failed**
- 🔴 **Security alert**
- 🔴 **High activity detected**

## Enhanced Notification Schema

### Expanded NotificationType Enum

```prisma
enum NotificationType {
  // Manuscript & Collaboration
  COLLABORATION_INVITATION
  COLLABORATION_ACCEPTED
  COLLABORATION_DECLINED
  COLLABORATOR_ROLE_CHANGED
  COLLABORATOR_REMOVED
  MANUSCRIPT_UPDATE
  MANUSCRIPT_VERSION_CREATED
  MANUSCRIPT_STATUS_CHANGED
  COMMENT_ADDED
  COMMENT_REPLY
  COMMENT_MENTION
  TRACKED_CHANGE_ADDED
  TRACKED_CHANGE_ACCEPTED
  TRACKED_CHANGE_REJECTED
  
  // Proposals
  PROPOSAL_SUBMITTED
  PROPOSAL_REVIEW_ASSIGNED
  PROPOSAL_REVIEWED
  PROPOSAL_STATUS_CHANGED
  PROPOSAL_APPROVED
  PROPOSAL_REJECTED
  PROPOSAL_REVISION_REQUESTED
  PROPOSAL_DEADLINE_APPROACHING
  
  // Ethics
  ETHICS_SUBMITTED
  ETHICS_REVIEW_ASSIGNED
  ETHICS_REVIEWED
  ETHICS_APPROVED
  ETHICS_CONDITIONAL_APPROVAL
  ETHICS_REJECTED
  ETHICS_REVISION_REQUESTED
  ETHICS_EXPIRING_SOON
  ETHICS_AMENDMENT_SUBMITTED
  
  // Grants
  GRANT_STATUS_CHANGED
  GRANT_DEADLINE_APPROACHING
  GRANT_AWARDED
  GRANT_REJECTED
  GRANT_INFO_REQUESTED
  GRANT_MILESTONE_DUE
  GRANT_REPORT_DUE
  GRANT_COMMUNICATION_RECEIVED
  
  // Training
  TRAINING_AVAILABLE
  TRAINING_REGISTERED
  TRAINING_STARTING_SOON
  TRAINING_MODULE_COMPLETED
  TRAINING_CERTIFICATE_ISSUED
  TRAINING_CANCELLED
  TRAINING_MATERIALS_UPDATED
  TRAINING_NEW_REGISTRATION
  
  // Publications
  PUBLICATION_IMPORTED
  PUBLICATION_IMPORT_FAILED
  COAUTHOR_PUBLICATION_DETECTED
  
  // Preprints
  PREPRINT_SUBMITTED
  PREPRINT_UNDER_REVIEW
  PREPRINT_ACCEPTED
  PREPRINT_PUBLISHED
  PREPRINT_REJECTED
  
  // User & Account
  ACCOUNT_ACTIVATED
  ACCOUNT_STATUS_CHANGED
  ACCOUNT_TYPE_CHANGED
  EMAIL_VERIFIED
  NEW_USER_REGISTRATION
  
  // Campaigns & Donations
  DONATION_RECEIVED
  CAMPAIGN_MILESTONE_REACHED
  CAMPAIGN_ACTIVITY_SCHEDULED
  
  // Internal Grants
  INTERNAL_GRANT_SUBMITTED
  INTERNAL_GRANT_APPROVED
  INTERNAL_GRANT_REJECTED
  INTERNAL_GRANT_REVIEW_ASSIGNED
  
  // System
  SYSTEM_NOTIFICATION
  SYSTEM_MAINTENANCE
  SYSTEM_ANNOUNCEMENT
  SECURITY_ALERT
}
```

### Enhanced Notification Model

```prisma
model Notification {
  id String @id @default(cuid())

  // Relations
  userId       String
  manuscriptId String?
  proposalId   String?
  ethicsApplicationId String?
  grantApplicationId String?
  trainingId   String?
  
  // Notification Details
  type     NotificationType
  title    String
  message  String
  data     Json? // Additional structured data
  
  // Priority & Category
  priority NotificationPriority @default(NORMAL)
  category NotificationCategory @default(GENERAL)
  
  // Status
  isRead   Boolean   @default(false)
  readAt   DateTime?
  isArchived Boolean @default(false)
  archivedAt DateTime?
  
  // Action tracking
  actionRequired Boolean @default(false)
  actionUrl      String? // Deep link to relevant page
  actionLabel    String? // Button text (e.g., "Review Proposal")
  actionTaken    Boolean @default(false)
  actionTakenAt  DateTime?
  
  // Delivery channels
  sentViaEmail Boolean @default(false)
  emailSentAt  DateTime?
  
  // Expiry (for time-sensitive notifications)
  expiresAt DateTime?
  
  // Relations
  user              User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  manuscript        Manuscript?       @relation(fields: [manuscriptId], references: [id], onDelete: Cascade)
  proposal          Proposal?         @relation(fields: [proposalId], references: [id], onDelete: Cascade)
  ethicsApplication EthicsApplication? @relation(fields: [ethicsApplicationId], references: [id], onDelete: Cascade)
  grantApplication  GrantApplication? @relation(fields: [grantApplicationId], references: [id], onDelete: Cascade)
  training          Training?         @relation(fields: [trainingId], references: [id], onDelete: Cascade)
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId, isRead])
  @@index([userId, createdAt])
  @@index([type])
  @@map("notifications")
}

enum NotificationPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

enum NotificationCategory {
  GENERAL
  COLLABORATION
  PROPOSAL
  ETHICS
  GRANT
  TRAINING
  PUBLICATION
  SYSTEM
}
```

### User Notification Preferences Model

```prisma
model NotificationPreference {
  id     String @id @default(cuid())
  userId String @unique
  
  // Channel preferences
  emailEnabled      Boolean @default(true)
  inAppEnabled      Boolean @default(true)
  pushEnabled       Boolean @default(false)
  
  // Frequency preferences
  emailDigest       EmailDigestFrequency @default(IMMEDIATE)
  digestTime        String? // Time of day for digest (e.g., "09:00")
  
  // Category preferences (JSON for flexibility)
  categoryPreferences Json // { "COLLABORATION": { "email": true, "inApp": true }, ... }
  
  // Quiet hours
  quietHoursEnabled Boolean @default(false)
  quietHoursStart   String? // e.g., "22:00"
  quietHoursEnd     String? // e.g., "08:00"
  
  // Do not disturb
  doNotDisturb      Boolean @default(false)
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("notification_preferences")
}

enum EmailDigestFrequency {
  IMMEDIATE
  HOURLY
  DAILY
  WEEKLY
  NEVER
}
```

## Implementation Architecture

### 1. Notification Service Layer

**File:** `src/services/notificationService.js`

```javascript
// Centralized notification creation service
class NotificationService {
  // Create single notification
  async createNotification({ userId, type, title, message, data, ... })
  
  // Create bulk notifications
  async createBulkNotifications(notifications)
  
  // Create notification for role/account type
  async notifyByRole(accountType, notification)
  
  // Create notification for all collaborators
  async notifyCollaborators(manuscriptId, notification, excludeUserId)
  
  // Send email notification
  async sendEmailNotification(userId, notification)
  
  // Process notification queue
  async processQueue()
}
```

### 2. Notification Templates

**File:** `src/services/notificationTemplates.js`

Pre-defined templates for each notification type with dynamic data injection.

### 3. Enhanced API Routes

- `GET /api/notifications` - Enhanced with filtering, pagination, categories
- `POST /api/notifications` - Enhanced with templates, bulk creation
- `PATCH /api/notifications` - Mark as read, archive, action taken
- `DELETE /api/notifications` - Soft delete with archive
- `GET /api/notifications/preferences` - Get user preferences
- `PATCH /api/notifications/preferences` - Update preferences
- `GET /api/notifications/stats` - Notification statistics

### 4. Real-time Updates

**Options:**
1. **Server-Sent Events (SSE)** - Simple, one-way communication
2. **WebSockets** - Full duplex, more complex
3. **Polling Enhancement** - Reduce from 30s to 10s for critical notifications

**Recommended:** Start with enhanced polling + SSE for real-time critical notifications

### 5. Email Integration

**File:** `src/services/emailNotificationService.js`

- Digest email generation
- Template-based emails
- Unsubscribe management
- Email tracking

## User Experience Enhancements

### 1. Notification Center Page

Full-page notification management:
- Filter by category, priority, read/unread
- Search notifications
- Bulk actions (mark all as read, archive)
- Notification history
- Statistics dashboard

### 2. Enhanced Dropdown

- Group by category
- Priority indicators
- Quick actions
- Inline previews
- Sound/visual alerts for urgent notifications

### 3. Notification Badges

- Per-category unread counts
- Priority indicators
- Module-specific badges (e.g., "3 pending proposals")

### 4. In-App Toasts

For real-time critical notifications:
- Urgent alerts
- Action-required notifications
- Success confirmations

## Implementation Phases

### Phase 1: Foundation (Week 1)
- ✅ Enhance Notification schema with migration
- ✅ Create NotificationPreference model
- ✅ Build NotificationService
- ✅ Create notification templates

### Phase 2: Core Events (Week 2)
- ✅ Implement manuscript/collaboration notifications
- ✅ Implement proposal notifications
- ✅ Implement training notifications
- ✅ Implement grant notifications

### Phase 3: User Experience (Week 3)
- ✅ Build Notification Center page
- ✅ Enhance notification dropdown
- ✅ Add notification preferences UI
- ✅ Implement filtering and search

### Phase 4: Advanced Features (Week 4)
- ✅ Email digest system
- ✅ Real-time notifications (SSE)
- ✅ Notification analytics
- ✅ Performance optimization

### Phase 5: Remaining Events (Week 5)
- ✅ Ethics notifications
- ✅ Publication notifications
- ✅ Preprint notifications
- ✅ System notifications

## Performance Considerations

1. **Database Indexing**
   - Index on `userId`, `isRead`, `createdAt`
   - Composite indexes for common queries

2. **Pagination**
   - Cursor-based pagination for large datasets
   - Limit default queries to 50 notifications

3. **Caching**
   - Cache unread counts
   - Cache user preferences
   - Invalidate on updates

4. **Archiving**
   - Auto-archive read notifications after 30 days
   - Soft delete for compliance

5. **Queue System**
   - Use job queue for bulk notifications
   - Rate limiting for email notifications

## Security & Privacy

1. **Authorization**
   - Users can only access their own notifications
   - Admin notifications require role verification

2. **Data Sanitization**
   - Sanitize notification content
   - Prevent XSS in notification messages

3. **Audit Trail**
   - Log notification creation
   - Track delivery status

## Testing Strategy

1. **Unit Tests**
   - NotificationService methods
   - Template rendering
   - Preference logic

2. **Integration Tests**
   - API endpoints
   - Database operations
   - Email delivery

3. **E2E Tests**
   - User notification flow
   - Preference updates
   - Real-time delivery

## Monitoring & Analytics

1. **Metrics**
   - Notification delivery rate
   - Read rate by type
   - Action completion rate
   - Email open rate

2. **Alerts**
   - Failed notification delivery
   - High unread counts
   - Email bounce rate

## Migration Strategy

1. **Database Migration**
   - Add new fields to Notification model
   - Create NotificationPreference table
   - Migrate existing notifications

2. **Backward Compatibility**
   - Support existing notification types
   - Graceful degradation for old clients

3. **Rollout**
   - Feature flag for new notification system
   - Gradual rollout by user type
   - Monitor and adjust

## Success Metrics

1. **User Engagement**
   - 80%+ notification read rate
   - 60%+ action completion rate
   - <5% unsubscribe rate

2. **System Performance**
   - <100ms notification creation
   - <500ms notification fetch
   - 99.9% delivery success rate

3. **User Satisfaction**
   - Positive feedback on notification relevance
   - Reduced support tickets about missed events
   - Increased feature adoption

## Conclusion

This comprehensive notification system will significantly enhance user engagement and system usability across all HospitiumRIS modules. The phased implementation approach ensures stability while delivering value incrementally.
