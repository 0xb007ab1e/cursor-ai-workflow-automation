# Cursor Auto Accept & Analytics Extension

A powerful Cursor IDE extension that automatically accepts AI suggestions with comprehensive analytics and ROI tracking.

## Features

### 🚀 Auto-Accept Functionality
- **Smart Button Detection**: Automatically detects and clicks Accept, Run, Apply, and Resume buttons
- **IDE Compatibility**: Works with both Cursor IDE and Windsurf
- **Configurable**: Enable/disable specific button types
- **Real-time Monitoring**: Continuously scans for new suggestions

### 📊 Advanced Analytics
- **File Tracking**: Monitor which files are being modified
- **Line Changes**: Track additions and deletions per file
- **Session History**: Complete session analytics with timestamps
- **Button Type Analysis**: Breakdown of different button types used

### ⚡ ROI & Productivity Tracking
- **Time Savings**: Calculate actual time saved vs manual workflow
- **Workflow Efficiency**: Measure complete AI workflow automation
- **Productivity Metrics**: Daily, weekly, and monthly projections
- **Performance Calibration**: Adjust workflow timing for accurate calculations

### 🎛️ Control Panel
- **Floating UI**: Draggable control panel with tabs
- **Real-time Status**: Live updates on running state and click count
- **Configuration**: Easy button type management
- **Export Options**: Download analytics data as JSON

## Installation

### Local Installation
1. Clone this repository
2. Run `npm install`
3. Run `npm run compile`
4. Copy the extension to your Cursor extensions folder:
   - **Windows**: `%USERPROFILE%\.cursor\extensions\`
   - **macOS**: `~/.cursor/extensions/`
   - **Linux**: `~/.cursor/extensions/`

### Manual Installation
1. Download the `.vsix` file from releases
2. In Cursor: `Ctrl+Shift+P` → "Extensions: Install from VSIX"
3. Select the downloaded file

## Usage

### Basic Commands
- **Start Auto Accept**: `Ctrl+Shift+P` → "Cursor Auto Accept: Start Auto Accept"
- **Stop Auto Accept**: `Ctrl+Shift+P` → "Cursor Auto Accept: Stop Auto Accept"
- **Show Control Panel**: `Ctrl+Shift+P` → "Cursor Auto Accept: Show Control Panel"

### Control Panel
The extension provides a floating control panel with three tabs:

#### Main Tab
- Start/Stop controls
- Real-time status
- Configuration options
- ROI summary

#### Analytics Tab
- Session statistics
- File activity tracking
- Button type breakdown
- Export/clear options

#### ROI Tab
- Complete workflow analysis
- Time savings calculations
- Productivity projections
- Manual vs automated comparison

### Configuration
Customize the extension behavior in Cursor settings:

```json
{
  "cursorAutoAccept.enabled": true,
  "cursorAutoAccept.interval": 2000,
  "cursorAutoAccept.enableAcceptAll": true,
  "cursorAutoAccept.enableAccept": true,
  "cursorAutoAccept.enableRun": true,
  "cursorAutoAccept.enableApply": true,
  "cursorAutoAccept.enableResume": true,
  "cursorAutoAccept.debugMode": false
}
```

## API Reference

### Global Functions
The extension exposes several functions in the global scope:

```javascript
// Control functions
startAccept()           // Start auto-accept
stopAccept()            // Stop auto-accept
acceptStatus()          // Get current status

// Analytics functions
exportAnalytics()       // Export data as JSON
clearAnalytics()        // Clear session data
clearStorage()          // Clear all stored data
validateData()          // Validate data integrity

// Debug functions
toggleDebug()           // Toggle debug mode
enableDebug()           // Enable debug logging
disableDebug()          // Disable debug logging

// Configuration
enableOnly(['accept', 'run'])  // Enable only specific button types
enableAll()                     // Enable all button types
disableAll()                    // Disable all button types
toggleButton('accept')          // Toggle specific button type

// Workflow calibration
calibrateWorkflow(30, 0.1)     // Set manual (30s) and auto (0.1s) workflow times
```

### ROI Calculation
The extension calculates time savings based on complete workflow automation:

- **Manual Workflow**: User prompt → Cursor generation → Watching → Finding button → Clicking → Context switching (~30s)
- **Automated Workflow**: User prompt → Cursor generation → Instant detection and clicking (~0.1s)
- **Time Saved**: Complete workflow time minus automated time

## Supported Button Types

| Button Type | Description | Default |
|-------------|-------------|---------|
| Accept All | Accept all changes in a file | ✅ |
| Accept | Accept individual changes | ✅ |
| Run | Execute generated code | ✅ |
| Apply | Apply code changes | ✅ |
| Resume | Resume conversation | ✅ |
| Connection Resume | Resume failed connections | ✅ |
| Try Again | Retry failed operations | ✅ |

## IDE Compatibility

### Cursor IDE
- Full support for all button types
- Native integration with Cursor's UI
- Optimized for Cursor's DOM structure

### Windsurf
- Full support for Windsurf's UI patterns
- Automatic detection of Windsurf environment
- Compatible with Windsurf's button classes

## Development

### Building
```bash
npm install
npm run compile
npm run watch  # For development
```

### Testing
```bash
npm run test
npm run lint
```

### Project Structure
```
src/
├── extension.ts          # Main extension entry point
├── autoAccept.ts         # Core auto-accept logic
├── analytics.ts          # Analytics and tracking
├── controlPanel.ts       # UI control panel
├── buttonDetector.ts     # Button detection logic
├── storage.ts            # Data persistence
└── utils.ts              # Utility functions
```

## Troubleshooting

### Common Issues

1. **Extension not working**
   - Check if Cursor is running
   - Verify extension is enabled
   - Check console for error messages

2. **Buttons not detected**
   - Enable debug mode: `toggleDebug()`
   - Check button type configuration
   - Verify IDE compatibility

3. **Analytics not showing**
   - Check control panel visibility
   - Verify data persistence
   - Use `validateData()` to check integrity

### Debug Mode
Enable debug mode for detailed logging:

```javascript
toggleDebug()  // Toggle debug mode
enableDebug()  // Enable debug mode
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/ivalsaraj/cursor-auto-accept-extension/issues)
- **LinkedIn**: [@ivalsaraj](https://linkedin.com/in/ivalsaraj)
- **Email**: ivan@ivalsaraj.com

## Changelog

### v1.0.0
- Initial release
- Auto-accept functionality
- Comprehensive analytics
- ROI tracking
- Control panel UI
- IDE compatibility (Cursor + Windsurf)
- Configuration options
- Data export/import
- Debug mode

---

**Created by [@ivalsaraj](https://linkedin.com/in/ivalsaraj)**

*Boost your Cursor productivity with intelligent automation and insights!*
