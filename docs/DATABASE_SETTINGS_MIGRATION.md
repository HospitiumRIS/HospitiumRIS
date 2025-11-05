# Database Settings Migration

## Overview

The Zotero settings have been migrated from localStorage to a database-backed solution to provide better persistence, multi-device synchronization, and security.

## Changes Made

### 1. Database Schema Updates

Added `UserSettings` model to Prisma schema:

```prisma
enum SettingsType {
  ZOTERO
  PUBMED
  OTHER
}

model UserSettings {
  id          String   @id @default(cuid())
  userId      String
  type        SettingsType
  settings    Json     // Store settings as JSON for flexibility
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Ensure unique combination of userId and type
  @@unique([userId, type])
  @@map("user_settings")
}
```

### 2. API Endpoints

Created RESTful API endpoints at `/api/settings/zotero`:

- **GET**: Retrieve user's Zotero settings
- **POST**: Save/update user's Zotero settings  
- **DELETE**: Clear user's Zotero settings

### 3. Settings Utility Updates

Updated `src/utils/zoteroSettings.js`:
- All functions now async and use API calls
- Proper error handling with try/catch
- Authentication-aware (returns defaults for unauthenticated users)

### 4. Component Updates

**ResearcherSettings.jsx**:
- Async loading of settings on mount
- Async save/clear operations
- Loading states during API calls
- Better error handling with snackbar notifications

**ZoteroImport.jsx**:
- Async settings check on mount  
- Auto-authentication with saved credentials
- Graceful fallback if settings unavailable

### 5. Navigation Changes

- **Removed** Settings from main researcher navbar
- Settings now **only accessible** through user menu (as requested)
- Cleaner navigation hierarchy

## Data Migration

### Existing Users
For users who previously had localStorage settings:
- Settings will need to be re-entered in the new system
- Old localStorage data will not interfere with new system
- Settings page will guide users through one-time setup

### New Users  
- Seamless onboarding through settings page
- Settings persist across devices and sessions
- Automatic authentication for subsequent imports

## Database Migration

To apply the schema changes to your database:

```bash
npx prisma migrate dev --name add-user-settings
npx prisma generate
```

## API Security

- **Authentication**: All endpoints require authenticated user (via Clerk)
- **Authorization**: Users can only access their own settings
- **Data Privacy**: Settings stored as JSON in database, API keys not logged
- **Cleanup**: Settings deleted when user account is deleted (CASCADE)

## Benefits of Database Approach

### ✅ Advantages
- **Multi-device sync**: Settings work across all user devices
- **Persistent**: No data loss from browser clearing/changing
- **Secure**: Server-side storage with proper authentication
- **Auditable**: Timestamps for troubleshooting
- **Scalable**: Can add more integration types easily

### 📱 User Experience
- **One-time setup**: Configure once, use everywhere
- **Automatic authentication**: No re-entering credentials
- **User menu access**: Natural location for account settings
- **Better error handling**: Clear feedback on save/load failures

## Error Handling

### API Errors
- 401: User not authenticated → Return default settings
- 500: Database error → Show user-friendly error message
- Network errors → Graceful degradation with local state

### Component Errors  
- Settings load failure → Show error snackbar, allow manual entry
- Settings save failure → Show error, retain form data
- Connection test failure → Clear error messaging

## Testing Checklist

- [ ] Settings page loads correctly from user menu
- [ ] Settings save to database successfully  
- [ ] Settings load on subsequent page visits
- [ ] Zotero import auto-authenticates with saved settings
- [ ] Settings clear functionality works
- [ ] Error handling works for network/auth failures
- [ ] Migration doesn't break existing functionality

## Future Enhancements

- **Backup/Export**: Allow users to export settings
- **Multiple Accounts**: Support multiple Zotero accounts per user
- **Settings Templates**: Pre-configured settings for institutions
- **Audit Trail**: Track when settings are modified
- **Encryption**: Client-side encryption of sensitive data
