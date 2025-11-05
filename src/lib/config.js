/**
 * Application Configuration
 * 
 * This file centralizes client-side configuration using NEXT_PUBLIC_ environment variables.
 * These variables are safe to expose to the browser and are built into the client bundle.
 */

// Application base URL - accessible from both client and server
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// API base URL (usually same as APP_URL for Next.js)
export const API_URL = `${APP_URL}/api`;

// Application configuration
export const APP_CONFIG = {
  name: 'Hospitium RIS',
  description: 'Research Information System',
  url: APP_URL,
  apiUrl: API_URL,
  
  // Email-related URLs (for client-side redirects)
  urls: {
    home: APP_URL,
    login: `${APP_URL}/login`,
    register: `${APP_URL}/register`,
    activate: `${APP_URL}/activate`,
    dashboard: `${APP_URL}/dashboard`,
  },
  
  // Features flags (if you want to toggle features client-side)
  features: {
    registration: true,
    emailVerification: true,
    orcidIntegration: true,
  }
};

// Helper function to get absolute URL
export const getAbsoluteUrl = (path = '') => {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return cleanPath ? `${APP_URL}/${cleanPath}` : APP_URL;
};

// Helper function for API endpoints
export const getApiUrl = (endpoint = '') => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return cleanEndpoint ? `${API_URL}/${cleanEndpoint}` : API_URL;
};

export default APP_CONFIG;
