/**
 * Zotero Settings Utility
 * Handles saving, loading, and managing Zotero settings via API
 */

/**
 * Get saved Zotero settings from database
 * @returns {Promise<Object>} Zotero settings or default values
 */
export const getZoteroSettings = async () => {
  try {
    const response = await fetch('/api/settings/zotero', {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 401) {
        // User not authenticated, return default settings
        return {
          userID: '',
          apiKey: '',
          isConfigured: false,
          lastTested: null
        };
      }
      throw new Error(`Failed to fetch settings: ${response.statusText}`);
    }

    const settings = await response.json();
    return settings;
  } catch (error) {
    console.error('Error loading Zotero settings:', error);
    return {
      userID: '',
      apiKey: '',
      isConfigured: false,
      lastTested: null
    };
  }
};

/**
 * Save Zotero settings to database
 * @param {Object} settings - Settings object to save
 * @returns {Promise<Object>} Saved settings with timestamp
 */
export const saveZoteroSettings = async (settings) => {
  try {
    const response = await fetch('/api/settings/zotero', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        userID: settings.userID,
        apiKey: settings.apiKey,
        isConfigured: settings.isConfigured
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      // Handle special case where database table doesn't exist
      if (response.status === 503 && errorData.code === 'TABLE_NOT_FOUND') {
        throw new Error('Database setup required. Please contact administrator to run database migration.');
      }
      
      throw new Error(errorData.error || `Failed to save settings: ${response.statusText}`);
    }

    const result = await response.json();
    return result.settings;
  } catch (error) {
    console.error('Error saving Zotero settings:', error);
    throw new Error(`Failed to save settings: ${error.message}`);
  }
};

/**
 * Clear Zotero settings from database
 * @returns {Promise<void>}
 */
export const clearZoteroSettings = async () => {
  try {
    const response = await fetch('/api/settings/zotero', {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to clear settings: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error clearing Zotero settings:', error);
    throw new Error(`Failed to clear settings: ${error.message}`);
  }
};

/**
 * Check if Zotero is configured
 * @returns {Promise<boolean>} True if both userID and apiKey are present
 */
export const isZoteroConfigured = async () => {
  try {
    const settings = await getZoteroSettings();
    return !!(settings.userID && settings.apiKey && settings.isConfigured);
  } catch (error) {
    console.error('Error checking Zotero configuration:', error);
    return false;
  }
};

/**
 * Get Zotero credentials for API calls
 * @returns {Promise<Object|null>} Object with userID and apiKey, or null if not configured
 */
export const getZoteroCredentials = async () => {
  try {
    const settings = await getZoteroSettings();
    if (settings.userID && settings.apiKey) {
      return {
        userID: settings.userID,
        apiKey: settings.apiKey
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting Zotero credentials:', error);
    return null;
  }
};

/**
 * Update specific Zotero setting
 * @param {string} key - Setting key to update
 * @param {any} value - New value
 * @returns {Promise<Object>} Updated settings
 */
export const updateZoteroSetting = async (key, value) => {
  try {
    const settings = await getZoteroSettings();
    const updatedSettings = {
      ...settings,
      [key]: value
    };
    
    // Auto-determine if configured based on userID and apiKey
    if (key === 'userID' || key === 'apiKey') {
      updatedSettings.isConfigured = !!(updatedSettings.userID && updatedSettings.apiKey);
    }
    
    return await saveZoteroSettings(updatedSettings);
  } catch (error) {
    console.error('Error updating Zotero setting:', error);
    throw error;
  }
};
