# Zotero Import Setup Guide

This guide will help you set up Zotero import functionality in HospitiumRis.

## Prerequisites

1. A Zotero account (free at [zotero.org](https://www.zotero.org))
2. Publications in your Zotero library
3. Internet connection

## Getting Your Zotero Credentials

### Step 1: Find Your User ID

1. Log in to your Zotero account at [zotero.org](https://www.zotero.org)
2. Go to **Settings** → **Feeds/API**
3. Your **User ID** is displayed at the top of the page (it's a numeric value)

### Step 2: Create an API Key

1. On the same **Feeds/API** page, scroll down to **Create new private key**
2. Give your key a name (e.g., "HospitiumRis Import")
3. Under **Personal Library**, check:
   - ✅ Allow library access
   - ✅ Allow notes access (optional)
   - ✅ Allow write access (if you want to sync back to Zotero later)
4. Click **Save Key**
5. **Important**: Copy the generated key immediately - you won't be able to see it again!

## Using Zotero Import in HospitiumRis

### Step 1: Access the Import Feature

1. Navigate to **Publications** → **Import Publications**
2. Click on the **Zotero** import method
3. Enter your **User ID** and **API Key** in the authentication form
4. Click **Connect to Zotero**

### Step 2: Select Publications

1. Once connected, you'll see your Zotero collections
2. Select a collection from the dropdown (or "All Items" for everything)
3. Review the publications that appear
4. Select the publications you want to import (all are selected by default)
5. Click **Import Selected** to add them to your HospitiumRis library

## Supported Publication Types

The Zotero import supports these publication types:

- **Journal Articles** → Article
- **Book Sections** → Book Chapter
- **Books** → Book
- **Theses** → Thesis
- **Conference Papers** → Conference
- **Reports** → Report
- **Web Pages** → Other
- **Blog Posts** → Other
- **Magazine Articles** → Article
- **Newspaper Articles** → Article
- **Patents** → Other
- **Preprints** → Preprint
- **Presentations** → Presentation
- **Software** → Software

## Troubleshooting

### "Invalid API key or insufficient permissions"
- Double-check that you copied the API key correctly
- Ensure your API key has "Allow library access" permission
- Try creating a new API key

### "User ID not found"
- Verify your User ID is correct (should be a numeric value)
- Make sure you're using your User ID, not your username

### "No publications found"
- Check that you have publications in your selected collection
- Try selecting "All Items" to see your entire library
- Ensure your publications aren't in the Trash

### CORS Issues
If you encounter CORS (Cross-Origin Resource Sharing) issues:
- This is a browser security feature
- The Zotero API should allow cross-origin requests, but some browsers might be restrictive
- Try using a different browser or clearing your browser cache

## API Limitations

- **Rate Limiting**: Zotero API has rate limits (currently 120 requests per hour for authenticated requests)
- **Item Limit**: We fetch up to 50 items at a time to avoid long loading times
- **No Real-time Sync**: Changes made in HospitiumRis won't sync back to Zotero automatically

## Security Notes

- Your API key provides access to your entire Zotero library
- Store your API key securely and don't share it
- You can revoke API keys anytime from your Zotero settings
- HospitiumRis doesn't store your credentials permanently (they're only kept for your browser session)

## Need Help?

- [Zotero API Documentation](https://www.zotero.org/support/dev/web_api/v3/start)
- [Zotero Support Forums](https://forums.zotero.org/)
- For HospitiumRis-specific issues, contact your system administrator
