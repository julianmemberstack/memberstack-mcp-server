#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_DOCS_PATH = path.join(__dirname, '..', '..', 'docs');
const DEST_DOCS_PATH = path.join(__dirname, '..', 'docs');

async function copyDocs() {
  console.log('📚 Updating Memberstack documentation...');
  
  try {
    // Ensure destination directory exists
    await fs.mkdir(DEST_DOCS_PATH, { recursive: true });
    
    // Copy all documentation files
    await copyDirectory(SOURCE_DOCS_PATH, DEST_DOCS_PATH);
    
    console.log('✅ Documentation updated successfully!');
    console.log('📝 Next steps:');
    console.log('   1. Review the changes: git diff');
    console.log('   2. Commit the updates: git add docs && git commit -m "Update documentation"');
    console.log('   3. Release new version: npm run release');
  } catch (error) {
    console.error('❌ Error updating documentation:', error);
    process.exit(1);
  }
}

async function copyDirectory(src, dest) {
  const entries = await fs.readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await fs.mkdir(destPath, { recursive: true });
      await copyDirectory(srcPath, destPath);
    } else if (entry.name.endsWith('.md')) {
      await fs.copyFile(srcPath, destPath);
      console.log(`   📄 Copied: ${entry.name}`);
    }
  }
}

// Run the update
copyDocs();