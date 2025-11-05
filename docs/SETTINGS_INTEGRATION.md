# Settings Integration for Zotero Import

This document explains how the settings integration works for the Zotero import functionality.

## Overview

Users can now configure their Zotero credentials in a dedicated settings page, which will be automatically used when importing publications. This provides a better user experience by eliminating the need to re-enter credentials every time.

## User Flow

### First Time Setup

1. **User clicks Zotero import** → Sees "Setup Required" message
2. **Clicks "Go to Settings"** → Redirects to `/researcher/settings`
3. **Configures Zotero credentials** → Enters User ID and API Key
4. **Tests connection** → Validates credentials with Zotero API
5. **Saves settings** → Credentials stored in localStorage
6. **Returns to import** → Zotero import now works automatically

### Subsequent Usage

1. **User clicks Zotero import** → Automatically loads saved credentials
2. **Auto-authenticates** → Connects to Zotero in the background
3. **Shows collections** → User can immediately select and import

## Implementation Details

### Settings Page (`/researcher/settings`)

- **Location**: `src/app/researcher/settings/page.js`
- **Component**: `src/components/Settings/ResearcherSettings.jsx`
- **Features**:
  - Secure credential input with show/hide password
  - Connection testing before saving
  - Clear settings option
  - Status indicators and help links

### Settings Utility (`src/utils/zoteroSettings.js`)

- **Purpose**: Centralized settings management
- **Functions**:
  - `getZoteroSettings()` - Load saved settings
  - `saveZoteroSettings()` - Save settings with validation
  - `isZoteroConfigured()` - Check if setup is complete
  - `getZoteroCredentials()` - Get credentials for API calls
  - `clearZoteroSettings()` - Remove all settings

### Updated Zotero Import (`src/components/Publications/ImportTabs/ZoteroImport.jsx`)

- **Smart Loading**: Checks for saved settings on mount
- **Auto-Authentication**: Connects automatically if configured
- **Fallback UI**: Shows setup guidance if not configured
- **Settings Integration**: Links to settings page when needed

### Navigation Integration

- **Settings Link**: Added to researcher navigation menu
- **Easy Access**: Users can access settings from any page
- **Location**: Available in the top navigation bar

## Storage and Security

### LocalStorage Usage

Settings are stored in browser's localStorage with the key `zotero-settings`:

```json
{
  "userID": "1234567",
  "apiKey": "encrypted_or_masked_key",
  "isConfigured": true,
  "lastTested": "2024-01-15T10:30:00Z"
}
```

### Security Considerations

- **Client-side only**: Credentials never sent to our servers
- **API Key masking**: Hidden in UI, shown only when needed
- **Easy clearing**: Users can remove credentials anytime
- **Session-based**: Settings persist across browser sessions

## User Experience Improvements

### Before Integration
1. Open Zotero import
2. Manually enter User ID
3. Manually enter API Key
4. Connect to Zotero
5. Browse and import
6. **Repeat steps 2-4 every time**

### After Integration
1. **One-time setup** in Settings
2. Open Zotero import
3. **Automatic connection**
4. Browse and import immediately
5. **No repetitive setup**

## Error Handling

### Configuration Errors
- Invalid credentials → Clear error messages
- Network issues → Retry guidance
- API failures → Troubleshooting help

### Recovery Options
- Clear and reconfigure settings
- Manual override in import modal
- Direct links to Zotero help resources

## Testing the Integration

### Test Scenario 1: New User
1. Go to `/researcher/publications/import`
2. Click Zotero → Should show "Setup Required"
3. Click "Go to Settings" → Should redirect to settings page
4. Configure credentials → Should test and save successfully
5. Return to import → Should auto-connect

### Test Scenario 2: Configured User
1. Complete setup once (Scenario 1)
2. Go to `/researcher/publications/import`
3. Click Zotero → Should auto-connect and show collections
4. Import should work immediately

### Test Scenario 3: Settings Management
1. Go to `/researcher/settings`
2. View configured settings
3. Test connection → Should verify credentials
4. Clear settings → Should reset everything
5. Reconfigure → Should work normally

## Future Enhancements

### Planned Features
- **Multiple account support**: Configure multiple Zotero accounts
- **Sync preferences**: Remember last used collections
- **Export settings**: Backup/restore configurations
- **Integration health**: Monitor connection status

### Security Improvements
- **Encryption**: Encrypt stored credentials
- **Expiration**: Auto-expire old credentials
- **Permissions**: Granular API key permissions

The settings integration provides a seamless, user-friendly way to manage Zotero credentials while maintaining security and ease of use.
