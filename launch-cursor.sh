#!/bin/bash

echo "🚀 Launching Cursor IDE with Cursor AI Workflow Automation Extension..."

# Check if Cursor is available
if command -v cursor &> /dev/null; then
    echo "✅ Cursor IDE detected"
    CURSOR_CMD="cursor"
elif command -v cursor-ide &> /dev/null; then
    echo "✅ Cursor IDE detected (cursor-ide)"
    CURSOR_CMD="cursor-ide"
else
    echo "❌ Cursor IDE not found in PATH"
    echo "📋 Please install Cursor IDE from: https://cursor.sh"
    exit 1
fi

echo "🔧 Starting Cursor IDE Extension Development Host..."
$CURSOR_CMD --extensionDevelopmentPath="$(pwd)" --new-window

echo "✅ Cursor IDE launched with extension!"
echo "📋 Next steps:"
echo "1. Press Ctrl+Shift+P to open Command Palette"
echo "2. Type 'Cursor AI Workflow Automation' to see available commands"
echo "3. Try 'Start Auto Accept' to begin testing"
echo "4. Generate AI suggestions in Cursor to test auto-accept"
echo "5. Check the Cursor AI Workflow Automation panel in the sidebar"
