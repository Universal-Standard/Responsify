#!/usr/bin/env node

/**
 * Database Restore Script
 * 
 * This script restores a PostgreSQL database from a backup file.
 * 
 * Usage:
 *   npm run db:restore -- path/to/backup.sql
 *   node scripts/restore-db.js path/to/backup.sql
 * 
 * Environment Variables Required:
 *   DATABASE_URL - PostgreSQL connection URL
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { access } from 'fs/promises';
import { URL } from 'url';

const execAsync = promisify(exec);

async function restoreDatabase() {
  try {
    const backupFile = process.argv[2];
    
    if (!backupFile) {
      console.error('❌ Please provide a backup file path');
      console.error('Usage: npm run db:restore -- path/to/backup.sql');
      process.exit(1);
    }

    // Check if backup file exists
    try {
      await access(backupFile);
    } catch {
      console.error(`❌ Backup file not found: ${backupFile}`);
      process.exit(1);
    }

    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      console.error('❌ DATABASE_URL environment variable is not set');
      process.exit(1);
    }

    // Parse database URL
    const dbUrl = new URL(databaseUrl);
    const host = dbUrl.hostname;
    const port = dbUrl.port || '5432';
    const database = dbUrl.pathname.slice(1);
    const username = dbUrl.username;
    const password = dbUrl.password;

    console.log('⚠️  WARNING: This will overwrite the current database!');
    console.log(`   Database: ${database}`);
    console.log(`   Host: ${host}:${port}`);
    console.log(`   Backup file: ${backupFile}`);
    console.log('');
    
    // In production, you might want to add a confirmation prompt here
    if (process.env.NODE_ENV === 'production') {
      console.log('❌ Database restore is disabled in production for safety');
      console.log('   Please restore manually if needed');
      process.exit(1);
    }

    console.log('🔄 Starting database restore...');

    // Set PostgreSQL password environment variable
    const env = { ...process.env, PGPASSWORD: password };

    // Execute psql to restore
    const command = `psql -h ${host} -p ${port} -U ${username} -d ${database} -f "${backupFile}"`;
    
    await execAsync(command, { env });

    console.log('✅ Database restore completed successfully!');

  } catch (error) {
    console.error('❌ Database restore failed:', error);
    process.exit(1);
  }
}

// Run restore
restoreDatabase();
