import * as vscode from 'vscode';
import { AutoAcceptManager } from './autoAccept';
import { ControlPanel } from './controlPanel';
import { StorageManager } from './storage';
import { AnalyticsManager } from './analytics';

export function activate(context: vscode.ExtensionContext) {
  // console.log('Cursor AI Workflow Automation Extension is now active!');

  // Initialize managers
  const storageManager = new StorageManager(context);
  const analyticsManager = new AnalyticsManager(storageManager);
  const autoAcceptManager = new AutoAcceptManager(analyticsManager, storageManager);
  const controlPanel = new ControlPanel(autoAcceptManager, analyticsManager);

  // Register commands
  const startCommand = vscode.commands.registerCommand('cursor-auto-accept.start', () => {
    autoAcceptManager.start();
    vscode.window.showInformationMessage('Auto Accept started');
  });

  const stopCommand = vscode.commands.registerCommand('cursor-auto-accept.stop', () => {
    autoAcceptManager.stop();
    vscode.window.showInformationMessage('Auto Accept stopped');
  });

  const showPanelCommand = vscode.commands.registerCommand('cursor-auto-accept.showPanel', () => {
    controlPanel.show();
  });

  const exportCommand = vscode.commands.registerCommand(
    'cursor-auto-accept.exportAnalytics',
    () => {
      analyticsManager.exportData();
    }
  );

  const clearDataCommand = vscode.commands.registerCommand('cursor-auto-accept.clearData', () => {
    vscode.window
      .showWarningMessage('Are you sure you want to clear all data?', 'Yes', 'No')
      .then(selection => {
        if (selection === 'Yes') {
          analyticsManager.clearAllData();
          vscode.window.showInformationMessage('All data cleared');
        }
      });
  });

  const toggleDebugCommand = vscode.commands.registerCommand(
    'cursor-auto-accept.toggleDebug',
    () => {
      const isDebug = autoAcceptManager.toggleDebug();
      vscode.window.showInformationMessage(`Debug mode ${isDebug ? 'enabled' : 'disabled'}`);
    }
  );

  const calibrateCommand = vscode.commands.registerCommand(
    'cursor-auto-accept.calibrateWorkflow',
    async () => {
      const manualTime = await vscode.window.showInputBox({
        prompt: 'Enter manual workflow time in seconds (default: 30)',
        value: '30',
        validateInput: value => {
          const num = parseFloat(value);
          return isNaN(num) || num < 1 ? 'Please enter a valid number greater than 0' : null;
        },
      });

      if (manualTime) {
        const autoTime = await vscode.window.showInputBox({
          prompt: 'Enter automated workflow time in seconds (default: 0.1)',
          value: '0.1',
          validateInput: value => {
            const num = parseFloat(value);
            return isNaN(num) || num < 0.01
              ? 'Please enter a valid number greater than 0.01'
              : null;
          },
        });

        if (autoTime) {
          autoAcceptManager.calibrateWorkflowTimes(
            parseFloat(manualTime),
            parseFloat(autoTime) * 1000
          );
          vscode.window.showInformationMessage(
            `Workflow calibrated: Manual ${manualTime}s, Auto ${autoTime}s`
          );
        }
      }
    }
  );

  // Add commands to context
  context.subscriptions.push(
    startCommand,
    stopCommand,
    showPanelCommand,
    exportCommand,
    clearDataCommand,
    toggleDebugCommand,
    calibrateCommand
  );

  // Auto-start if enabled in settings
  const config = vscode.workspace.getConfiguration('cursorAutoAccept');
  if (config.get('enabled', false)) {
    // Delay start to ensure IDE is fully loaded
    setTimeout(() => {
      autoAcceptManager.start();
    }, 2000);
  }

  // Register status bar item
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = '$(check) Auto Accept';
  statusBarItem.tooltip = 'Click to show control panel';
  statusBarItem.command = 'cursor-auto-accept.showPanel';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Update status bar based on auto-accept state
  const updateStatusBar = () => {
    if (autoAcceptManager.isRunning()) {
      statusBarItem.text = '$(sync~spin) Auto Accept Running';
      statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
    } else {
      statusBarItem.text = '$(check) Auto Accept';
      statusBarItem.backgroundColor = undefined;
    }
  };

  // Listen for state changes
  autoAcceptManager.onStateChange(updateStatusBar);

  // Register webview provider for control panel
  const webviewProvider = vscode.window.registerWebviewViewProvider(
    'cursorAutoAcceptView',
    controlPanel
  );
  context.subscriptions.push(webviewProvider);

  // Inject script into webview when it becomes visible
  // Note: onDidChangeWebviewViewVisibility is not available in current VS Code API
  // The control panel will handle its own initialization

  // Expose global functions for console access
  const globalState = {
    startAccept: () => autoAcceptManager.start(),
    stopAccept: () => autoAcceptManager.stop(),
    acceptStatus: () => autoAcceptManager.getStatus(),
    exportAnalytics: () => analyticsManager.exportData(),
    clearAnalytics: () => analyticsManager.clearAllData(),
    clearStorage: () => storageManager.clearAllData(),
    validateData: () => analyticsManager.validateData(),
    toggleDebug: () => autoAcceptManager.toggleDebug(),
    enableDebug: () => autoAcceptManager.setDebugMode(true),
    disableDebug: () => autoAcceptManager.setDebugMode(false),
    calibrateWorkflow: (manual: number, auto: number) =>
      autoAcceptManager.calibrateWorkflowTimes(manual, auto * 1000),
    showAnalytics: () => controlPanel.showAnalyticsTab(),
    enableOnly: (types: string[]) => autoAcceptManager.enableOnly(types),
    enableAll: () => autoAcceptManager.enableAll(),
    disableAll: () => autoAcceptManager.disableAll(),
    toggleButton: (type: string) => autoAcceptManager.toggleButton(type),
    enableButton: (type: string) => autoAcceptManager.enableButton(type),
    disableButton: (type: string) => autoAcceptManager.disableButton(type),
    findDiffs: () => autoAcceptManager.findDiffBlocks(),
    getContext: () => autoAcceptManager.getConversationContext(),
    logActivity: () => autoAcceptManager.logConversationActivity(),
    recentDiffs: (maxAge?: number) => autoAcceptManager.findRecentDiffBlocks(maxAge),
  };

  // Make functions available in global scope for console access
  if (typeof globalThis !== 'undefined') {
    (globalThis as any).cursorAutoAccept = globalState;
  } else if (typeof global !== 'undefined') {
    (global as any).cursorAutoAccept = globalState;
  } else if (typeof window !== 'undefined') {
    (window as any).cursorAutoAccept = globalState;
  }

  // Log available commands
  // console.log('Cursor Auto Accept Extension activated with commands:');
  // console.log('- startAccept() - Start auto-accept');
  // console.log('- stopAccept() - Stop auto-accept');
  // console.log('- acceptStatus() - Get current status');
  // console.log('- exportAnalytics() - Export analytics data');
  // console.log('- clearAnalytics() - Clear session data');
  // console.log('- toggleDebug() - Toggle debug mode');
  // console.log('- calibrateWorkflow(manual, auto) - Calibrate workflow times');
  // console.log('- showAnalytics() - Show analytics tab');
  // console.log('- enableOnly([types]) - Enable only specific button types');
  // console.log('- findDiffs() - Find diff blocks in conversation');
  // console.log('- getContext() - Get conversation context');

  // Show welcome message
  // Temporarily commented out to fix test issues
  // vscode.window
  //   .showInformationMessage(
  //     'Cursor Auto Accept Extension loaded! Use the status bar item or commands to control.',
  //     'Show Panel'
  //   )
  //   .then(selection => {
  //     if (selection === 'Show Panel') {
  //       controlPanel.show();
  //     }
  //   });
}

export function deactivate() {
  // Extension deactivated
}
