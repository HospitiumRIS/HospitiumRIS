import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const prisma = new PrismaClient();
const execAsync = promisify(exec);

export async function POST(request) {
  try {
    const { operation, options = {} } = await request.json();
    
    let result = {};
    
    switch (operation) {
      case 'vacuum':
        result = await performVacuum(options);
        break;
        
      case 'reindex':
        result = await performReindex(options);
        break;
        
      case 'analyze':
        result = await performAnalyze(options);
        break;
        
      case 'cleanup':
        result = await performCleanup(options);
        break;
        
      case 'statistics':
        result = await updateStatistics();
        break;
        
      case 'migrate':
        result = await runMigrations();
        break;
        
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
    
    return NextResponse.json({
      success: true,
      message: `${operation} operation completed successfully`,
      result
    });
    
  } catch (error) {
    console.error(`Database maintenance operation failed:`, error);
    
    return NextResponse.json({
      success: false,
      message: `Database maintenance operation failed: ${error.message}`,
      error: error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

async function performVacuum(options) {
  try {
    const { full = false, table = null } = options;
    
    let query = 'VACUUM';
    if (full) {
      query += ' FULL';
    }
    if (table) {
      query += ` ${table}`;
    }
    
    console.log(`Executing: ${query}`);
    await prisma.$executeRawUnsafe(query);
    
    return {
      operation: 'vacuum',
      full,
      table,
      executedAt: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Vacuum failed: ${error.message}`);
  }
}

async function performReindex(options) {
  try {
    const { table = null, index = null } = options;
    
    let query = 'REINDEX';
    if (table) {
      query += ` TABLE ${table}`;
    } else if (index) {
      query += ` INDEX ${index}`;
    } else {
      query += ' DATABASE CURRENT';
    }
    
    console.log(`Executing: ${query}`);
    await prisma.$executeRawUnsafe(query);
    
    return {
      operation: 'reindex',
      table,
      index,
      executedAt: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Reindex failed: ${error.message}`);
  }
}

async function performAnalyze(options) {
  try {
    const { table = null } = options;
    
    let query = 'ANALYZE';
    if (table) {
      query += ` ${table}`;
    }
    
    console.log(`Executing: ${query}`);
    await prisma.$executeRawUnsafe(query);
    
    return {
      operation: 'analyze',
      table,
      executedAt: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Analyze failed: ${error.message}`);
  }
}

async function performCleanup(options) {
  try {
    const cleanupResults = [];
    
    // Clean up expired email verification tokens
    const expiredTokens = await prisma.user.updateMany({
      where: {
        emailVerifyExpires: {
          lt: new Date()
        },
        emailVerified: false
      },
      data: {
        emailVerifyToken: null,
        emailVerifyExpires: null
      }
    });
    
    cleanupResults.push({
      operation: 'Clean expired email tokens',
      count: expiredTokens.count
    });
    
    // Clean up expired manuscript invitations
    const expiredInvitations = await prisma.manuscriptInvitation.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        },
        status: 'PENDING'
      }
    });
    
    cleanupResults.push({
      operation: 'Clean expired manuscript invitations',
      count: expiredInvitations.count
    });
    
    // Clean up old registration logs (older than 90 days)
    const oldRegistrationLogs = await prisma.registrationLog.deleteMany({
      where: {
        attemptedAt: {
          lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        }
      }
    });
    
    cleanupResults.push({
      operation: 'Clean old registration logs',
      count: oldRegistrationLogs.count
    });
    
    // Update manuscript word counts for those that are null
    const manuscriptsNeedingWordCount = await prisma.manuscript.findMany({
      where: {
        wordCount: null,
        content: {
          not: null
        }
      },
      select: {
        id: true,
        content: true
      }
    });
    
    let wordCountUpdates = 0;
    for (const manuscript of manuscriptsNeedingWordCount) {
      try {
        // Simple word count calculation (you might want to use a more sophisticated method)
        const wordCount = manuscript.content
          ? manuscript.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length
          : 0;
          
        await prisma.manuscript.update({
          where: { id: manuscript.id },
          data: { wordCount }
        });
        
        wordCountUpdates++;
      } catch (error) {
        console.error(`Failed to update word count for manuscript ${manuscript.id}:`, error);
      }
    }
    
    cleanupResults.push({
      operation: 'Update manuscript word counts',
      count: wordCountUpdates
    });
    
    return {
      operation: 'cleanup',
      results: cleanupResults,
      executedAt: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Cleanup failed: ${error.message}`);
  }
}

async function updateStatistics() {
  try {
    // Update table statistics
    await prisma.$executeRawUnsafe('ANALYZE');
    
    // You might also update any custom statistics tables here
    
    return {
      operation: 'update_statistics',
      message: 'Database statistics updated successfully',
      executedAt: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Statistics update failed: ${error.message}`);
  }
}

async function runMigrations() {
  try {
    console.log('Running Prisma migrations...');
    
    // Execute Prisma migrate deploy command
    const { stdout, stderr } = await execAsync('npx prisma migrate deploy');
    
    return {
      operation: 'migrate',
      stdout: stdout?.substring(0, 1000),
      stderr: stderr?.substring(0, 1000),
      executedAt: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Migration failed: ${error.message}`);
  }
}
