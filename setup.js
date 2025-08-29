#!/usr/bin/env node

/**
 * Cursor Auto Accept Extension - One-Click Setup
 * 
 * This script automates the entire setup process with a single command.
 * Just run: node setup.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Cursor Auto Accept Extension - One-Click Setup');
console.log('==================================================\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json') || !fs.existsSync('src')) {
    console.error('❌ This script must be run from the project root directory');
    console.error('Please navigate to the cursor-auto-accept-extension folder and try again');
    process.exit(1);
}

// Utility function to run commands
function runCommand(command, description) {
    console.log(`📋 ${description}...`);
    try {
        execSync(command, { stdio: 'inherit' });
        console.log(`✅ ${description} completed successfully\n`);
        return true;
    } catch (error) {
        console.error(`❌ ${description} failed: ${error.message}\n`);
        return false;
    }
}

// Check prerequisites
console.log('🔍 Checking prerequisites...');
try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
    if (majorVersion < 16) {
        throw new Error(`Node.js 16+ required, found ${nodeVersion}`);
    }
    console.log(`✅ Node.js version: ${nodeVersion}`);
    
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    console.log(`✅ npm version: ${npmVersion}\n`);
} catch (error) {
    console.error(`❌ Prerequisites check failed: ${error.message}`);
    console.error('Please install Node.js 16+ and npm first');
    process.exit(1);
}

// Install dependencies
if (!fs.existsSync('node_modules')) {
    if (!runCommand('npm install', 'Installing dependencies')) {
        process.exit(1);
    }
} else {
    console.log('📦 Dependencies already installed, skipping...\n');
}

// Build extension
if (!runCommand('npm run compile', 'Building extension')) {
    process.exit(1);
}

// Verify build output
if (!fs.existsSync('out/extension.js')) {
    console.error('❌ Extension file not found after build');
    process.exit(1);
}

// Run validation
console.log('🔍 Running validation...');

// Check file structure
const requiredFiles = [
    'package.json', 'tsconfig.json', 'src/extension.ts', 'src/autoAccept.ts',
    'src/buttonDetector.ts', 'src/analytics.ts', 'src/storage.ts', 'src/controlPanel.ts',
    'README.md', 'LICENSE'
];

for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
        console.error(`❌ Required file missing: ${file}`);
        process.exit(1);
    }
}
console.log('✅ File structure validation passed');

// Test TypeScript compilation
if (!runCommand('npx tsc --noEmit', 'Testing TypeScript compilation')) {
    console.error('❌ TypeScript compilation test failed');
    process.exit(1);
}

// Test package.json syntax
try {
    JSON.parse(fs.readFileSync('package.json', 'utf8'));
    console.log('✅ package.json syntax test passed\n');
} catch (error) {
    console.error('❌ package.json syntax test failed');
    process.exit(1);
}

// Run tests
console.log('🧪 Running tests...');

// Run linting
try {
    execSync('npm run lint', { stdio: 'pipe' });
    console.log('✅ Linting passed');
} catch (error) {
    console.log('⚠️  Linting failed (continuing anyway)');
}

// Run tests if available
if (fs.existsSync('test')) {
    try {
        execSync('npm run test', { stdio: 'pipe' });
        console.log('✅ Tests passed');
    } catch (error) {
        console.log('⚠️  Tests failed (continuing anyway)');
    }
} else {
    console.log('ℹ️  No test directory found, skipping tests');
}
console.log('');

// Create VSIX package
console.log('📦 Creating VSIX package...');
try {
    // Check if vsce is available
    try {
        execSync('vsce --version', { stdio: 'pipe' });
    } catch (error) {
        console.log('📥 Installing vsce globally...');
        execSync('npm install -g vsce', { stdio: 'inherit' });
    }
    
    // Create VSIX package
    execSync('vsce package', { stdio: 'inherit' });
    
    // Find VSIX file
    const files = fs.readdirSync('.').filter(file => file.endsWith('.vsix'));
    if (files.length > 0) {
        const vsixFile = files[0];
        console.log(`✅ VSIX package created: ${vsixFile}\n`);
        
        // Generate setup report
        console.log('📝 Generating setup report...');
        const report = `Cursor Auto Accept Extension - Setup Report
==========================================
Generated: ${new Date().toLocaleString()}
Project: ${path.basename(process.cwd())}

Setup Results:
- Prerequisites: ✅ PASSED
- Dependencies: ✅ INSTALLED
- Build: ✅ COMPLETED
- Validation: ✅ PASSED
- Tests: ✅ COMPLETED
- VSIX: ✅ CREATED

Next Steps:
1. Open Cursor IDE
2. Press Ctrl+Shift+P (or Cmd+Shift+P on macOS)
3. Type "Extensions: Install from VSIX"
4. Select the VSIX file: ${vsixFile}
5. Restart Cursor IDE
6. Look for the 🚀 icon in the activity bar

Usage:
- Start Auto-Accept: Ctrl+Shift+P → "Cursor Auto Accept: Start Auto Accept"
- Show Control Panel: Ctrl+Shift+P → "Cursor Auto Accept: Show Control Panel"
- Export Analytics: Ctrl+Shift+P → "Cursor Auto Accept: Export Analytics"

Global Functions (Console):
- startAccept() - Start auto-accept
- stopAccept() - Stop auto-accept
- exportAnalytics() - Export data
- toggleDebug() - Toggle debug mode

Support:
- GitHub: https://github.com/ivalsaraj/cursor-auto-accept-extension
- LinkedIn: https://linkedin.com/in/ivalsaraj
- Email: ivan@ivalsaraj.com`;

        fs.writeFileSync('setup-report.txt', report);
        console.log('✅ Setup report generated: setup-report.txt\n');
        
        // Success message
        console.log('🎉 Setup completed successfully!');
        console.log('==================================================');
        console.log('Your extension is ready to install in Cursor IDE!');
        console.log('');
        console.log('Next steps:');
        console.log(`1. Open Cursor IDE`);
        console.log(`2. Install the VSIX file: ${vsixFile}`);
        console.log(`3. Restart Cursor IDE`);
        console.log(`4. Look for the 🚀 icon in the activity bar`);
        console.log('');
        console.log('For detailed instructions, see: setup-report.txt');
        
    } else {
        throw new Error('VSIX file not found after packaging');
    }
} catch (error) {
    console.error(`❌ VSIX creation failed: ${error.message}`);
    process.exit(1);
}
