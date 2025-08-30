#!/bin/bash

echo "🚀 Installing Cursor AI Workflow Automation Extension..."
echo "📁 Extension path: $(pwd)"
echo "🔧 Starting Cursor IDE Extension Development Host..."

# Check if Cursor is available
if command -v cursor &> /dev/null; then
    echo "✅ Cursor IDE detected"
    CURSOR_CMD="cursor"
elif command -v cursor-ide &> /dev/null; then
    echo "✅ Cursor IDE detected (cursor-ide)"
    CURSOR_CMD="cursor-ide"
else
    echo "⚠️ Cursor IDE not found in PATH"
    echo "🔍 Checking common installation paths..."
    
    # Check common Cursor installation paths
    CURSOR_PATHS=(
        "/usr/bin/cursor"
        "/usr/local/bin/cursor"
        "/opt/Cursor/cursor"
        "$HOME/.local/bin/cursor"
        "/Applications/Cursor.app/Contents/MacOS/Cursor"
        "$HOME/AppData/Local/Programs/Cursor/Cursor.exe"
    )
    
    CURSOR_FOUND=false
    for path in "${CURSOR_PATHS[@]}"; do
        if [ -f "$path" ]; then
            echo "✅ Found Cursor at: $path"
            CURSOR_CMD="$path"
            CURSOR_FOUND=true
            break
        fi
    done
    
    if [ "$CURSOR_FOUND" = false ]; then
        echo "❌ Cursor IDE not found"
        echo "📋 Please install Cursor IDE from: https://cursor.sh"
        echo "🔧 Or try launching manually with: cursor --extensionDevelopmentPath=$(pwd) --new-window"
        exit 1
    fi
fi

# Check if Windsurf is available as alternative
if command -v windsurf &> /dev/null; then
    echo "✅ Windsurf IDE detected as alternative"
    WINDSURF_CMD="windsurf"
else
    echo "ℹ️ Windsurf IDE not detected"
fi

echo ""
echo "🎯 Choose your IDE:"
echo "1. Cursor IDE (recommended)"
echo "2. Windsurf IDE"
echo "3. Manual launch"

read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo "🚀 Launching Cursor IDE with extension..."
        $CURSOR_CMD --extensionDevelopmentPath="$(pwd)" --new-window
        ;;
    2)
        if [ -n "$WINDSURF_CMD" ]; then
            echo "🚀 Launching Windsurf IDE with extension..."
            $WINDSURF_CMD --extensionDevelopmentPath="$(pwd)" --new-window
        else
            echo "❌ Windsurf IDE not available"
            echo "🚀 Launching Cursor IDE instead..."
            $CURSOR_CMD --extensionDevelopmentPath="$(pwd)" --new-window
        fi
        ;;
    3)
        echo "📋 Manual launch instructions:"
        echo "1. Open Cursor IDE"
        echo "2. Press Ctrl+Shift+P (or Cmd+Shift+P on Mac)"
        echo "3. Type: 'Developer: Open Folder'"
        echo "4. Select this directory: $(pwd)"
        echo "5. Press F5 to run the extension"
        ;;
    *)
        echo "🚀 Launching Cursor IDE with extension..."
        $CURSOR_CMD --extensionDevelopmentPath="$(pwd)" --new-window
        ;;
esac

echo ""
echo "✅ Extension Development Host started!"
echo "📋 Next steps:"
echo "1. Press Ctrl+Shift+P to open Command Palette"
echo "2. Type 'Cursor AI Workflow Automation' to see available commands"
echo "3. Try 'Start Auto Accept' to begin testing"
echo "4. Generate AI suggestions in Cursor to test auto-accept"
echo "5. Check the Cursor AI Workflow Automation panel in the sidebar"
echo ""
echo "🎯 Extension is ready for testing!"
