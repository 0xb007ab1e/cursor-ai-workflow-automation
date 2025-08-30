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
   - Or use the minified version [`cursor-auto-accept-simple.min.js`](cursor-auto-accept-simple.min.js) for faster loading
2. Paste it into the console
3. Press **Enter**

## ✅ Success Confirmation

You should see this output:
```
[autoAcceptAndAnalytics] SCRIPT LOADED AND ACTIVE! (CURSOR IDE detected)
```
Or for Windsurf:
```
[autoAcceptAndAnalytics] SCRIPT LOADED AND ACTIVE! (WINDSURF IDE detected)
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

## 🔨 Build from Source

If you want to modify the script:
1. Make changes to `cursor-auto-accept-simple.js`
2. Run `npm run build` or `node build.js` to create minified version
3. Use the generated `cursor-auto-accept-simple.min.js`

## 🆘 Need Help?

If something doesn't work:
1. Run `debugAccept()` to see what the script detects
2. Check detected IDE with `console.log(globalThis.simpleAccept.ideType)`
3. Check the [troubleshooting section](README.md#-troubleshooting) in the main README
4. Open an issue with your console output 