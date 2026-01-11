#!/usr/bin/env node

/**
 * Database Backup Script
 * 
 * This script creates a backup of the PostgreSQL database using pg_dump.
 * 
 * Usage:
 *   npm run db:backup
 *   node scripts/backup-db.js
 * 
 * Environment Variables Required:
 *   DATABASE_URL - PostgreSQL connection URL
 *   BACKUP_DIR - Directory to store backups (optional, defaults to ./backups)
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { mkdir, access } from 'fs/promises';
import { join } from 'path';
import { URL } from 'url';

const execAsync = promisify(exec);

async function backupDatabase() {
  try {
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

    // Setup backup directory
    const backupDir = process.env.BACKUP_DIR || join(process.cwd(), 'backups');
    
    try {
      await access(backupDir);
    } catch {
      await mkdir(backupDir, { recursive: true });
      console.log(`✅ Created backup directory: ${backupDir}`);
    }

    // Create backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const time = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
    const backupFile = join(backupDir, `backup-${timestamp}-${time}.sql`);

    console.log('🔄 Starting database backup...');
    console.log(`   Database: ${database}`);
    console.log(`   Host: ${host}:${port}`);
    console.log(`   Backup file: ${backupFile}`);

    // Set PostgreSQL password environment variable
    const env = { ...process.env, PGPASSWORD: password };

    // Execute pg_dump
    const command = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -F p -f "${backupFile}"`;
    
    await execAsync(command, { env });

    console.log('✅ Database backup completed successfully!');
    console.log(`   File: ${backupFile}`);

    // Optional: Compress the backup
    if (process.argv.includes('--compress')) {
      console.log('🔄 Compressing backup...');
      await execAsync(`gzip "${backupFile}"`);
      console.log(`✅ Backup compressed: ${backupFile}.gz`);
    }

  } catch (error) {
    console.error('❌ Database backup failed:', error);
    process.exit(1);
  }
}

// Run backup
backupDatabase();
