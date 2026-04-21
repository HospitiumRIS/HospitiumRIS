import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

/**
 * Find PostgreSQL bin directory on Windows
 */
async function findPostgresBinPath() {
  const isWindows = process.platform === 'win32';
  
  if (!isWindows) {
    return ''; // On Linux/Mac, assume pg_dump is in PATH
  }

  // Common PostgreSQL installation paths on Windows
  const commonPaths = [
    'C:\\Program Files\\PostgreSQL',
    'C:\\Program Files (x86)\\PostgreSQL',
    path.join(os.homedir(), 'AppData\\Local\\Programs\\PostgreSQL'),
  ];

  for (const basePath of commonPaths) {
    try {
      const dirs = await fs.readdir(basePath);
      // Find version directories (e.g., 14, 15, 16)
      const versionDirs = dirs.filter(d => /^\d+$/.test(d)).sort().reverse();
      
      for (const version of versionDirs) {
        const binPath = path.join(basePath, version, 'bin');
        try {
          await fs.access(path.join(binPath, 'pg_dump.exe'));
          return binPath;
        } catch {
          continue;
        }
      }
    } catch {
      continue;
    }
  }

  // If not found, return empty string and hope it's in PATH
  return '';
}

/**
 * Database Service
 * Provides utilities for database management, inspection, and backup
 */
class DatabaseService {
  /**
   * Get all tables in the database with detailed information
   */
  async getAllTables() {
    try {
      const tables = await prisma.$queryRaw`
        SELECT 
          t.tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
          pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes,
          (SELECT count(*) FROM information_schema.columns c 
           WHERE c.table_schema = t.schemaname AND c.table_name = t.tablename) AS column_count,
          obj_description((schemaname||'.'||tablename)::regclass, 'pg_class') AS description
        FROM pg_tables t
        WHERE schemaname = 'public'
        ORDER BY size_bytes DESC
      `;

      // Get row counts for each table
      const tablesWithCounts = await Promise.all(
        tables.map(async (table) => {
          try {
            const result = await prisma.$queryRawUnsafe(
              `SELECT count(*) as count FROM "${table.tablename}"`
            );
            return {
              name: table.tablename,
              size: table.total_size,
              sizeBytes: Number(table.size_bytes),
              columnCount: Number(table.column_count),
              rowCount: Number(result[0]?.count || 0),
              description: table.description || null
            };
          } catch (error) {
            console.error(`Error getting count for ${table.tablename}:`, error);
            return {
              name: table.tablename,
              size: table.total_size,
              sizeBytes: Number(table.size_bytes),
              columnCount: Number(table.column_count),
              rowCount: 0,
              description: table.description || null
            };
          }
        })
      );

      return tablesWithCounts;
    } catch (error) {
      console.error('Error getting all tables:', error);
      throw error;
    }
  }

  /**
   * Get detailed information about a specific table
   */
  async getTableInfo(tableName) {
    try {
      // Get columns
      const columns = await prisma.$queryRaw`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = ${tableName}
        ORDER BY ordinal_position
      `;

      // Get indexes
      const indexes = await prisma.$queryRaw`
        SELECT
          i.relname AS index_name,
          a.attname AS column_name,
          ix.indisunique AS is_unique,
          ix.indisprimary AS is_primary
        FROM pg_class t
        JOIN pg_index ix ON t.oid = ix.indrelid
        JOIN pg_class i ON i.oid = ix.indexrelid
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
        WHERE t.relname = ${tableName}
        ORDER BY i.relname, a.attnum
      `;

      // Get row count
      const countResult = await prisma.$queryRawUnsafe(
        `SELECT count(*) as count FROM "${tableName}"`
      );

      return {
        tableName,
        columns,
        indexes,
        rowCount: Number(countResult[0]?.count || 0)
      };
    } catch (error) {
      console.error(`Error getting table info for ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Create a database backup
   * @param {string} format - 'sql', 'tar', or 'custom'
   * @param {string} outputPath - Path where backup should be saved
   */
  async createBackup(format = 'sql', outputPath = null) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.join(process.cwd(), 'backups');
      
      // Ensure backup directory exists
      try {
        await fs.access(backupDir);
      } catch {
        await fs.mkdir(backupDir, { recursive: true });
      }

      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL not found in environment variables');
      }

      // Parse database URL
      const dbUrlObj = new URL(dbUrl);
      const dbName = dbUrlObj.pathname.slice(1);
      const dbUser = dbUrlObj.username;
      const dbPassword = dbUrlObj.password;
      const dbHost = dbUrlObj.hostname;
      const dbPort = dbUrlObj.port || '5432';

      // Detect OS
      const isWindows = process.platform === 'win32';

      // Find PostgreSQL bin path on Windows
      const pgBinPath = await findPostgresBinPath();
      const pgDumpCmd = isWindows && pgBinPath 
        ? `"${path.join(pgBinPath, 'pg_dump.exe')}"`
        : 'pg_dump';

      let fileName, command;
      let formatFlag;

      switch (format.toLowerCase()) {
        case 'sql':
          fileName = outputPath || path.join(backupDir, `backup-${timestamp}.sql`);
          formatFlag = '-F p';
          break;

        case 'tar':
          fileName = outputPath || path.join(backupDir, `backup-${timestamp}.tar`);
          formatFlag = '-F t';
          break;

        case 'custom':
        case 'dump':
          fileName = outputPath || path.join(backupDir, `backup-${timestamp}.dump`);
          formatFlag = '-F c';
          break;

        default:
          throw new Error(`Unsupported backup format: ${format}. Use 'sql', 'tar', or 'custom'`);
      }

      // Build command based on OS
      if (isWindows) {
        // Windows: Use SET command to set environment variable
        command = `SET PGPASSWORD=${dbPassword}&& ${pgDumpCmd} -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} ${formatFlag} -f "${fileName}"`;
      } else {
        // Linux/Mac: Use PGPASSWORD prefix
        command = `PGPASSWORD="${dbPassword}" ${pgDumpCmd} -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} ${formatFlag} -f "${fileName}"`;
      }

      console.log('Creating backup...');
      const { stdout, stderr } = await execAsync(command, {
        shell: isWindows ? 'cmd.exe' : '/bin/sh'
      });
      
      if (stderr && !stderr.includes('WARNING')) {
        console.error('Backup stderr:', stderr);
      }

      // Get file size
      const stats = await fs.stat(fileName);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

      return {
        success: true,
        fileName: path.basename(fileName),
        filePath: fileName,
        format,
        size: `${fileSizeMB} MB`,
        sizeBytes: stats.size,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }

  /**
   * Restore database from backup
   * @param {string} backupPath - Path to backup file
   * @param {string} format - 'sql', 'tar', or 'custom'
   */
  async restoreBackup(backupPath, format = 'sql') {
    try {
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL not found in environment variables');
      }

      // Parse database URL
      const dbUrlObj = new URL(dbUrl);
      const dbName = dbUrlObj.pathname.slice(1);
      const dbUser = dbUrlObj.username;
      const dbPassword = dbUrlObj.password;
      const dbHost = dbUrlObj.hostname;
      const dbPort = dbUrlObj.port || '5432';

      // Detect OS
      const isWindows = process.platform === 'win32';

      // Find PostgreSQL bin path on Windows
      const pgBinPath = await findPostgresBinPath();
      const psqlCmd = isWindows && pgBinPath 
        ? `"${path.join(pgBinPath, 'psql.exe')}"`
        : 'psql';
      const pgRestoreCmd = isWindows && pgBinPath 
        ? `"${path.join(pgBinPath, 'pg_restore.exe')}"`
        : 'pg_restore';

      let command;

      switch (format.toLowerCase()) {
        case 'sql':
          if (isWindows) {
            command = `SET PGPASSWORD=${dbPassword}&& ${psqlCmd} -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f "${backupPath}"`;
          } else {
            command = `PGPASSWORD="${dbPassword}" ${psqlCmd} -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f "${backupPath}"`;
          }
          break;

        case 'tar':
        case 'custom':
        case 'dump':
          if (isWindows) {
            command = `SET PGPASSWORD=${dbPassword}&& ${pgRestoreCmd} -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -c "${backupPath}"`;
          } else {
            command = `PGPASSWORD="${dbPassword}" ${pgRestoreCmd} -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -c "${backupPath}"`;
          }
          break;

        default:
          throw new Error(`Unsupported restore format: ${format}`);
      }

      console.log('Restoring backup...');
      const { stdout, stderr } = await execAsync(command, {
        shell: isWindows ? 'cmd.exe' : '/bin/sh'
      });
      
      if (stderr && !stderr.includes('WARNING')) {
        console.error('Restore stderr:', stderr);
      }

      return {
        success: true,
        message: 'Database restored successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error restoring backup:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats() {
    try {
      const [sizeResult, tableCountResult, connectionResult] = await Promise.all([
        prisma.$queryRaw`SELECT pg_database_size(current_database()) as size`,
        prisma.$queryRaw`
          SELECT count(*) as count 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
        `,
        prisma.$queryRaw`
          SELECT count(*) as count 
          FROM pg_stat_activity 
          WHERE datname = current_database()
        `
      ]);

      const sizeBytes = Number(sizeResult[0]?.size || 0);
      const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);
      const sizeGB = (sizeBytes / (1024 * 1024 * 1024)).toFixed(2);

      return {
        size: sizeBytes > 1024 * 1024 * 1024 ? `${sizeGB} GB` : `${sizeMB} MB`,
        sizeBytes,
        tableCount: Number(tableCountResult[0]?.count || 0),
        activeConnections: Number(connectionResult[0]?.count || 0)
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      throw error;
    }
  }

  /**
   * List all available backups
   */
  async listBackups() {
    try {
      const backupDir = path.join(process.cwd(), 'backups');
      
      try {
        await fs.access(backupDir);
      } catch {
        return [];
      }

      const files = await fs.readdir(backupDir);
      const backups = await Promise.all(
        files
          .filter(file => file.startsWith('backup-'))
          .map(async (file) => {
            const filePath = path.join(backupDir, file);
            const stats = await fs.stat(filePath);
            const ext = path.extname(file);
            
            let format = 'unknown';
            if (ext === '.sql') format = 'sql';
            else if (ext === '.tar') format = 'tar';
            else if (ext === '.dump') format = 'custom';

            return {
              fileName: file,
              filePath,
              format,
              size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
              sizeBytes: stats.size,
              created: stats.birthtime,
              modified: stats.mtime
            };
          })
      );

      return backups.sort((a, b) => b.created - a.created);
    } catch (error) {
      console.error('Error listing backups:', error);
      throw error;
    }
  }
}

export default new DatabaseService();
