# 🚀 Quick Start Guide

## **One-Command Setup**

### **Option 1: Node.js Script (Recommended)**
```bash
node setup.js
```

### **Option 2: NPM Scripts**
```bash
# Full automation
npm run setup

# Quick build and validation
npm run quick

# Individual steps
npm run automate:check      # Check prerequisites
npm run automate:install    # Install dependencies
npm run automate:build      # Build extension
npm run automate:validate   # Validate extension
npm run automate:package    # Create VSIX
npm run automate:full       # Run everything
```

### **Option 3: Platform-Specific Scripts**
```bash
# Linux/macOS
./scripts/setup.sh

# Windows
scripts\setup.bat
```

## **What Gets Automated**

✅ **Prerequisites Check** - Node.js 16+, npm, Cursor IDE detection  
✅ **Dependencies** - Install all required packages  
✅ **Build** - Compile TypeScript to JavaScript  
✅ **Validation** - File structure, syntax, compilation  
✅ **Testing** - Linting, tests (if available)  
✅ **Packaging** - Create VSIX installer  
✅ **Reporting** - Generate setup report with next steps  

## **After Automation**

1. **Install Extension**
   - Open Cursor IDE
   - `Ctrl+Shift+P` → "Extensions: Install from VSIX"
   - Select the generated `.vsix` file
   - Restart Cursor IDE

2. **Verify Installation**
   - Look for 🚀 icon in activity bar
   - Check Output panel for activation message
   - Use command palette: `Ctrl+Shift+P` → "Cursor Auto Accept: Show Control Panel"

3. **Start Using**
   - Click 🚀 icon to open control panel
   - Click "Start" to begin auto-accept
   - Monitor analytics and ROI in real-time

## **Troubleshooting**

### **Common Issues**

#### **"Node.js not found"**
```bash
# Install Node.js 16+ from: https://nodejs.org/
# Or use nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 16
nvm use 16
```

#### **"npm not found"**
```bash
# Usually comes with Node.js
# If missing, reinstall Node.js
```

#### **"Build failed"**
```bash
# Check TypeScript errors
npm run compile

# Clean and rebuild
rm -rf out node_modules
npm install
npm run compile
```

#### **"VSIX creation failed"**
```bash
# Install vsce globally
npm install -g vsce

# Check package.json syntax
node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))"
```

### **Manual Steps (if automation fails)**

```bash
# 1. Install dependencies
npm install

# 2. Build extension
npm run compile

# 3. Validate
npx tsc --noEmit

# 4. Create package
npm install -g vsce
vsce package

# 5. Install manually in Cursor IDE
```

## **Development Workflow**

```bash
# Watch mode for development
npm run dev

# Quick validation
npm run quick

# Full automation
npm run setup

# Package for distribution
npm run package
```

## **Global Functions (Console Access)**

Once installed, open Developer Console (`F12`) and use:

```javascript
// Control
startAccept()           // Start auto-accept
stopAccept()            // Stop auto-accept
acceptStatus()          // Check status

// Analytics
exportAnalytics()       // Export data
clearAnalytics()        // Clear data
validateData()          // Validate data integrity

// Debug
toggleDebug()           // Toggle debug mode
enableDebug()           // Enable debug mode

// Configuration
enableOnly(['accept', 'run'])  // Enable specific button types
enableAll()             // Enable all button types
disableAll()            // Disable all button types

// Workflow
calibrateWorkflow(30, 0.1)  // Set manual/auto times for ROI
```

## **Support**

- **GitHub**: https://github.com/ivalsaraj/cursor-auto-accept-extension
- **LinkedIn**: https://linkedin.com/in/ivalsaraj
- **Email**: ivan@ivalsaraj.com

## **Next Steps**

After successful setup:
1. **Test the extension** in Cursor IDE
2. **Customize settings** in VS Code preferences
3. **Monitor analytics** to track productivity gains
4. **Share feedback** and report issues on GitHub
5. **Contribute** to the project if interested

---

**Happy coding with your new Cursor Auto Accept Extension! 🎉**
