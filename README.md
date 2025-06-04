# Cursor Auto-Accept Script

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Cursor](https://img.shields.io/badge/Cursor-Compatible-blue.svg)](https://cursor.sh/)

An intelligent auto-clicking script for Cursor IDE that automatically accepts AI suggestions, runs commands, and handles various action buttons. Perfect for streamlining your AI-assisted coding workflow.
![](auto-accept-demo.png)
## ✨ Features

- 🎯 **Smart Button Detection** - Automatically finds and clicks Accept, Run, Apply buttons
- ⚙️ **Granular Control** - Enable/disable specific button types on demand
- 🔄 **Real-time Configuration** - Change settings without restarting
- 📊 **Activity Monitoring** - Track clicks and script status
- 🛡️ **Safe Operation** - Respects visibility and clickability checks
- 🔧 **Debug Mode** - Troubleshoot button detection issues

## 🚀 Quick Start

### Step 1: Open Cursor Developer Tools

1. Open **Cursor IDE**
2. Go to **Help** → **Toggle Developer Tools** (or press `Cmd+Shift+I` / `Ctrl+Shift+I`)
3. Click on the **Console** tab
4. If you see a message about restricted mode, type: `allow pasting` and press Enter

### Step 2: Install the Script

Copy and paste the entire script from [`cursor-auto-accept-simple.js`](cursor-auto-accept-simple.js) into the console and press Enter.

You should see:
```
[SimpleAutoAccept] Ready with full control!
Commands: startAccept(), stopAccept(), acceptStatus(), debugAccept()
Config: enableOnly([types]), enableAll(), disableAll(), toggleButton(type)
Types: "acceptAll", "accept", "run", "runCommand", "apply", "execute"
```

### Step 3: Start Using

The script starts automatically! It will now detect and click supported buttons every 2 seconds.

## 📚 Usage Guide

### Basic Commands

```javascript
// Control the script
startAccept()    // Start auto-clicking
stopAccept()     // Stop auto-clicking
acceptStatus()   // Check current status
debugAccept()    // Debug button detection
```

### Button Type Control

#### Enable Only Specific Buttons
```javascript
enableOnly(['accept'])                    // Only Accept buttons
enableOnly(['run'])                       // Only Run buttons
enableOnly(['accept', 'run'])             // Accept and Run buttons
enableOnly(['acceptAll'])                 // Only Accept All buttons
enableOnly(['run', 'runCommand'])         // All Run-type buttons
```

#### Individual Button Control
```javascript
enableButton('run')                       // Enable Run buttons
disableButton('accept')                   // Disable Accept buttons
toggleButton('acceptAll')                 // Toggle Accept All on/off
```

#### Bulk Operations
```javascript
enableAll()                               // Enable all button types
disableAll()                              // Disable all (pause clicking)
```

### Supported Button Types

| Type | Description | Example Buttons |
|------|-------------|-----------------|
| `acceptAll` | Accept all suggestions | "Accept all ⌘⏎" |
| `accept` | Accept single suggestion | "Accept" |
| `run` | Run/execute code | "Run" |
| `runCommand` | Run specific commands | "Run command" |
| `apply` | Apply changes | "Apply" |
| `execute` | Execute operations | "Execute" |

## 💡 Common Use Cases

### For AI Code Generation
```javascript
// Only auto-accept AI suggestions
enableOnly(['accept', 'acceptAll'])
```

### For Terminal/Command Execution
```javascript
// Only auto-run commands
enableOnly(['run', 'runCommand'])
```

### For Code Reviews
```javascript
// Only apply changes, no auto-execution
enableOnly(['apply'])
```

### Temporary Pause
```javascript
disableAll()          // Pause all clicking
// ... do manual work ...
enableAll()           // Resume all clicking
```

## 🔧 Configuration Examples

### Scenario 1: Safe Mode (Accept Only)
```javascript
enableOnly(['accept', 'acceptAll'])
startAccept()
```

### Scenario 2: Full Automation
```javascript
enableAll()
startAccept()
```

### Scenario 3: Development Mode (No Auto-Run)
```javascript
enableOnly(['accept', 'acceptAll', 'apply'])
disableButton('run')
disableButton('runCommand')
```

### Scenario 4: Toggle Run Commands
```javascript
toggleButton('run')        // Turn run buttons on/off
acceptStatus()             // Check current state
```

## 📊 Monitoring

### Check Script Status
```javascript
acceptStatus()
```

**Returns:**
```javascript
{
  isRunning: true,
  interval: 2000,
  totalClicks: 15,
  config: {
    enableAcceptAll: true,
    enableAccept: true,
    enableRun: false,
    enableRunCommand: false,
    enableApply: true,
    enableExecute: true
  }
}
```

### Debug Button Detection
```javascript
debugAccept()
```

**Sample Output:**
```
[AutoAccept] 2025-01-04T11:24:47.518Z - === DEBUG SEARCH ===
[AutoAccept] 2025-01-04T11:24:47.519Z - Input box found, checking siblings...
[AutoAccept] 2025-01-04T11:24:47.520Z - Sibling 1: DIV hide-if-empty
[AutoAccept] 2025-01-04T11:24:47.521Z -   Text: "Accept all ⌘⏎"
[AutoAccept] 2025-01-04T11:24:47.522Z -   >>> Contains patterns: accept
[AutoAccept] 2025-01-04T11:24:47.523Z -   Found 1 clickable buttons!
[AutoAccept] 2025-01-04T11:24:47.524Z -     Button 1: "Accept all ⌘⏎"
```

## 🛠️ Troubleshooting

### Script Not Finding Buttons
1. Run `debugAccept()` to see what's detected
2. Check if buttons are visible on screen
3. Verify button text matches supported patterns

### Console Logs Not Showing
1. Check console filter settings (enable "Info" and "Log")
2. Clear console and reload script
3. Ensure you're in the main Cursor window console

### Script Stops Working
1. Check if Cursor was restarted (script needs reinstalling)
2. Run `acceptStatus()` to verify script is running
3. Restart with `startAccept()`

### Buttons Being Clicked Too Fast/Slow
```javascript
// Change check interval (in milliseconds)
globalThis.simpleAccept.interval = 1000  // Check every 1 second
globalThis.simpleAccept.interval = 5000  // Check every 5 seconds
```

## ⚠️ Important Notes

- **Script is session-based**: Reloading Cursor requires reinstalling the script
- **Developer Tools must stay open**: Script runs in the console context
- **Visual confirmation**: Watch the console for click confirmations
- **Safe by design**: Only clicks visible, enabled buttons

## 🔒 Security & Safety

- Script only interacts with Cursor's UI elements
- No external network requests
- No file system access
- No sensitive data handling
- Open source and auditable

## 📝 Example Session

```javascript
// 1. Install script (paste in console)
// [SimpleAutoAccept] Ready with full control!

// 2. Check what's currently enabled
acceptStatus()
// { isRunning: true, config: { enableAcceptAll: true, ... } }

// 3. Configure for safe AI assistance
enableOnly(['accept', 'acceptAll'])
// [AutoAccept] Configuration updated: Only accept, acceptAll buttons enabled

// 4. Work with AI, script auto-accepts suggestions
// [AutoAccept] Found button: Accept all ⌘⏎
// [AutoAccept] Successfully clicked accept button (Total: 1)

// 5. Switch to command mode
enableOnly(['run', 'runCommand'])
// [AutoAccept] Configuration updated: Only run, runCommand buttons enabled

// 6. Pause when needed
disableAll()
// [AutoAccept] All button types disabled

// 7. Resume
enableAll()
// [AutoAccept] All button types enabled
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Test with Cursor IDE
4. Submit a pull request

## 📄 License

MIT License - feel free to use and modify!

## 🐛 Issues & Support

- **Bug Reports**: Open an issue with console output and steps to reproduce
- **Feature Requests**: Describe your use case and desired functionality
- **Questions**: Check existing issues or start a discussion

---

**Made for the Cursor IDE community** 🚀

*Streamline your AI-assisted development workflow with intelligent auto-clicking* 