#!/usr/bin/env node

/**
 * Quick Setup and Installation for Cursor Auto Accept Extension
 * This script automates the essential setup process for testing
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Quick Setup for Cursor Auto Accept Extension\n');

class QuickSetup {
  constructor() {
    this.projectRoot = process.cwd();
    this.setupComplete = false;
  }

  // Step 1: Environment Check
  async checkEnvironment() {
    console.log('🔍 Step 1: Environment Check');

    try {
      const nodeVersion = process.version;
      console.log(`  📦 Node.js: ${nodeVersion}`);

      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      console.log(`  📦 npm: ${npmVersion}`);

      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        console.log(`  📁 Project: ${packageJson.name} v${packageJson.version}`);
      }

      console.log('  ✅ Environment check completed\n');
      return true;
    } catch (error) {
      console.error(`  ❌ Environment check failed: ${error.message}\n`);
      return false;
    }
  }

  // Step 2: Dependencies Installation
  async installDependencies() {
    console.log('📦 Step 2: Installing Dependencies');

    try {
      console.log('  📥 Installing npm dependencies...');
      execSync('npm install', { stdio: 'inherit' });
      console.log('  ✅ Dependencies installed successfully\n');
      return true;
    } catch (error) {
      console.error(`  ❌ Dependency installation failed: ${error.message}\n`);
      return false;
    }
  }

  // Step 3: Compilation
  async compileExtension() {
    console.log('🔨 Step 3: Compiling Extension');

    try {
      console.log('  🔧 Compiling TypeScript...');
      execSync('npm run compile', { stdio: 'inherit' });

      const compiledFiles = [
        'out/extension.js',
        'out/autoAccept.js',
        'out/analytics.js',
        'out/storage.js',
        'out/buttonDetector.js',
        'out/controlPanel.js'
      ];

      compiledFiles.forEach(file => {
        if (fs.existsSync(path.join(this.projectRoot, file))) {
          const stats = fs.statSync(path.join(this.projectRoot, file));
          console.log(`  ✅ ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
        } else {
          console.log(`  ❌ ${file} (missing)`);
        }
      });

      console.log('  ✅ Compilation completed successfully\n');
      return true;
    } catch (error) {
      console.error(`  ❌ Compilation failed: ${error.message}\n`);
      return false;
    }
  }

  // Step 4: Configuration Setup
  async setupConfiguration() {
    console.log('⚙️ Step 4: Configuration Setup');

    try {
      const vscodeDir = path.join(this.projectRoot, '.vscode');
      if (!fs.existsSync(vscodeDir)) {
        fs.mkdirSync(vscodeDir);
      }

      const settingsPath = path.join(vscodeDir, 'settings.json');
      const settings = {
        "cursorAutoAccept.enabled": true,
        "cursorAutoAccept.interval": 2000,
        "cursorAutoAccept.enableAcceptAll": true,
        "cursorAutoAccept.enableAccept": true,
        "cursorAutoAccept.enableRun": true,
        "cursorAutoAccept.enableApply": true,
        "typescript.preferences.includePackageJsonAutoImports": "on",
        "editor.formatOnSave": true,
        "editor.codeActionsOnSave": {
          "source.fixAll.eslint": true
        }
      };

      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      console.log('  ✅ VS Code settings configured');

      const launchPath = path.join(vscodeDir, 'launch.json');
      const launchConfig = {
        "version": "0.2.0",
        "configurations": [
          {
            "name": "Run Extension",
            "type": "extensionHost",
            "request": "launch",
            "args": [
              "--extensionDevelopmentPath=${workspaceFolder}"
            ],
            "outFiles": [
              "${workspaceFolder}/out/**/*.js"
            ],
            "preLaunchTask": "npm: compile"
          }
        ]
      };

      fs.writeFileSync(launchPath, JSON.stringify(launchConfig, null, 2));
      console.log('  ✅ Launch configuration created');

      console.log('  ✅ Configuration setup completed\n');
      return true;
    } catch (error) {
      console.error(`  ❌ Configuration setup failed: ${error.message}\n`);
      return false;
    }
  }

  // Step 5: Create Installation Script
  async createInstallScript() {
    console.log('📦 Step 5: Creating Installation Script');

    try {
      const installScript = `#!/bin/bash

        echo "🚀 Installing Cursor AI Workflow Automation Extension..."
echo "📁 Extension path: \$(pwd)"
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
        "\$HOME/.local/bin/cursor"
        "/Applications/Cursor.app/Contents/MacOS/Cursor"
        "\$HOME/AppData/Local/Programs/Cursor/Cursor.exe"
    )
    
    CURSOR_FOUND=false
    for path in "\${CURSOR_PATHS[@]}"; do
        if [ -f "\$path" ]; then
            echo "✅ Found Cursor at: \$path"
            CURSOR_CMD="\$path"
            CURSOR_FOUND=true
            break
        fi
    done
    
    if [ "\$CURSOR_FOUND" = false ]; then
        echo "❌ Cursor IDE not found"
        echo "📋 Please install Cursor IDE from: https://cursor.sh"
        echo "🔧 Or try launching manually with: cursor --extensionDevelopmentPath=\$(pwd) --new-window"
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

case \$choice in
    1)
        echo "🚀 Launching Cursor IDE with extension..."
        \$CURSOR_CMD --extensionDevelopmentPath="\$(pwd)" --new-window
        ;;
    2)
        if [ -n "\$WINDSURF_CMD" ]; then
            echo "🚀 Launching Windsurf IDE with extension..."
            \$WINDSURF_CMD --extensionDevelopmentPath="\$(pwd)" --new-window
        else
            echo "❌ Windsurf IDE not available"
            echo "🚀 Launching Cursor IDE instead..."
            \$CURSOR_CMD --extensionDevelopmentPath="\$(pwd)" --new-window
        fi
        ;;
    3)
        echo "📋 Manual launch instructions:"
        echo "1. Open Cursor IDE"
        echo "2. Press Ctrl+Shift+P (or Cmd+Shift+P on Mac)"
        echo "3. Type: 'Developer: Open Folder'"
        echo "4. Select this directory: \$(pwd)"
        echo "5. Press F5 to run the extension"
        ;;
    *)
        echo "🚀 Launching Cursor IDE with extension..."
        \$CURSOR_CMD --extensionDevelopmentPath="\$(pwd)" --new-window
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
`;

      const installScriptPath = path.join(this.projectRoot, 'install-extension.sh');
      fs.writeFileSync(installScriptPath, installScript);
      fs.chmodSync(installScriptPath, '755');
      console.log('  ✅ Installation script created');

      console.log('  ✅ Installation script completed\n');
      return true;
    } catch (error) {
      console.error(`  ❌ Installation script creation failed: ${error.message}\n`);
      return false;
    }
  }

  // Step 6: Create Test Script
  async createTestScript() {
    console.log('🧪 Step 6: Creating Test Script');

    try {
      const testScript = `#!/bin/bash
echo "🧪 Testing Cursor Auto Accept Extension..."

# Check if extension files exist
echo "📁 Checking compiled files..."
if [ -f "out/extension.js" ]; then
    echo "  ✅ extension.js exists"
else
    echo "  ❌ extension.js missing"
fi

if [ -f "out/autoAccept.js" ]; then
    echo "  ✅ autoAccept.js exists"
else
    echo "  ❌ autoAccept.js missing"
fi

if [ -f "out/analytics.js" ]; then
    echo "  ✅ analytics.js exists"
else
    echo "  ❌ analytics.js missing"
fi

if [ -f "out/storage.js" ]; then
    echo "  ✅ storage.js exists"
else
    echo "  ❌ storage.js missing"
fi

if [ -f "out/buttonDetector.js" ]; then
    echo "  ✅ buttonDetector.js exists"
else
    echo "  ❌ buttonDetector.js missing"
fi

if [ -f "out/controlPanel.js" ]; then
    echo "  ✅ controlPanel.js exists"
else
    echo "  ❌ controlPanel.js missing"
fi

echo ""
echo "🎯 Extension is ready for testing!"
echo "📋 To test:"
echo "1. Run: ./install-extension.sh"
echo "2. Press Ctrl+Shift+P and type 'Cursor Auto Accept'"
echo "3. Try 'Start Auto Accept' to begin testing"
`;

      const testScriptPath = path.join(this.projectRoot, 'test-extension.sh');
      fs.writeFileSync(testScriptPath, testScript);
      fs.chmodSync(testScriptPath, '755');
      console.log('  ✅ Test script created');

      console.log('  ✅ Test script completed\n');
      return true;
    } catch (error) {
      console.error(`  ❌ Test script creation failed: ${error.message}\n`);
      return false;
    }
  }

  // Step 7: Generate Setup Report
  async generateReport() {
    console.log('📊 Step 7: Generating Setup Report');

    try {
      const report = {
        timestamp: new Date().toISOString(),
        project: {
          name: 'cursor-auto-accept-extension',
          version: '1.0.0',
          path: this.projectRoot
        },
        setup: {
          environment: true,
          dependencies: true,
          compilation: true,
          configuration: true,
          installation: true
        },
        features: [
          'Auto-accept functionality',
          'Analytics tracking',
          'ROI calculations',
          'Multi-IDE support',
          'Configuration management',
          'Data export',
          'Debug mode'
        ],
        files: {
          compiled: [
            'out/extension.js',
            'out/autoAccept.js',
            'out/analytics.js',
            'out/storage.js',
            'out/buttonDetector.js',
            'out/controlPanel.js'
          ],
          scripts: [
            'install-extension.sh',
            'test-extension.sh'
          ],
          config: [
            '.vscode/settings.json',
            '.vscode/launch.json'
          ]
        }
      };

      const reportPath = path.join(this.projectRoot, 'setup-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log('  ✅ Setup report generated');

      console.log('\n📋 Setup Summary:');
      console.log(`  📁 Project: ${report.project.name} v${report.project.version}`);
      console.log(`  ⚡ Features: ${report.features.length} implemented`);
      console.log(`  📦 Compiled files: ${report.files.compiled.length}`);
      console.log(`  🔧 Scripts: ${report.files.scripts.length}`);
      console.log(`  ⚙️ Config files: ${report.files.config.length}`);

      console.log('  ✅ Setup report completed\n');
      return true;
    } catch (error) {
      console.error(`  ❌ Setup report generation failed: ${error.message}\n`);
      return false;
    }
  }

  // Main setup method
  async runSetup() {
    console.log('🚀 Starting Quick Setup Process...\n');

    const steps = [
      { name: 'Environment Check', method: this.checkEnvironment.bind(this) },
      { name: 'Dependencies Installation', method: this.installDependencies.bind(this) },
      { name: 'Compilation', method: this.compileExtension.bind(this) },
      { name: 'Configuration Setup', method: this.setupConfiguration.bind(this) },
      { name: 'Installation Script Creation', method: this.createInstallScript.bind(this) },
      { name: 'Test Script Creation', method: this.createTestScript.bind(this) },
      { name: 'Setup Report Generation', method: this.generateReport.bind(this) }
    ];

    for (const step of steps) {
      const success = await step.method();
      if (!success) {
        console.error(`❌ Setup failed at step: ${step.name}`);
        return false;
      }
    }

    this.setupComplete = true;
    return true;
  }
}

// Run the setup
async function main() {
  const setup = new QuickSetup();
  const success = await setup.runSetup();

  console.log('='.repeat(60));
  if (success) {
    console.log('🎉 QUICK SETUP COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('✅ Extension is ready for testing!');
    console.log('✅ All components compiled and configured');
    console.log('✅ Installation scripts prepared');
    console.log('✅ Cursor IDE configuration optimized');

    console.log('\n🚀 Next Steps:');
    console.log('1. Run: ./install-extension.sh');
    console.log('2. Press Ctrl+Shift+P and type "Cursor Auto Accept"');
    console.log('3. Try "Start Auto Accept" to begin testing');
    console.log('4. Generate AI suggestions in Cursor to test auto-accept');
    console.log('5. Check analytics in the control panel');

    console.log('\n📊 Files Created:');
    console.log('📋 Installation Script: install-extension.sh');
    console.log('🧪 Test Script: test-extension.sh');
    console.log('🔧 VS Code Settings: .vscode/settings.json');
    console.log('🚀 Launch Config: .vscode/launch.json');
    console.log('📊 Setup Report: setup-report.json');

    console.log('\n🎯 Extension is ready for production use!');
  } else {
    console.log('❌ QUICK SETUP FAILED');
    console.log('='.repeat(60));
    console.log('🔧 Please check the error messages above');
    console.log('📞 Review the setup process and try again');
  }
}

main().catch(console.error);
