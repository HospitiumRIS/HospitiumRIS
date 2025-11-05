import fs from 'fs/promises';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'activity.log');

// Ensure logs directory exists
const ensureLogDir = async () => {
  try {
    await fs.access(LOG_DIR);
  } catch {
    await fs.mkdir(LOG_DIR, { recursive: true });
  }
};

// Log levels
export const LOG_LEVELS = {
  INFO: 'INFO',
  SUCCESS: 'SUCCESS', 
  ERROR: 'ERROR',
  WARNING: 'WARNING',
  API_CALL: 'API_CALL',
  DB_OPERATION: 'DB_OPERATION'
};

// Activity logger function
export const logActivity = async (level, message, metadata = {}) => {
  try {
    await ensureLogDir();
    
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      metadata: {
        ...metadata,
        userAgent: metadata.userAgent || 'Unknown',
        ip: metadata.ip || 'Unknown',
        userId: metadata.userId || null,
        sessionId: metadata.sessionId || null
      }
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    
    // Append to log file
    await fs.appendFile(LOG_FILE, logLine);
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${timestamp}] ${level}: ${message}`, metadata);
    }
  } catch (error) {
    console.error('Failed to write to activity log:', error);
  }
};

// Convenience functions for different log levels
export const logInfo = (message, metadata) => logActivity(LOG_LEVELS.INFO, message, metadata);
export const logSuccess = (message, metadata) => logActivity(LOG_LEVELS.SUCCESS, message, metadata);
export const logError = (message, metadata) => logActivity(LOG_LEVELS.ERROR, message, metadata);
export const logWarning = (message, metadata) => logActivity(LOG_LEVELS.WARNING, message, metadata);
export const logApiCall = (message, metadata) => logActivity(LOG_LEVELS.API_CALL, message, metadata);
export const logDbOperation = (message, metadata) => logActivity(LOG_LEVELS.DB_OPERATION, message, metadata);

// Database activity logger
export const logDatabaseActivity = async (operation, table, result, metadata = {}) => {
  const message = `Database ${operation} on ${table}`;
  const logMetadata = {
    ...metadata,
    operation,
    table,
    success: result.success !== false,
    recordCount: result.count || (Array.isArray(result) ? result.length : 1),
    duration: metadata.duration || null
  };
  
  if (result.success === false || result.error) {
    await logError(`${message} - FAILED: ${result.error || 'Unknown error'}`, logMetadata);
  } else {
    await logDbOperation(`${message} - SUCCESS`, logMetadata);
  }
};

// API call logger
export const logApiActivity = async (method, endpoint, statusCode, metadata = {}) => {
  const message = `${method} ${endpoint} - ${statusCode}`;
  const logMetadata = {
    ...metadata,
    method,
    endpoint,
    statusCode,
    success: statusCode >= 200 && statusCode < 400
  };
  
  if (statusCode >= 400) {
    await logError(`API Call Failed: ${message}`, logMetadata);
  } else {
    await logApiCall(`API Call: ${message}`, logMetadata);
  }
};

// Get request metadata helper
export const getRequestMetadata = (req) => {
  // Handle Next.js API route requests
  let ip = 'Unknown';
  let userAgent = 'Unknown';
  
  if (req && typeof req.headers?.get === 'function') {
    // Next.js 13+ App Router - use headers.get() method
    ip = req.headers.get('x-forwarded-for') || 
         req.headers.get('x-real-ip') || 
         req.headers.get('x-client-ip') ||
         req.headers.get('cf-connecting-ip') || // Cloudflare
         req.headers.get('x-cluster-client-ip') ||
         '127.0.0.1'; // localhost fallback
    
    userAgent = req.headers.get('user-agent') || 'Unknown';
  } else if (req && req.headers) {
    // Traditional Node.js request object or Next.js Pages API
    ip = req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.headers['x-client-ip'] ||
         req.headers['cf-connecting-ip'] ||
         req.headers['x-cluster-client-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         '127.0.0.1';
    
    userAgent = req.headers['user-agent'] || 'Unknown';
  }

  // Clean up IP address (handle IPv6 localhost and forwarded headers)
  if (ip) {
    if (ip.includes(',')) {
      // x-forwarded-for can contain multiple IPs, take the first one
      ip = ip.split(',')[0].trim();
    }
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
      ip = '127.0.0.1'; // Normalize localhost
    }
  }

  return {
    ip: ip || 'Unknown',
    userAgent: userAgent || 'Unknown',
    method: req?.method || 'Unknown',
    url: req?.url || 'Unknown',
    timestamp: new Date().toISOString()
  };
};
