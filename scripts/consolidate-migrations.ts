#!/usr/bin/env tsx

/**
 * Migration Consolidation Script
 * 
 * This script helps consolidate all existing migrations into a single clean migration.
 * Run this after ensuring the database is in the desired state.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 Starting migration consolidation...\n');

try {
  // Step 1: Check current migration status
  console.log('📊 Checking current migration status...');
  const status = execSync('pnpm prisma migrate status', { encoding: 'utf8' });
  console.log(status);

  // Step 2: Create a backup of current migrations
  console.log('\n💾 Creating backup of current migrations...');
  const backupDir = path.join(__dirname, '../prisma/migrations_backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const migrationsDir = path.join(__dirname, '../prisma/migrations');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `migrations_backup_${timestamp}`);
  
  execSync(`cp -r "${migrationsDir}" "${backupPath}"`);
  console.log(`✅ Migrations backed up to: ${backupPath}`);

  // Step 3: Reset migrations (this will remove all migration files)
  console.log('\n🗑️  Removing existing migration files...');
  const migrationFiles = fs.readdirSync(migrationsDir);
  migrationFiles.forEach(file => {
    if (file !== 'migration_lock.toml') {
      const filePath = path.join(migrationsDir, file);
      if (fs.statSync(filePath).isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true });
      }
    }
  });
  console.log('✅ Existing migration files removed');

  // Step 4: Create a new consolidated migration
  console.log('\n🆕 Creating consolidated migration...');
  execSync('pnpm prisma migrate dev --name consolidated_schema', { stdio: 'inherit' });
  
  console.log('\n✅ Migration consolidation completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Review the new consolidated migration');
  console.log('2. Test the application to ensure everything works');
  console.log('3. Update the README with the new migration structure');
  console.log('4. Commit the changes');
  
} catch (error) {
  console.error('❌ Error during migration consolidation:', error);
  process.exit(1);
} 