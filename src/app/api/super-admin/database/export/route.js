import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { format = 'json', scope = 'all', tables = [] } = await request.json();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportDir = path.join(process.cwd(), 'exports');
    
    // Ensure export directory exists
    try {
      await fs.access(exportDir);
    } catch {
      await fs.mkdir(exportDir, { recursive: true });
    }
    
    let exportData = {};
    let filename = '';
    
    switch (scope) {
      case 'users':
        exportData = await exportUsers();
        filename = `users-export-${timestamp}.${format}`;
        break;
        
      case 'publications':
        exportData = await exportPublications();
        filename = `publications-export-${timestamp}.${format}`;
        break;
        
      case 'manuscripts':
        exportData = await exportManuscripts();
        filename = `manuscripts-export-${timestamp}.${format}`;
        break;
        
      case 'proposals':
        exportData = await exportProposals();
        filename = `proposals-export-${timestamp}.${format}`;
        break;
        
      case 'all':
        exportData = await exportAllData();
        filename = `full-export-${timestamp}.${format}`;
        break;
        
      case 'custom':
        exportData = await exportCustomTables(tables);
        filename = `custom-export-${timestamp}.${format}`;
        break;
        
      default:
        throw new Error(`Unknown export scope: ${scope}`);
    }
    
    const filepath = path.join(exportDir, filename);
    
    // Format and write data
    let fileContent = '';
    switch (format) {
      case 'json':
        fileContent = JSON.stringify(exportData, null, 2);
        break;
        
      case 'csv':
        fileContent = convertToCSV(exportData);
        break;
        
      case 'sql':
        fileContent = convertToSQL(exportData);
        break;
        
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
    
    await fs.writeFile(filepath, fileContent, 'utf8');
    
    // Get file stats
    const stats = await fs.stat(filepath);
    const sizeInKB = (stats.size / 1024).toFixed(2);
    
    return NextResponse.json({
      success: true,
      message: 'Data export completed successfully',
      export: {
        filename,
        filepath,
        format,
        scope,
        size: `${sizeInKB} KB`,
        recordCount: getRecordCount(exportData),
        createdAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Data export failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Data export failed',
      error: error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

async function exportUsers() {
  const users = await prisma.user.findMany({
    include: {
      institution: true,
      foundation: true,
      researchProfile: true,
      settings: true
    }
  });
  
  return { users };
}

async function exportPublications() {
  const publications = await prisma.publication.findMany({
    include: {
      authorRelations: {
        include: {
          user: {
            select: {
              id: true,
              givenName: true,
              familyName: true,
              email: true
            }
          }
        }
      }
    }
  });
  
  return { publications };
}

async function exportManuscripts() {
  const manuscripts = await prisma.manuscript.findMany({
    include: {
      creator: {
        select: {
          id: true,
          givenName: true,
          familyName: true,
          email: true
        }
      },
      collaborators: {
        include: {
          user: {
            select: {
              id: true,
              givenName: true,
              familyName: true,
              email: true
            }
          }
        }
      },
      citations: {
        include: {
          publication: {
            select: {
              id: true,
              title: true,
              doi: true
            }
          }
        }
      }
    }
  });
  
  return { manuscripts };
}

async function exportProposals() {
  const proposals = await prisma.proposal.findMany({
    include: {
      publications: {
        include: {
          publication: {
            select: {
              id: true,
              title: true,
              doi: true
            }
          }
        }
      },
      manuscripts: {
        include: {
          manuscript: {
            select: {
              id: true,
              title: true,
              status: true
            }
          }
        }
      }
    }
  });
  
  return { proposals };
}

async function exportAllData() {
  const [users, publications, manuscripts, proposals, campaigns, donations] = await Promise.all([
    exportUsers(),
    exportPublications(),
    exportManuscripts(),
    exportProposals(),
    prisma.campaign.findMany({ include: { category: true, activities: true, donations: true } }),
    prisma.donation.findMany({ include: { campaign: true } })
  ]);
  
  return {
    users: users.users,
    publications: publications.publications,
    manuscripts: manuscripts.manuscripts,
    proposals: proposals.proposals,
    campaigns,
    donations,
    exportMetadata: {
      timestamp: new Date().toISOString(),
      scope: 'full_database'
    }
  };
}

async function exportCustomTables(tables) {
  const data = {};
  
  for (const table of tables) {
    try {
      switch (table.toLowerCase()) {
        case 'users':
          data.users = (await exportUsers()).users;
          break;
        case 'publications':
          data.publications = (await exportPublications()).publications;
          break;
        case 'manuscripts':
          data.manuscripts = (await exportManuscripts()).manuscripts;
          break;
        case 'proposals':
          data.proposals = (await exportProposals()).proposals;
          break;
        case 'campaigns':
          data.campaigns = await prisma.campaign.findMany({ include: { category: true } });
          break;
        case 'donations':
          data.donations = await prisma.donation.findMany({ include: { campaign: true } });
          break;
        default:
          console.warn(`Unknown table for export: ${table}`);
      }
    } catch (error) {
      console.error(`Error exporting table ${table}:`, error);
    }
  }
  
  return data;
}

function convertToCSV(data) {
  // Simple CSV conversion for flat data structures
  let csv = '';
  
  for (const [tableName, records] of Object.entries(data)) {
    if (Array.isArray(records) && records.length > 0) {
      csv += `\n# ${tableName.toUpperCase()}\n`;
      
      // Get headers from first record
      const headers = Object.keys(records[0]);
      csv += headers.join(',') + '\n';
      
      // Add data rows
      records.forEach(record => {
        const values = headers.map(header => {
          const value = record[header];
          // Handle nested objects/arrays by stringifying
          if (typeof value === 'object') {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          }
          return `"${String(value).replace(/"/g, '""')}"`;
        });
        csv += values.join(',') + '\n';
      });
    }
  }
  
  return csv;
}

function convertToSQL(data) {
  // Simple SQL INSERT statements
  let sql = '-- Database Export SQL\n\n';
  
  for (const [tableName, records] of Object.entries(data)) {
    if (Array.isArray(records) && records.length > 0) {
      sql += `-- ${tableName.toUpperCase()} DATA\n`;
      
      records.forEach(record => {
        const columns = Object.keys(record).join(', ');
        const values = Object.values(record).map(value => {
          if (value === null) return 'NULL';
          if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
          if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
          return value;
        }).join(', ');
        
        sql += `INSERT INTO ${tableName} (${columns}) VALUES (${values});\n`;
      });
      
      sql += '\n';
    }
  }
  
  return sql;
}

function getRecordCount(data) {
  let total = 0;
  for (const [, records] of Object.entries(data)) {
    if (Array.isArray(records)) {
      total += records.length;
    }
  }
  return total;
}
