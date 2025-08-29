import * as vscode from 'vscode';
import { AutoAcceptManager } from './autoAccept';
import { AnalyticsManager } from './analytics';

export class ControlPanel implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private autoAcceptManager: AutoAcceptManager;
  private analyticsManager: AnalyticsManager;

  constructor(autoAcceptManager: AutoAcceptManager, analyticsManager: AnalyticsManager) {
    this.autoAcceptManager = autoAcceptManager;
    this.analyticsManager = analyticsManager;
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken
  ) {
    // Check if cancellation was requested
    if (token.isCancellationRequested) {
      return;
    }

    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [],
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(message => {
      switch (message.command) {
        case 'start':
          this.autoAcceptManager.start();
          this.updateWebview();
          break;
        case 'stop':
          this.autoAcceptManager.stop();
          this.updateWebview();
          break;
        case 'export':
          this.analyticsManager.exportData();
          break;
        case 'clear':
          this.analyticsManager.clearAllData();
          this.updateWebview();
          break;
        case 'toggleDebug':
          this.autoAcceptManager.toggleDebug();
          this.updateWebview();
          break;
        case 'calibrate':
          this.showCalibrateDialog();
          break;
        case 'switchTab':
          this.switchTab(message.tab);
          break;
      }
    });

    // Initial update
    this.updateWebview();
  }

  public show(): void {
    if (this._view) {
      this._view.show();
    }
  }

  public showAnalyticsTab(): void {
    if (this._view) {
      this._view.show();
      this.switchTab('analytics');
    }
  }

  public injectScripts(): void {
    if (this._view) {
      this._view.webview.html = this.getHtmlForWebview(this._view.webview);
    }
  }

  private switchTab(tabName: string): void {
    if (this._view) {
      this._view.webview.postMessage({ command: 'switchTab', tab: tabName });
    }
  }

  private updateWebview(): void {
    if (this._view) {
      const status = this.autoAcceptManager.getStatus();
      const analytics = this.analyticsManager.getAnalyticsData();
      const roiStats = this.analyticsManager.getROIStats();
      const sessionStats = this.analyticsManager.getSessionStats();
      const projections = this.analyticsManager.getProjections();

      this._view.webview.postMessage({
        command: 'updateData',
        data: {
          status,
          analytics,
          roiStats,
          sessionStats,
          projections,
        },
      });
    }
  }

  private async showCalibrateDialog(): Promise<void> {
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
          return isNaN(num) || num < 0.01 ? 'Please enter a valid number greater than 0.01' : null;
        },
      });

      if (autoTime) {
        this.autoAcceptManager.calibrateWorkflowTimes(
          parseFloat(manualTime),
          parseFloat(autoTime) * 1000
        );
        this.updateWebview();
        vscode.window.showInformationMessage(
          `Workflow calibrated: Manual ${manualTime}s, Auto ${autoTime}s`
        );
      }
    }
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    // Use webview parameter to ensure it's not unused
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const resourceRoots = webview.options.localResourceRoots || [];
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cursor Auto Accept</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 12px;
            color: var(--vscode-foreground);
            background: var(--vscode-editor-background);
            margin: 0;
            padding: 8px;
            overflow-x: hidden;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }

        .title {
            font-weight: 600;
            font-size: 14px;
            color: var(--vscode-titleBar-activeForeground);
        }

        .tabs {
            display: flex;
            gap: 4px;
            margin-bottom: 12px;
        }

        .tab {
            background: var(--vscode-button-secondaryBackground);
            border: 1px solid var(--vscode-button-secondaryBorder);
            color: var(--vscode-button-secondaryForeground);
            font-size: 11px;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 3px;
            transition: all 0.2s;
        }

        .tab:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }

        .tab.active {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border-color: var(--vscode-button-border);
        }

        .content {
            display: none;
        }

        .content.active {
            display: block;
        }

        .status {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 6px 8px;
            background: var(--vscode-input-background);
            border-radius: 4px;
            font-size: 11px;
        }

        .status.running {
            border-left: 3px solid var(--vscode-debugIcon-startForeground);
        }

        .status.stopped {
            border-left: 3px solid var(--vscode-errorForeground);
        }

        .controls {
            display: flex;
            gap: 6px;
            margin-bottom: 12px;
        }

        .btn {
            flex: 1;
            padding: 6px 12px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 500;
            transition: all 0.2s;
        }

        .btn-primary {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }

        .btn-primary:hover:not(:disabled) {
            background: var(--vscode-button-hoverBackground);
        }

        .btn-secondary {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }

        .btn-secondary:hover:not(:disabled) {
            background: var(--vscode-button-secondaryHoverBackground);
        }

        .btn-danger {
            background: var(--vscode-errorForeground);
            color: white;
        }

        .btn-danger:hover:not(:disabled) {
            background: var(--vscode-errorForeground);
            opacity: 0.8;
        }

        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .stats {
            background: var(--vscode-input-background);
            border-radius: 4px;
            padding: 8px;
            margin-bottom: 10px;
        }

        .stat {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
            font-size: 11px;
        }

        .stat-label {
            color: var(--vscode-descriptionForeground);
        }

        .stat-value {
            color: var(--vscode-foreground);
            font-weight: 500;
        }

        .stat-value.highlight {
            color: var(--vscode-debugIcon-startForeground);
        }

        .files-list {
            max-height: 150px;
            overflow-y: auto;
        }

        .file-item {
            padding: 4px 0;
            border-bottom: 1px solid var(--vscode-panel-border);
        }

        .file-item:last-child {
            border-bottom: none;
        }

        .file-name {
            font-size: 11px;
            color: var(--vscode-foreground);
            font-weight: 500;
            margin-bottom: 2px;
            word-break: break-all;
        }

        .file-stats {
            display: flex;
            gap: 8px;
            font-size: 10px;
            color: var(--vscode-descriptionForeground);
        }

        .file-count {
            background: var(--vscode-badge-background);
            padding: 1px 4px;
            border-radius: 2px;
            color: var(--vscode-badge-foreground);
        }

        .file-changes {
            color: var(--vscode-textLink-foreground);
        }

        .no-files {
            color: var(--vscode-descriptionForeground);
            font-size: 11px;
            text-align: center;
            padding: 20px;
        }

        .actions {
            display: flex;
            gap: 6px;
            margin-bottom: 10px;
        }

        .credits {
            text-align: center;
            padding: 8px;
            border-top: 1px solid var(--vscode-panel-border);
            color: var(--vscode-descriptionForeground);
            font-size: 10px;
        }

        .credits a {
            color: var(--vscode-textLink-foreground);
            text-decoration: none;
        }

        .credits a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">🚀 Cursor Auto Accept</div>
    </div>

    <div class="tabs">
        <button class="tab active" data-tab="main">Main</button>
        <button class="tab" data-tab="analytics">Analytics</button>
        <button class="tab" data-tab="roi">ROI</button>
    </div>

    <!-- Main Tab -->
    <div id="main" class="content active">
        <div class="status" id="status">
            <span class="status-text">Stopped</span>
            <span class="clicks">0 clicks</span>
        </div>

        <div class="controls">
            <button class="btn btn-primary" id="startBtn">Start</button>
            <button class="btn btn-danger" id="stopBtn" disabled>Stop</button>
        </div>

        <div class="stats">
            <div class="stat">
                <span class="stat-label">Session Duration:</span>
                <span class="stat-value" id="sessionDuration">0min</span>
            </div>
            <div class="stat">
                <span class="stat-label">Total Accepts:</span>
                <span class="stat-value" id="totalAccepts">0</span>
            </div>
            <div class="stat">
                <span class="stat-label">Files Modified:</span>
                <span class="stat-value" id="filesModified">0</span>
            </div>
        </div>

        <div class="actions">
            <button class="btn btn-secondary" id="toggleDebugBtn">Toggle Debug</button>
            <button class="btn btn-secondary" id="calibrateBtn">Calibrate</button>
        </div>

        <div class="credits">
            Created by <a href="https://linkedin.com/in/ivalsaraj" target="_blank">@ivalsaraj</a>
        </div>
    </div>

    <!-- Analytics Tab -->
    <div id="analytics" class="content">
        <div class="stats">
            <h4 style="margin: 0 0 8px 0; font-size: 12px;">📊 Session Analytics</h4>
            <div class="stat">
                <span class="stat-label">Session Duration:</span>
                <span class="stat-value" id="analyticsDuration">0min</span>
            </div>
            <div class="stat">
                <span class="stat-label">Total Accepts:</span>
                <span class="stat-value" id="analyticsAccepts">0</span>
            </div>
            <div class="stat">
                <span class="stat-label">Files Modified:</span>
                <span class="stat-value" id="analyticsFiles">0</span>
            </div>
            <div class="stat">
                <span class="stat-label">Lines Added:</span>
                <span class="stat-value highlight" id="linesAdded">+0</span>
            </div>
            <div class="stat">
                <span class="stat-label">Lines Deleted:</span>
                <span class="stat-value" id="linesDeleted">-0</span>
            </div>
        </div>

        <div class="stats">
            <h4 style="margin: 0 0 8px 0; font-size: 12px;">🎯 Button Types</h4>
            <div id="buttonTypes"></div>
        </div>

        <div class="stats">
            <h4 style="margin: 0 0 8px 0; font-size: 12px;">📁 File Activity</h4>
            <div class="files-list" id="filesList">
                <div class="no-files">No files modified yet</div>
            </div>
        </div>

        <div class="actions">
            <button class="btn btn-secondary" id="exportBtn">Export Data</button>
            <button class="btn btn-danger" id="clearBtn">Clear Data</button>
        </div>

        <div class="credits">
            Created by <a href="https://linkedin.com/in/ivalsaraj" target="_blank">@ivalsaraj</a>
        </div>
    </div>

    <!-- ROI Tab -->
    <div id="roi" class="content">
        <div class="stats">
            <h4 style="margin: 0 0 8px 0; font-size: 12px;">⚡ Complete Workflow ROI</h4>
            <div style="font-size: 10px; color: var(--vscode-descriptionForeground); margin-bottom: 8px; line-height: 1.3;">
                Measures complete AI workflow: User prompt → Cursor generation → Manual watching/clicking vs Auto-acceptance
            </div>
            <div class="stat">
                <span class="stat-label">Total Time Saved:</span>
                <span class="stat-value highlight" id="timeSaved">0s</span>
            </div>
            <div class="stat">
                <span class="stat-label">Session Duration:</span>
                <span class="stat-value" id="roiDuration">0s</span>
            </div>
            <div class="stat">
                <span class="stat-label">Avg. per Click:</span>
                <span class="stat-value" id="avgTimePerClick">0s</span>
            </div>
            <div class="stat">
                <span class="stat-label">Workflow Efficiency:</span>
                <span class="stat-value highlight" id="workflowEfficiency">0%</span>
            </div>
            <div class="stat">
                <span class="stat-label">Clicks Automated:</span>
                <span class="stat-value" id="clicksAutomated">0</span>
            </div>
        </div>

        <div class="stats">
            <h4 style="margin: 0 0 8px 0; font-size: 12px;">📈 Impact Analysis</h4>
            <div id="projections"></div>
        </div>

        <div class="stats">
            <h4 style="margin: 0 0 8px 0; font-size: 12px;">🔄 Complete Workflow Comparison</h4>
            <div style="font-size: 10px; color: var(--vscode-descriptionForeground); margin-bottom: 8px; line-height: 1.3;">
                Manual: Watch generation + Find button + Click + Context switch (~30s)<br>
                Automated: Instant detection and clicking while you code (~0.1s)
            </div>
            <div class="stat">
                <span class="stat-label">Manual Workflow Time:</span>
                <span class="stat-value" id="manualTime">0s</span>
            </div>
            <div class="stat">
                <span class="stat-label">Automated Workflow Time:</span>
                <span class="stat-value highlight" id="automatedTime">0s</span>
            </div>
            <div class="stat">
                <span class="stat-label">Workflow Efficiency:</span>
                <span class="stat-value highlight" id="efficiencyGain">0%</span>
            </div>
        </div>

        <div class="credits">
            Created by <a href="https://linkedin.com/in/ivalsaraj" target="_blank">@ivalsaraj</a>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let currentTab = 'main';

        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                switchTab(tabName);
            });
        });

        function switchTab(tabName) {
            currentTab = tabName;
            
            // Update tab buttons
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
                if (tab.dataset.tab === tabName) {
                    tab.classList.add('active');
                }
            });
            
            // Update content visibility
            document.querySelectorAll('.content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(tabName).classList.add('active');
        }

        // Button event handlers
        document.getElementById('startBtn').addEventListener('click', () => {
            vscode.postMessage({ command: 'start' });
        });

        document.getElementById('stopBtn').addEventListener('click', () => {
            vscode.postMessage({ command: 'stop' });
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            vscode.postMessage({ command: 'export' });
        });

        document.getElementById('clearBtn').addEventListener('click', () => {
            if (confirm('Clear all analytics data? This cannot be undone.')) {
                vscode.postMessage({ command: 'clear' });
            }
        });

        document.getElementById('toggleDebugBtn').addEventListener('click', () => {
            vscode.postMessage({ command: 'toggleDebug' });
        });

        document.getElementById('calibrateBtn').addEventListener('click', () => {
            vscode.postMessage({ command: 'calibrate' });
        });

        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'updateData':
                    updateUI(message.data);
                    break;
                case 'switchTab':
                    switchTab(message.tab);
                    break;
            }
        });

        function updateUI(data) {
            const { status, analytics, roiStats, sessionStats, projections } = data;

            // Update main tab
            updateMainTab(status, sessionStats);
            
            // Update analytics tab
            updateAnalyticsTab(analytics, sessionStats);
            
            // Update ROI tab
            updateROITab(roiStats, sessionStats, projections);
        }

        function updateMainTab(status, sessionStats) {
            const statusEl = document.getElementById('status');
            const startBtn = document.getElementById('startBtn');
            const stopBtn = document.getElementById('stopBtn');
            const sessionDuration = document.getElementById('sessionDuration');
            const totalAccepts = document.getElementById('totalAccepts');
            const filesModified = document.getElementById('filesModified');

            // Update status
            if (status.isRunning) {
                statusEl.className = 'status running';
                statusEl.querySelector('.status-text').textContent = 'Running';
                startBtn.disabled = true;
                stopBtn.disabled = false;
            } else {
                statusEl.className = 'status stopped';
                statusEl.querySelector('.status-text').textContent = 'Stopped';
                startBtn.disabled = false;
                stopBtn.disabled = true;
            }

            // Update stats
            sessionDuration.textContent = sessionStats.sessionDuration + 'min';
            totalAccepts.textContent = status.totalClicks || 0;
            filesModified.textContent = sessionStats.totalFiles || 0;
        }

        function updateAnalyticsTab(analytics, sessionStats) {
            const duration = document.getElementById('analyticsDuration');
            const accepts = document.getElementById('analyticsAccepts');
            const files = document.getElementById('analyticsFiles');
            const added = document.getElementById('linesAdded');
            const deleted = document.getElementById('linesDeleted');
            const buttonTypes = document.getElementById('buttonTypes');
            const filesList = document.getElementById('filesList');

            // Update basic stats
            duration.textContent = sessionStats.sessionDuration + 'min';
            accepts.textContent = analytics.totalAccepts || 0;
            files.textContent = sessionStats.totalFiles || 0;
            added.textContent = '+' + (sessionStats.totalAdded || 0);
            deleted.textContent = '-' + (sessionStats.totalDeleted || 0);

            // Update button types
            updateButtonTypes(buttonTypes, analytics.buttonTypeCounts);

            // Update files list
            updateFilesList(filesList, analytics.files);
        }

        function updateROITab(roiStats, sessionStats, projections) {
            const timeSaved = document.getElementById('timeSaved');
            const duration = document.getElementById('roiDuration');
            const avgTime = document.getElementById('avgTimePerClick');
            const efficiency = document.getElementById('workflowEfficiency');
            const clicks = document.getElementById('clicksAutomated');
            const projectionsEl = document.getElementById('projections');
            const manualTime = document.getElementById('manualTime');
            const automatedTime = document.getElementById('automatedTime');
            const efficiencyGain = document.getElementById('efficiencyGain');

            // Update ROI stats
            timeSaved.textContent = formatTime(roiStats.totalTimeSaved);
            duration.textContent = formatTime(sessionStats.sessionDuration * 60 * 1000);
            avgTime.textContent = formatTime(roiStats.averageTimePerClick);
            efficiency.textContent = roiStats.efficiencyGain.toFixed(1) + '%';
            clicks.textContent = roiStats.totalAccepts || 0;

            // Update projections
            updateProjections(projectionsEl, projections);

            // Update workflow comparison
            const totalManual = (roiStats.totalAccepts || 0) * 30000; // 30s per workflow
            const totalAutomated = (roiStats.totalAccepts || 0) * 100; // 0.1s per workflow
            
            manualTime.textContent = formatTime(totalManual);
            automatedTime.textContent = formatTime(totalAutomated);
            efficiencyGain.textContent = roiStats.efficiencyGain.toFixed(1) + '%';
        }

        function updateButtonTypes(container, buttonTypeCounts) {
            if (!buttonTypeCounts || Object.keys(buttonTypeCounts).length === 0) {
                container.innerHTML = '<div class="no-files">No button types tracked yet</div>';
                return;
            }

            container.innerHTML = '';
            Object.entries(buttonTypeCounts).forEach(([type, count]) => {
                const div = document.createElement('div');
                div.className = 'stat';
                div.style.fontSize = '10px';
                div.style.padding = '2px 0';
                
                const label = document.createElement('span');
                label.className = 'stat-label';
                label.textContent = type + ':';
                
                const value = document.createElement('span');
                value.className = 'stat-value';
                value.textContent = count + 'x';
                
                // Add type-specific styling
                if (type === 'accept' || type === 'accept-all') {
                    value.style.color = 'var(--vscode-debugIcon-startForeground)';
                } else if (type === 'run' || type === 'run-command') {
                    value.style.color = 'var(--vscode-warningForeground)';
                } else if (type === 'resume-conversation') {
                    value.style.color = 'var(--vscode-textLink-foreground)';
                } else if (type === 'connection-resume' || type === 'try-again') {
                    value.style.color = 'var(--vscode-errorForeground)';
                }
                
                div.appendChild(label);
                div.appendChild(value);
                container.appendChild(div);
            });
        }

        function updateFilesList(container, files) {
            if (!files || files.size === 0) {
                container.innerHTML = '<div class="no-files">No files modified yet</div>';
                return;
            }

            container.innerHTML = '';
            const sortedFiles = Array.from(files.entries())
                .sort((a, b) => new Date(b[1].lastAccepted) - new Date(a[1].lastAccepted));

            sortedFiles.forEach(([filename, data]) => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                
                const fileName = document.createElement('div');
                fileName.className = 'file-name';
                fileName.textContent = filename;
                
                const fileStats = document.createElement('div');
                fileStats.className = 'file-stats';
                
                const fileCount = document.createElement('span');
                fileCount.className = 'file-count';
                fileCount.textContent = data.acceptCount + 'x';
                
                const fileChanges = document.createElement('span');
                fileChanges.className = 'file-changes';
                fileChanges.textContent = '+' + data.totalAdded + '/-' + data.totalDeleted;
                
                const fileTime = document.createElement('span');
                fileTime.textContent = getTimeAgo(new Date(data.lastAccepted));
                
                fileStats.appendChild(fileCount);
                fileStats.appendChild(fileChanges);
                fileStats.appendChild(fileTime);
                
                fileItem.appendChild(fileName);
                fileItem.appendChild(fileStats);
                
                container.appendChild(fileItem);
            });
        }

        function updateProjections(container, projections) {
            container.innerHTML = '';
            
            const daily = document.createElement('div');
            daily.className = 'stat';
            daily.style.fontSize = '11px';
            daily.style.padding = '4px';
            daily.style.background = 'var(--vscode-input-background)';
            daily.style.borderRadius = '3px';
            daily.style.margin = '4px 0';
            daily.textContent = 'Daily (8hrs): ' + formatTime(projections.daily) + ' saved';
            
            const weekly = document.createElement('div');
            weekly.className = 'stat';
            weekly.style.fontSize = '11px';
            weekly.style.padding = '4px';
            weekly.style.background = 'var(--vscode-input-background)';
            weekly.style.borderRadius = '3px';
            weekly.style.margin = '4px 0';
            weekly.textContent = 'Weekly (5 days): ' + formatTime(projections.weekly) + ' saved';
            
            const monthly = document.createElement('div');
            monthly.className = 'stat';
            monthly.style.fontSize = '11px';
            monthly.style.padding = '4px';
            monthly.style.background = 'var(--vscode-input-background)';
            monthly.style.borderRadius = '3px';
            monthly.style.margin = '4px 0';
            monthly.textContent = 'Monthly (22 days): ' + formatTime(projections.monthly) + ' saved';
            
            container.appendChild(daily);
            container.appendChild(weekly);
            container.appendChild(monthly);
        }

        function formatTime(milliseconds) {
            if (!milliseconds || isNaN(milliseconds) || milliseconds <= 0) return '0s';
            
            const totalSeconds = Math.floor(milliseconds / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            
            if (hours > 0) {
                return hours + 'h ' + minutes + 'm ' + seconds + 's';
            } else if (minutes > 0) {
                return minutes + 'm ' + seconds + 's';
            } else {
                return seconds + 's';
            }
        }

        function getTimeAgo(date) {
            const now = new Date();
            const diff = Math.round((now - date) / 1000); // seconds
            
            if (diff < 60) return diff + 's ago';
            if (diff < 3600) return Math.round(diff/60) + 'm ago';
            if (diff < 86400) return Math.round(diff/3600) + 'h ago';
            return Math.round(diff/86400) + 'd ago';
        }
    </script>
</body>
</html>
        `;
  }
}
