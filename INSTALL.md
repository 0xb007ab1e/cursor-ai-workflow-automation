# Installation Guide

## Prerequisites

- Cursor IDE (latest version)
- Node.js (v16 or higher)
- npm or yarn

## Local Development Installation

### 1. Clone the Repository
```bash
git clone https://github.com/ivalsaraj/cursor-auto-accept-extension.git
cd cursor-auto-accept-extension
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Build the Extension
```bash
npm run compile
```

### 4. Install in Cursor IDE

#### Option A: Development Mode (Recommended for testing)
1. Open the project in Cursor IDE
2. Press `F5` to start debugging
3. A new Cursor window will open with the extension loaded
4. The extension will appear in the activity bar (left sidebar)

#### Option B: Production Installation
1. Build the extension: `npm run compile`
2. Create a VSIX package: `npm run package` (if available)
3. In Cursor: `Ctrl+Shift+P` → "Extensions: Install from VSIX"
4. Select the generated `.vsix` file

#### Option C: Manual Copy
1. Build the extension: `npm run compile`
2. Copy the entire project folder to your Cursor extensions directory:
   - **Windows**: `%USERPROFILE%\.cursor\extensions\cursor-auto-accept-extension\`
   - **macOS**: `~/.cursor/extensions/cursor-auto-accept-extension/`
   - **Linux**: `~/.cursor/extensions/cursor-auto-accept-extension/`
3. Restart Cursor IDE

## Usage

### 1. Access the Extension
- Look for the 🚀 icon in the activity bar (left sidebar)
- Click to open the control panel
- Or use `Ctrl+Shift+P` → "Cursor Auto Accept: Show Control Panel"

### 2. Start Auto-Accept
- Click the "Start" button in the control panel
- Or use `Ctrl+Shift+P` → "Cursor Auto Accept: Start Auto Accept"

### 3. Monitor Progress
- View real-time statistics in the control panel
- Check the Analytics tab for detailed file tracking
- Review ROI calculations in the ROI tab

### 4. Stop Auto-Accept
- Click the "Stop" button in the control panel
- Or use `Ctrl+Shift+P` → "Cursor Auto Accept: Stop Auto Accept"

## Configuration

### Extension Settings
Access settings via `Ctrl+,` (or `Cmd+,` on macOS) and search for "Cursor Auto Accept":

- **Enabled**: Auto-start on Cursor launch
- **Interval**: Check frequency in milliseconds
- **Button Types**: Enable/disable specific button types
- **Debug Mode**: Enable detailed logging
- **Workflow Times**: Calibrate manual vs automated timing

### Global Functions
The extension exposes functions in the global scope for console access:

```javascript
// Control
startAccept()           // Start auto-accept
stopAccept()            // Stop auto-accept
acceptStatus()          // Get current status

// Analytics
exportAnalytics()       // Export data as JSON
clearAnalytics()        // Clear session data
validateData()          // Validate data integrity

// Debug
toggleDebug()           // Toggle debug mode
enableDebug()           // Enable debug logging

// Configuration
enableOnly(['accept', 'run'])  // Enable only specific button types
enableAll()                     // Enable all button types
disableAll()                    // Disable all button types
```

## Troubleshooting

### Extension Not Working
1. Check if Cursor is running
2. Verify extension is enabled in Extensions panel
3. Check console for error messages
4. Restart Cursor IDE

### Buttons Not Detected
1. Enable debug mode: `toggleDebug()`
2. Check button type configuration
3. Verify IDE compatibility (Cursor vs Windsurf)
4. Check console for detection logs

### Analytics Not Showing
1. Ensure control panel is visible
2. Check data persistence
3. Use `validateData()` to check integrity
4. Clear and restart if needed

### Build Errors
1. Ensure Node.js version is 16+
2. Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
3. Check TypeScript version compatibility
4. Verify VS Code extension API version

## Development

### Watch Mode
```bash
npm run watch
```

### Linting
```bash
npm run lint
```

### Testing
```bash
npm run test
```

### Packaging
```bash
npm run package
```

## Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/ivalsaraj/cursor-auto-accept-extension/issues)
- **LinkedIn**: [@ivalsaraj](https://linkedin.com/in/ivalsaraj)
- **Email**: ivan@ivalsaraj.com

## License

MIT License - see [LICENSE](LICENSE) file for details.
