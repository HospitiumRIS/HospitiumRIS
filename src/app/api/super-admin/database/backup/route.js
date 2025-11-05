import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(request) {
  try {
    const { backupType = 'full', description = '', compression = 'gzip' } = await request.json();
    
    // Generate backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups');
    
    // Ensure backup directory exists
    try {
      await fs.access(backupDir);
    } catch {
      await fs.mkdir(backupDir, { recursive: true });
    }
    
    const filename = `backup-${timestamp}.sql${compression === 'gzip' ? '.gz' : ''}`;
    const filepath = path.join(backupDir, filename);
    
    // Build pg_dump command based on backup type
    let pgDumpCommand = 'pg_dump';
    
    // Add connection parameters from environment
    if (process.env.DATABASE_URL) {
      pgDumpCommand += ` "${process.env.DATABASE_URL}"`;
    }
    
    // Add backup type specific options
    switch (backupType) {
      case 'schema':
        pgDumpCommand += ' --schema-only';
        break;
      case 'data':
        pgDumpCommand += ' --data-only';
        break;
      case 'incremental':
        // For incremental, we would need to implement custom logic
        // This is a simplified version
        pgDumpCommand += ' --verbose';
        break;
      default: // full
        pgDumpCommand += ' --verbose --no-owner --no-privileges';
        break;
    }
    
    // Add compression if specified
    if (compression === 'gzip') {
      pgDumpCommand += ` | gzip > "${filepath}"`;
    } else {
      pgDumpCommand += ` > "${filepath}"`;
    }
    
    // Execute backup command
    console.log('Starting database backup...');
    const { stdout, stderr } = await execAsync(pgDumpCommand);
    
    // Get backup file stats
    const stats = await fs.stat(filepath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    // Log backup completion (you might want to save this to a database table)
    const backupInfo = {
      id: Date.now(),
      filename,
      filepath,
      type: backupType,
      description,
      compression,
      size: `${sizeInMB} MB`,
      status: 'Completed',
      createdAt: new Date().toISOString(),
      stdout: stdout?.substring(0, 1000), // Limit log size
      stderr: stderr?.substring(0, 1000)
    };
    
    console.log('Database backup completed:', backupInfo);
    
    return NextResponse.json({
      success: true,
      message: 'Database backup completed successfully',
      backup: backupInfo
    });
    
  } catch (error) {
    console.error('Database backup failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Database backup failed',
      error: error.message
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const backupDir = path.join(process.cwd(), 'backups');
    
    try {
      const files = await fs.readdir(backupDir);
      const backups = await Promise.all(
        files
          .filter(file => file.startsWith('backup-') && (file.endsWith('.sql') || file.endsWith('.sql.gz')))
          .map(async (file) => {
            const filepath = path.join(backupDir, file);
            const stats = await fs.stat(filepath);
            const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
            
            return {
              id: file,
              filename: file,
              size: `${sizeInMB} MB`,
              type: 'Automatic', // You might parse this from filename or database
              status: 'Completed',
              date: stats.ctime.toISOString().replace('T', ' ').substring(0, 19)
            };
          })
      );
      
      // Sort by date descending (newest first)
      backups.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      return NextResponse.json({
        success: true,
        backups
      });
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        return NextResponse.json({
          success: true,
          backups: []
        });
      }
      throw error;
    }
    
  } catch (error) {
    console.error('Failed to fetch backup history:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch backup history',
      error: error.message
    }, { status: 500 });
  }
}
