# Quick Installation Guide

## 🚀 Install in 3 Simple Steps

### Step 1: Open Developer Tools in Cursor
1. Open **Cursor IDE**
2. Click **Help** in the menu bar
3. Click **Toggle Developer Tools**
   - Alternative: Press `Cmd+Shift+I` (Mac) or `Ctrl+Shift+I` (Windows/Linux)

### Step 2: Prepare Console
1. Click the **Console** tab at the top
2. If you see a warning about pasting, type: `allow pasting` and press Enter
3. You should now see a prompt like `>`

### Step 3: Install Script
1. Copy the entire contents of [`cursor-auto-accept-simple.js`](cursor-auto-accept-simple.js)
2. Paste it into the console
3. Press **Enter**

## ✅ Success Confirmation

You should see this output:
```
[SimpleAutoAccept] Ready with full control!
Commands: startAccept(), stopAccept(), acceptStatus(), debugAccept()
Config: enableOnly([types]), enableAll(), disableAll(), toggleButton(type)
Types: "acceptAll", "accept", "run", "runCommand", "apply", "execute"
```

## 🎯 First Test

Type this in the console to test:
```javascript
acceptStatus()
```

You should see something like:
```javascript
{
  isRunning: true,
  interval: 2000,
  totalClicks: 0,
  config: { enableAcceptAll: true, enableAccept: true, ... }
}
```

## 🔄 The Script is Now Active!

- It checks for buttons every 2 seconds
- It will automatically click Accept, Run, and Apply buttons
- Watch the console for activity logs

## ⚠️ Remember

- Keep Developer Tools open while using the script
- If you restart Cursor, you'll need to reinstall the script
- Use `stopAccept()` to pause and `startAccept()` to resume

## 🆘 Need Help?

If something doesn't work:
1. Run `debugAccept()` to see what the script detects
2. Check the [troubleshooting section](README.md#-troubleshooting) in the main README
3. Open an issue with your console output 