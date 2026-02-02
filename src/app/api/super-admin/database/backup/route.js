import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { getAuthenticatedUser } from '@/lib/auth-server';

const execAsync = promisify(exec);

export async function POST(request) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (user.accountType !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Insufficient privileges' },
        { status: 403 }
      );
    }

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
    
    const filename = `backup-${timestamp}.json`;
    const filepath = path.join(backupDir, filename);
    
    // Use Prisma to export data (works in development without pg_dump)
    console.log('Starting database backup using Prisma...');
    
    const prisma = (await import('@/lib/prisma')).default;
    
    const backupData = {
      metadata: {
        backupType,
        description,
        timestamp: new Date().toISOString(),
        version: '1.0'
      },
      data: {}
    };
    
    // Export data from all tables
    try {
      if (backupType === 'full' || backupType === 'data') {
        backupData.data.users = await prisma.user.findMany();
        backupData.data.manuscripts = await prisma.manuscript.findMany();
        backupData.data.publications = await prisma.publication.findMany();
        backupData.data.proposals = await prisma.proposal.findMany();
        backupData.data.donations = await prisma.donation.findMany();
        backupData.data.campaigns = await prisma.campaign.findMany();
      }
      
      // Write backup to file
      await fs.writeFile(filepath, JSON.stringify(backupData, null, 2), 'utf-8');
      
      // Get backup file stats
      const stats = await fs.stat(filepath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      // Log backup completion
      const backupInfo = {
        id: Date.now(),
        filename,
        filepath,
        type: backupType,
        description,
        compression: 'none',
        size: `${sizeInMB} MB`,
        status: 'Completed',
        createdAt: new Date().toISOString()
      };
      
      console.log('Database backup completed:', backupInfo);
      
      await prisma.$disconnect();
    } catch (error) {
      await prisma.$disconnect();
      throw error;
    }
    
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
    // Check authentication
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (user.accountType !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Insufficient privileges' },
        { status: 403 }
      );
    }

    const backupDir = path.join(process.cwd(), 'backups');
    
    try {
      const files = await fs.readdir(backupDir);
      const backups = await Promise.all(
        files
          .filter(file => file.startsWith('backup-') && (file.endsWith('.json') || file.endsWith('.sql') || file.endsWith('.sql.gz')))
          .map(async (file) => {
            const filepath = path.join(backupDir, file);
            const stats = await fs.stat(filepath);
            const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
            
            // Try to read metadata from JSON backups
            let backupType = 'Manual';
            let description = '';
            
            if (file.endsWith('.json')) {
              try {
                const content = await fs.readFile(filepath, 'utf-8');
                const data = JSON.parse(content);
                backupType = data.metadata?.backupType || 'full';
                description = data.metadata?.description || '';
              } catch (error) {
                console.log('Could not read backup metadata:', error.message);
              }
            }
            
            return {
              id: file,
              filename: file,
              size: `${sizeInMB} MB`,
              type: backupType.charAt(0).toUpperCase() + backupType.slice(1),
              status: 'Completed',
              date: stats.ctime.toISOString().replace('T', ' ').substring(0, 19),
              description
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
