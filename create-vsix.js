#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Extension details
const extensionName = 'cursor-ai-workflow-automation';
const version = '1.0.0';
const vsixFileName = `${extensionName}-${version}.vsix`;

// Files to include in the VSIX
const filesToInclude = [
  'package.json',
  'README.md',
  'LICENSE',
  'resources/icon.svg',
  'out/extension.js',
  'out/autoAccept.js',
  'out/analytics.js',
  'out/storage.js',
  'out/controlPanel.js',
  'out/buttonDetector.js'
];

// Directories to include
const dirsToInclude = [
  'out',
  'resources'
];

console.log(`Creating VSIX package: ${vsixFileName}`);

// Create a file to stream archive data to
const output = fs.createWriteStream(vsixFileName);
const archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level
});

// Listen for all archive data to be written
output.on('close', function() {
  console.log(`✅ VSIX package created successfully: ${vsixFileName}`);
  console.log(`📦 Package size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
});

// Good practice to catch warnings (ie stat failures and other non-blocking errors)
archive.on('warning', function(err) {
  if (err.code === 'ENOENT') {
    console.warn('⚠️  Warning:', err.message);
  } else {
    throw err;
  }
});

// Good practice to catch this error explicitly
archive.on('error', function(err) {
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Add files to the archive with extension/ prefix
filesToInclude.forEach(file => {
  if (fs.existsSync(file)) {
    const extensionPath = `extension/${file}`;
    console.log(`📁 Adding file: ${extensionPath}`);
    archive.file(file, { name: extensionPath });
  } else {
    console.warn(`⚠️  File not found: ${file}`);
  }
});

// Add directories to the archive with extension/ prefix
dirsToInclude.forEach(dir => {
  if (fs.existsSync(dir)) {
    const extensionPath = `extension/${dir}`;
    console.log(`📁 Adding directory: ${extensionPath}`);
    archive.directory(dir, extensionPath);
  } else {
    console.warn(`⚠️  Directory not found: ${dir}`);
  }
});

// Finalize the archive (ie we are done appending files but streams have to finish yet)
archive.finalize();
