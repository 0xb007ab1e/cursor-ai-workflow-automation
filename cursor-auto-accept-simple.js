// Simplified Cursor Auto-Accept Script with File Analytics & ROI Tracking
// Created by @ivalsaraj (https://linkedin.com/in/ivalsaraj)
// GitHub: https://github.com/ivalsaraj/cursor-auto-accept-full-agentic-mode
(function() {
    'use strict';
    
    if (typeof globalThis.SimpleAutoAccept === 'undefined') {
        class SimpleAutoAccept {
            constructor(interval = 2000) {
                this.interval = interval;
                this.isRunning = false;
                this.monitorInterval = null;
                this.totalClicks = 0;
                this.controlPanel = null;
                this.isDragging = false;
                this.dragOffset = { x: 0, y: 0 };
                this.currentTab = 'main'; // 'main', 'analytics', or 'roi'
                this.loggedMessages = new Set(); // Track logged messages to prevent duplicates
                this.debugMode = false; // Control debug logging
                
                // File analytics tracking
                this.analytics = {
                    files: new Map(), // filename -> { acceptCount, lastAccepted, addedLines, deletedLines }
                    sessions: [], // track session data
                    totalAccepts: 0,
                    sessionStart: new Date()
                };
                
                // ROI Time tracking - Complete workflow measurement
                this.roiTracking = {
                    totalTimeSaved: 0, // in milliseconds
                    codeGenerationSessions: [],
                    // Complete workflow times (user prompt → cursor completion)
                    averageCompleteWorkflow: 30000, // 30 seconds: user watches cursor generate + manually accept
                    averageAutomatedWorkflow: 100, // ~100ms: script detects and clicks instantly
                    // Manual workflow breakdown:
                    // - User sends prompt: 0s (same for both)
                    // - Cursor generates: 10-20s (same for both) 
                    // - User watches generation: 5-15s (eliminated by script)
                    // - User finds and clicks button: 2-3s (eliminated by script)
                    // - Context switching: 1-2s (eliminated by script)
                    currentWorkflowStart: null,
                    currentSessionButtons: 0,
                    workflowSessions: [] // Track individual workflow times
                };
                
                // Configuration for button types
                this.config = {
                    enableAcceptAll: true,
                    enableAccept: true,
                    enableRun: true,
                    enableRunCommand: true,
                    enableApply: true,
                    enableExecute: true
                };
                
                // Load persisted data
                this.loadFromStorage();
                
                this.createControlPanel();
                this.log('SimpleAutoAccept initialized with file analytics and ROI tracking');
            }
            
            // Persistence methods
            saveToStorage() {
                try {
                    const data = {
                        analytics: {
                            files: Array.from(this.analytics.files.entries()),
                            sessions: this.analytics.sessions,
                            totalAccepts: this.analytics.totalAccepts,
                            sessionStart: this.analytics.sessionStart
                        },
                        roiTracking: this.roiTracking,
                        config: this.config,
                        totalClicks: this.totalClicks,
                        savedAt: new Date()
                    };
                    localStorage.setItem('cursor-auto-accept-data', JSON.stringify(data));
                } catch (error) {
                    console.warn('Failed to save to localStorage:', error);
                }
            }
            
            loadFromStorage() {
                try {
                    const saved = localStorage.getItem('cursor-auto-accept-data');
                    if (saved) {
                        const data = JSON.parse(saved);
                        
                        // Restore analytics
                        if (data.analytics) {
                            this.analytics.files = new Map(data.analytics.files || []);
                            this.analytics.sessions = data.analytics.sessions || [];
                            this.analytics.totalAccepts = data.analytics.totalAccepts || 0;
                            this.analytics.sessionStart = data.analytics.sessionStart ? new Date(data.analytics.sessionStart) : new Date();
                        }
                        
                        // Restore ROI tracking
                        if (data.roiTracking) {
                            this.roiTracking = { ...this.roiTracking, ...data.roiTracking };
                        }
                        
                        // Restore config
                        if (data.config) {
                            this.config = { ...this.config, ...data.config };
                        }
                        
                        // Restore click count
                        if (data.totalClicks) {
                            this.totalClicks = data.totalClicks;
                        }
                        
                        console.log('Data loaded from localStorage');
                    }
                } catch (error) {
                    console.warn('Failed to load from localStorage:', error);
                }
            }
            
            clearStorage() {
                try {
                    localStorage.removeItem('cursor-auto-accept-data');
                    console.log('Storage cleared');
                    
                    // Reset current session data too
                    this.analytics.files.clear();
                    this.analytics.sessions = [];
                    this.analytics.totalAccepts = 0;
                    this.analytics.sessionStart = new Date();
                    this.roiTracking.totalTimeSaved = 0;
                    this.totalClicks = 0;
                    
                    // Update UI
                    this.updateAnalyticsContent();
                    this.updateMainFooter();
                    this.updatePanelStatus();
                    
                    this.logToPanel('🗑️ All data cleared (storage + session)', 'warning');
                } catch (error) {
                    console.warn('Failed to clear localStorage:', error);
                }
            }
            
            validateData() {
                console.log('=== DATA VALIDATION ===');
                console.log('Session Info:');
                console.log(`  Session Start: ${this.analytics.sessionStart}`);
                console.log(`  Total Accepts: ${this.analytics.totalAccepts}`);
                console.log(`  Total Clicks: ${this.totalClicks}`);
                console.log(`  Total Time Saved: ${this.formatTimeDuration(this.roiTracking.totalTimeSaved)}`);
                
                console.log('\nFiles Tracked:');
                this.analytics.files.forEach((data, filename) => {
                    console.log(`  ${filename}:`);
                    console.log(`    Accept Count: ${data.acceptCount}`);
                    console.log(`    Total Added: +${data.totalAdded}`);
                    console.log(`    Total Deleted: -${data.totalDeleted}`);
                    console.log(`    Last Accepted: ${data.lastAccepted}`);
                });
                
                console.log('\nRecent Sessions:');
                this.analytics.sessions.slice(-5).forEach((session, i) => {
                    console.log(`  ${i+1}. ${session.filename} (+${session.addedLines}/-${session.deletedLines}) [${session.buttonType}] at ${session.timestamp}`);
                });
                
                console.log('\nLocalStorage Check:');
                try {
                    const saved = localStorage.getItem('cursor-auto-accept-data');
                    if (saved) {
                        const data = JSON.parse(saved);
                        console.log('  Storage exists, saved at:', data.savedAt);
                        console.log('  Storage analytics total accepts:', data.analytics?.totalAccepts || 0);
                        console.log('  Storage total clicks:', data.totalClicks || 0);
                    } else {
                        console.log('  No data in localStorage');
                    }
                } catch (error) {
                    console.log('  Error reading localStorage:', error);
                }
                
                console.log('=== END VALIDATION ===');
                return {
                    currentSession: {
                        totalAccepts: this.analytics.totalAccepts,
                        totalClicks: this.totalClicks,
                        timeSaved: this.roiTracking.totalTimeSaved,
                        filesCount: this.analytics.files.size
                    },
                    isDataConsistent: this.analytics.totalAccepts === this.analytics.sessions.length
                };
            }
            
            toggleDebug() {
                this.debugMode = !this.debugMode;
                console.log(`Debug mode ${this.debugMode ? 'enabled' : 'disabled'}`);
                this.logToPanel(`Debug mode ${this.debugMode ? 'ON' : 'OFF'}`, 'info');
                return this.debugMode;
            }
            
            calibrateWorkflowTimes(manualWorkflowSeconds, automatedWorkflowMs = 100) {
                const oldManual = this.roiTracking.averageCompleteWorkflow;
                const oldAuto = this.roiTracking.averageAutomatedWorkflow;
                
                this.roiTracking.averageCompleteWorkflow = manualWorkflowSeconds * 1000;
                this.roiTracking.averageAutomatedWorkflow = automatedWorkflowMs;
                
                console.log(`Workflow times updated:`);
                console.log(`  Manual: ${oldManual/1000}s → ${manualWorkflowSeconds}s`);
                console.log(`  Automated: ${oldAuto}ms → ${automatedWorkflowMs}ms`);
                
                // Recalculate all existing workflow sessions
                this.roiTracking.totalTimeSaved = 0;
                this.roiTracking.workflowSessions.forEach(session => {
                    const timeSaved = this.roiTracking.averageCompleteWorkflow - this.roiTracking.averageAutomatedWorkflow;
                    this.roiTracking.totalTimeSaved += timeSaved;
                    session.timeSaved = timeSaved;
                });
                
                this.saveToStorage();
                this.updateAnalyticsContent();
                this.updateMainFooter();
                
                this.logToPanel(`Workflow calibrated: ${manualWorkflowSeconds}s manual`, 'info');
                return { manual: manualWorkflowSeconds, automated: automatedWorkflowMs };
            }
            
            // ROI Tracking Methods
            startCodeGenSession() {
                this.roiTracking.currentSessionStart = new Date();
                this.roiTracking.currentSessionButtons = 0;
            }
            
            endCodeGenSession() {
                if (this.roiTracking.currentSessionStart) {
                    const sessionDuration = new Date() - this.roiTracking.currentSessionStart;
                    this.roiTracking.codeGenerationSessions.push({
                        start: this.roiTracking.currentSessionStart,
                        duration: sessionDuration,
                        buttonsClicked: this.roiTracking.currentSessionButtons,
                        timeSaved: this.roiTracking.currentSessionButtons * this.roiTracking.manualClickTime
                    });
                    this.roiTracking.currentSessionStart = null;
                }
            }
            
            calculateTimeSaved(buttonType) {
                // Calculate time saved based on complete workflow automation
                // Manual workflow: User watches generation + finds button + clicks + context switch
                // Automated workflow: Script detects and clicks instantly while user can focus on coding
                
                const workflowTimeSavings = {
                    'accept all': this.roiTracking.averageCompleteWorkflow + 5000, // extra time to review all changes
                    'accept': this.roiTracking.averageCompleteWorkflow,
                    'run': this.roiTracking.averageCompleteWorkflow + 2000, // extra caution for running commands
                    'execute': this.roiTracking.averageCompleteWorkflow + 2000,
                    'apply': this.roiTracking.averageCompleteWorkflow
                };
                
                const manualTime = workflowTimeSavings[buttonType.toLowerCase()] || this.roiTracking.averageCompleteWorkflow;
                const automatedTime = this.roiTracking.averageAutomatedWorkflow;
                const timeSaved = manualTime - automatedTime;
                
                this.roiTracking.totalTimeSaved += timeSaved;
                this.roiTracking.currentSessionButtons++;
                
                // Track this workflow session
                this.roiTracking.workflowSessions.push({
                    timestamp: new Date(),
                    buttonType: buttonType,
                    manualTime: manualTime,
                    automatedTime: automatedTime,
                    timeSaved: timeSaved
                });
                
                // Save to storage after each update
                this.saveToStorage();
                
                return timeSaved;
            }
            
            formatTimeDuration(milliseconds) {
                if (!milliseconds || isNaN(milliseconds) || milliseconds <= 0) return '0s';
                
                const totalSeconds = Math.floor(milliseconds / 1000);
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const seconds = totalSeconds % 60;
                
                if (hours > 0) {
                    return `${hours}h ${minutes}m ${seconds}s`;
                } else if (minutes > 0) {
                    return `${minutes}m ${seconds}s`;
                } else {
                    return `${seconds}s`;
                }
            }
            
            // Extract file info from code blocks when button is clicked
            extractFileInfo(button) {
                try {
                    // Look for the composer-code-block-container that contains this button
                    let container = button.closest('.composer-code-block-container');
                    if (!container) {
                        // Try to find it in parent elements
                        let parent = button.parentElement;
                        let attempts = 0;
                        while (parent && attempts < 10) {
                            container = parent.querySelector('.composer-code-block-container');
                            if (container) break;
                            parent = parent.parentElement;
                            attempts++;
                        }
                    }
                    
                    if (!container) return null;
                    
                    // Extract filename from .composer-code-block-filename
                    const filenameElement = container.querySelector('.composer-code-block-filename span');
                    const filename = filenameElement ? filenameElement.textContent.trim() : 'Unknown';
                    
                    // Extract diff stats from .composer-code-block-status
                    const statusElement = container.querySelector('.composer-code-block-status span');
                    let addedLines = 0;
                    let deletedLines = 0;
                    
                    if (statusElement) {
                        const statusText = statusElement.textContent;
                        const addedMatch = statusText.match(/\+(\d+)/);
                        const deletedMatch = statusText.match(/-(\d+)/);
                        
                        if (addedMatch) addedLines = parseInt(addedMatch[1]);
                        if (deletedMatch) deletedLines = parseInt(deletedMatch[1]);
                        
                        // Debug logging to verify extracted values (only if debug mode is on)
                        if (this.debugMode) {
                            this.log(`Debug: Extracted from UI - File: ${filename}, Status: "${statusText}", +${addedLines}/-${deletedLines}`);
                        }
                    }
                    
                    return {
                        filename,
                        addedLines,
                        deletedLines,
                        timestamp: new Date()
                    };
                    
                } catch (error) {
                    this.log(`Error extracting file info: ${error.message}`);
                    return null;
                }
            }
            
            // Track file acceptance
            trackFileAcceptance(fileInfo, buttonType = 'accept') {
                if (!fileInfo || !fileInfo.filename) return;
                
                const { filename, addedLines, deletedLines, timestamp } = fileInfo;
                
                // Calculate time saved for this action
                const timeSaved = this.calculateTimeSaved(buttonType);
                
                // Update file statistics
                if (this.analytics.files.has(filename)) {
                    const existing = this.analytics.files.get(filename);
                    existing.acceptCount++;
                    existing.lastAccepted = timestamp;
                    existing.totalAdded += addedLines;
                    existing.totalDeleted += deletedLines;
                } else {
                    this.analytics.files.set(filename, {
                        acceptCount: 1,
                        firstAccepted: timestamp,
                        lastAccepted: timestamp,
                        totalAdded: addedLines,
                        totalDeleted: deletedLines
                    });
                }
                
                // Track in session
                this.analytics.sessions.push({
                    filename,
                    addedLines,
                    deletedLines,
                    timestamp,
                    buttonType,
                    timeSaved
                });
                
                this.analytics.totalAccepts++;
                
                this.logToPanel(`📁 ${filename} (+${addedLines}/-${deletedLines}) [saved ${this.formatTimeDuration(timeSaved)}]`, 'file');
                this.log(`File accepted: ${filename} (+${addedLines}/-${deletedLines}) - Time saved: ${this.formatTimeDuration(timeSaved)}`);
                
                // Update analytics panel if visible
                if (this.currentTab === 'analytics' || this.currentTab === 'roi') {
                    this.updateAnalyticsContent();
                }
                
                // Update main footer ROI display
                this.updateMainFooter();
            }
            
            createControlPanel() {
                if (this.controlPanel) return;
                
                this.controlPanel = document.createElement('div');
                this.controlPanel.id = 'auto-accept-control-panel';
                
                // Create header with tabs
                const header = document.createElement('div');
                header.className = 'aa-header';
                
                const tabsContainer = document.createElement('div');
                tabsContainer.className = 'aa-tabs';
                
                const mainTab = document.createElement('button');
                mainTab.className = 'aa-tab aa-tab-active';
                mainTab.textContent = 'Main';
                mainTab.onclick = () => this.switchTab('main');
                
                const analyticsTab = document.createElement('button');
                analyticsTab.className = 'aa-tab';
                analyticsTab.textContent = 'Analytics';
                analyticsTab.onclick = () => this.switchTab('analytics');
                
                const roiTab = document.createElement('button');
                roiTab.className = 'aa-tab';
                roiTab.textContent = 'ROI';
                roiTab.onclick = () => this.switchTab('roi');
                
                tabsContainer.appendChild(mainTab);
                tabsContainer.appendChild(analyticsTab);
                tabsContainer.appendChild(roiTab);
                
                const headerControls = document.createElement('div');
                headerControls.className = 'aa-header-controls';
                
                const minimizeBtn = document.createElement('button');
                minimizeBtn.className = 'aa-minimize';
                minimizeBtn.title = 'Minimize';
                minimizeBtn.textContent = '−';
                
                const closeBtn = document.createElement('button');
                closeBtn.className = 'aa-close';
                closeBtn.title = 'Close';
                closeBtn.textContent = '×';
                
                headerControls.appendChild(minimizeBtn);
                headerControls.appendChild(closeBtn);
                
                header.appendChild(tabsContainer);
                header.appendChild(headerControls);
                
                // Create main content area
                const mainContent = document.createElement('div');
                mainContent.className = 'aa-content aa-main-content';
                
                // Status section
                const status = document.createElement('div');
                status.className = 'aa-status';
                
                const statusText = document.createElement('span');
                statusText.className = 'aa-status-text';
                statusText.textContent = 'Stopped';
                
                const clicksText = document.createElement('span');
                clicksText.className = 'aa-clicks';
                clicksText.textContent = '0 clicks';
                
                status.appendChild(statusText);
                status.appendChild(clicksText);
                
                // Controls section
                const controls = document.createElement('div');
                controls.className = 'aa-controls';
                
                const startBtn = document.createElement('button');
                startBtn.className = 'aa-btn aa-start';
                startBtn.textContent = 'Start';
                
                const stopBtn = document.createElement('button');
                stopBtn.className = 'aa-btn aa-stop';
                stopBtn.textContent = 'Stop';
                stopBtn.disabled = true;
                
                const configBtn = document.createElement('button');
                configBtn.className = 'aa-btn aa-config';
                configBtn.textContent = 'Config';
                
                controls.appendChild(startBtn);
                controls.appendChild(stopBtn);
                controls.appendChild(configBtn);
                
                // Config panel
                const configPanel = document.createElement('div');
                configPanel.className = 'aa-config-panel';
                configPanel.style.display = 'none';
                
                const configOptions = [
                    { id: 'aa-accept-all', text: 'Accept All', checked: true },
                    { id: 'aa-accept', text: 'Accept', checked: true },
                    { id: 'aa-run', text: 'Run', checked: true },
                    { id: 'aa-apply', text: 'Apply', checked: true }
                ];
                
                configOptions.forEach(option => {
                    const label = document.createElement('label');
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.id = option.id;
                    checkbox.checked = option.checked;
                    
                    label.appendChild(checkbox);
                    label.appendChild(document.createTextNode(' ' + option.text));
                    configPanel.appendChild(label);
                });
                
                // Log section
                const log = document.createElement('div');
                log.className = 'aa-log';
                
                // ROI Footer for main tab
                const roiFooter = document.createElement('div');
                roiFooter.className = 'aa-roi-footer';
                
                // Credits section for main tab
                const creditsDiv = document.createElement('div');
                creditsDiv.className = 'aa-credits';
                
                const creditsText = document.createElement('small');
                creditsText.textContent = 'Created by ';
                
                const creditsLink = document.createElement('a');
                creditsLink.href = 'https://linkedin.com/in/ivalsaraj';
                creditsLink.target = '_blank';
                creditsLink.textContent = '@ivalsaraj';
                
                creditsText.appendChild(creditsLink);
                creditsDiv.appendChild(creditsText);
                
                // Assemble main content
                mainContent.appendChild(status);
                mainContent.appendChild(controls);
                mainContent.appendChild(configPanel);
                mainContent.appendChild(log);
                mainContent.appendChild(roiFooter);
                mainContent.appendChild(creditsDiv);
                
                // Create analytics content area
                const analyticsContent = document.createElement('div');
                analyticsContent.className = 'aa-content aa-analytics-content';
                analyticsContent.style.display = 'none';
                
                // Assemble everything
                this.controlPanel.appendChild(header);
                this.controlPanel.appendChild(mainContent);
                this.controlPanel.appendChild(analyticsContent);
                
                this.controlPanel.style.cssText = `
                    position: fixed;
                    top: 100px;
                    right: 20px;
                    width: 280px;
                    background: #1e1e1e;
                    border: 1px solid #333;
                    border-radius: 6px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    font-size: 12px;
                    color: #ccc;
                    z-index: 999999;
                    user-select: none;
                    max-height: 500px;
                    display: flex;
                    flex-direction: column;
                `;
                
                this.addPanelStyles();
                this.setupPanelEvents();
                document.body.appendChild(this.controlPanel);
                
                // Initialize analytics content and update main footer
                this.updateAnalyticsContent();
                this.updateMainFooter();
            }
            
            updateMainFooter() {
                const roiFooter = this.controlPanel?.querySelector('.aa-roi-footer');
                if (!roiFooter) return;
                
                // Clear existing content
                while (roiFooter.firstChild) {
                    roiFooter.removeChild(roiFooter.firstChild);
                }
                
                // Calculate ROI metrics
                const totalTimeSaved = this.roiTracking.totalTimeSaved || 0;
                const totalAccepts = this.analytics.totalAccepts || 0;
                const sessionDuration = new Date() - this.analytics.sessionStart;
                
                // Safe calculations to avoid NaN - Calculate efficiency based on complete workflow
                const averageManualWorkflowTime = this.roiTracking.averageCompleteWorkflow;
                const totalManualTime = totalAccepts * averageManualWorkflowTime;
                const totalAutomatedTime = totalAccepts * this.roiTracking.averageAutomatedWorkflow;
                const efficiencyGain = totalManualTime > 0 ? 
                    ((totalManualTime - totalAutomatedTime) / totalManualTime * 100) : 0;
                
                const title = document.createElement('div');
                title.className = 'aa-roi-footer-title';
                title.textContent = '⚡ Workflow ROI';
                
                const stats = document.createElement('div');
                stats.className = 'aa-roi-footer-stats';
                
                const timeSavedSpan = document.createElement('span');
                timeSavedSpan.textContent = `Time Saved: ${this.formatTimeDuration(totalTimeSaved)}`;
                
                const efficiencySpan = document.createElement('span');
                efficiencySpan.textContent = `Workflow Efficiency: ${efficiencyGain.toFixed(1)}%`;
                
                stats.appendChild(timeSavedSpan);
                stats.appendChild(efficiencySpan);
                
                roiFooter.appendChild(title);
                roiFooter.appendChild(stats);
            }
            
            switchTab(tabName) {
                this.currentTab = tabName;
                
                // Update tab buttons
                const tabs = this.controlPanel.querySelectorAll('.aa-tab');
                tabs.forEach(tab => {
                    tab.classList.remove('aa-tab-active');
                    if (tab.textContent.toLowerCase() === tabName) {
                        tab.classList.add('aa-tab-active');
                    }
                });
                
                // Update content visibility
                const mainContent = this.controlPanel.querySelector('.aa-main-content');
                const analyticsContent = this.controlPanel.querySelector('.aa-analytics-content');
                
                if (tabName === 'main') {
                    mainContent.style.display = 'block';
                    analyticsContent.style.display = 'none';
                } else if (tabName === 'analytics') {
                    mainContent.style.display = 'none';
                    analyticsContent.style.display = 'block';
                    this.updateAnalyticsContent();
                } else if (tabName === 'roi') {
                    mainContent.style.display = 'none';
                    analyticsContent.style.display = 'block';
                    this.updateAnalyticsContent();
                }
            }
            
            updateAnalyticsContent() {
                const analyticsContent = this.controlPanel.querySelector('.aa-analytics-content');
                if (!analyticsContent) return;
                
                // Clear existing content
                analyticsContent.textContent = '';
                
                if (this.currentTab === 'analytics') {
                    this.renderAnalyticsTab(analyticsContent);
                } else if (this.currentTab === 'roi') {
                    this.renderROITab(analyticsContent);
                }
            }
            
            renderAnalyticsTab(container) {
                const now = new Date();
                const sessionDuration = Math.round((now - this.analytics.sessionStart) / 1000 / 60); // minutes
                
                // Calculate totals
                let totalFiles = this.analytics.files.size;
                let totalAdded = 0;
                let totalDeleted = 0;
                
                this.analytics.files.forEach(fileData => {
                    totalAdded += fileData.totalAdded;
                    totalDeleted += fileData.totalDeleted;
                });
                
                // Create analytics summary
                const summaryDiv = document.createElement('div');
                summaryDiv.className = 'aa-analytics-summary';
                
                const summaryTitle = document.createElement('h4');
                summaryTitle.textContent = '📊 Session Analytics';
                summaryDiv.appendChild(summaryTitle);
                
                const stats = [
                    { label: 'Session:', value: `${sessionDuration}min` },
                    { label: 'Total Accepts:', value: `${this.analytics.totalAccepts}` },
                    { label: 'Files Modified:', value: `${totalFiles}` },
                    { label: 'Lines Added:', value: `+${totalAdded}`, class: 'aa-stat-added' },
                    { label: 'Lines Deleted:', value: `-${totalDeleted}`, class: 'aa-stat-deleted' }
                ];
                
                stats.forEach(stat => {
                    const statDiv = document.createElement('div');
                    statDiv.className = 'aa-stat';
                    
                    const labelSpan = document.createElement('span');
                    labelSpan.className = 'aa-stat-label';
                    labelSpan.textContent = stat.label;
                    
                    const valueSpan = document.createElement('span');
                    valueSpan.className = `aa-stat-value ${stat.class || ''}`;
                    valueSpan.textContent = stat.value;
                    
                    statDiv.appendChild(labelSpan);
                    statDiv.appendChild(valueSpan);
                    summaryDiv.appendChild(statDiv);
                });
                
                // Create files section
                const filesDiv = document.createElement('div');
                filesDiv.className = 'aa-analytics-files';
                
                const filesTitle = document.createElement('h4');
                filesTitle.textContent = '📁 File Activity';
                filesDiv.appendChild(filesTitle);
                
                const filesList = document.createElement('div');
                filesList.className = 'aa-files-list';
                this.renderFilesList(filesList);
                filesDiv.appendChild(filesList);
                
                // Create actions section
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'aa-analytics-actions';
                
                const exportBtn = document.createElement('button');
                exportBtn.className = 'aa-btn aa-btn-small';
                exportBtn.textContent = 'Export Data';
                exportBtn.onclick = () => this.exportAnalytics();
                
                const clearBtn = document.createElement('button');
                clearBtn.className = 'aa-btn aa-btn-small';
                clearBtn.textContent = 'Clear Data';
                clearBtn.onclick = () => this.clearAnalytics();
                
                actionsDiv.appendChild(exportBtn);
                actionsDiv.appendChild(clearBtn);
                
                // Create credits section
                const creditsDiv = document.createElement('div');
                creditsDiv.className = 'aa-credits';
                
                const creditsText = document.createElement('small');
                creditsText.textContent = 'Created by ';
                
                const creditsLink = document.createElement('a');
                creditsLink.href = 'https://linkedin.com/in/ivalsaraj';
                creditsLink.target = '_blank';
                creditsLink.textContent = '@ivalsaraj';
                
                creditsText.appendChild(creditsLink);
                creditsDiv.appendChild(creditsText);
                
                // Append all sections
                container.appendChild(summaryDiv);
                container.appendChild(filesDiv);
                container.appendChild(actionsDiv);
                container.appendChild(creditsDiv);
            }
            
            renderROITab(container) {
                const now = new Date();
                const sessionDuration = now - this.analytics.sessionStart;
                
                // Calculate ROI metrics with safe fallbacks
                const totalTimeSaved = this.roiTracking.totalTimeSaved || 0;
                const totalAccepts = this.analytics.totalAccepts || 0;
                const averageTimePerClick = totalAccepts > 0 ? totalTimeSaved / totalAccepts : 0;
                const productivityGain = sessionDuration > 0 ? (totalTimeSaved / sessionDuration) * 100 : 0;
                
                // Create ROI summary
                const summaryDiv = document.createElement('div');
                summaryDiv.className = 'aa-roi-summary';
                
                const summaryTitle = document.createElement('h4');
                summaryTitle.textContent = '⚡ Complete Workflow ROI';
                summaryDiv.appendChild(summaryTitle);
                
                // Add explanation of workflow measurement
                const explanationDiv = document.createElement('div');
                explanationDiv.className = 'aa-roi-explanation';
                explanationDiv.style.cssText = 'font-size: 10px; color: #888; margin-bottom: 8px; line-height: 1.3;';
                explanationDiv.textContent = 'Measures complete AI workflow: User prompt → Cursor generation → Manual watching/clicking vs Auto-acceptance';
                summaryDiv.appendChild(explanationDiv);
                
                const roiStats = [
                    { label: 'Total Time Saved:', value: this.formatTimeDuration(totalTimeSaved), class: 'aa-roi-highlight' },
                    { label: 'Session Duration:', value: this.formatTimeDuration(sessionDuration) },
                    { label: 'Avg. per Click:', value: this.formatTimeDuration(averageTimePerClick) },
                    { label: 'Productivity Gain:', value: `${productivityGain.toFixed(1)}%`, class: 'aa-roi-percentage' },
                    { label: 'Clicks Automated:', value: `${totalAccepts}` }
                ];
                
                roiStats.forEach(stat => {
                    const statDiv = document.createElement('div');
                    statDiv.className = 'aa-stat';
                    
                    const labelSpan = document.createElement('span');
                    labelSpan.className = 'aa-stat-label';
                    labelSpan.textContent = stat.label;
                    
                    const valueSpan = document.createElement('span');
                    valueSpan.className = `aa-stat-value ${stat.class || ''}`;
                    valueSpan.textContent = stat.value;
                    
                    statDiv.appendChild(labelSpan);
                    statDiv.appendChild(valueSpan);
                    summaryDiv.appendChild(statDiv);
                });
                
                // Create impact analysis
                const impactDiv = document.createElement('div');
                impactDiv.className = 'aa-roi-impact';
                
                const impactTitle = document.createElement('h4');
                impactTitle.textContent = '📈 Impact Analysis';
                impactDiv.appendChild(impactTitle);
                
                const impactText = document.createElement('div');
                impactText.className = 'aa-roi-text';
                
                // Calculate different scenarios with safe division
                const hourlyRate = sessionDuration > 0 ? (totalTimeSaved / sessionDuration) : 0;
                const dailyProjection = hourlyRate * (8 * 60 * 60 * 1000); // 8 hour workday
                const weeklyProjection = dailyProjection * 5;
                const monthlyProjection = dailyProjection * 22; // work days
                
                const scenarios = [
                    { period: 'Daily (8hrs)', saved: dailyProjection },
                    { period: 'Weekly (5 days)', saved: weeklyProjection },
                    { period: 'Monthly (22 days)', saved: monthlyProjection }
                ];
                
                scenarios.forEach(scenario => {
                    const scenarioDiv = document.createElement('div');
                    scenarioDiv.className = 'aa-roi-scenario';
                    scenarioDiv.textContent = `${scenario.period}: ${this.formatTimeDuration(scenario.saved)} saved`;
                    impactText.appendChild(scenarioDiv);
                });
                
                impactDiv.appendChild(impactText);
                
                // Manual vs Automated comparison
                const comparisonDiv = document.createElement('div');
                comparisonDiv.className = 'aa-roi-comparison';
                
                const comparisonTitle = document.createElement('h4');
                comparisonTitle.textContent = '🔄 Complete Workflow Comparison';
                comparisonDiv.appendChild(comparisonTitle);
                
                // Add workflow breakdown explanation  
                const workflowBreakdown = document.createElement('div');
                workflowBreakdown.className = 'aa-workflow-breakdown';
                workflowBreakdown.style.cssText = 'font-size: 10px; color: #888; margin-bottom: 8px; line-height: 1.3;';
                
                const manualLine = document.createElement('div');
                manualLine.textContent = 'Manual: Watch generation + Find button + Click + Context switch (~30s)';
                workflowBreakdown.appendChild(manualLine);
                
                const automatedLine = document.createElement('div');
                automatedLine.textContent = 'Automated: Instant detection and clicking while you code (~0.1s)';
                workflowBreakdown.appendChild(automatedLine);
                
                comparisonDiv.appendChild(workflowBreakdown);
                
                const manualTime = totalAccepts * this.roiTracking.averageCompleteWorkflow;
                const automatedTime = totalAccepts * this.roiTracking.averageAutomatedWorkflow;
                
                const comparisonStats = [
                    { label: 'Manual Workflow Time:', value: this.formatTimeDuration(manualTime), class: 'aa-roi-manual' },
                    { label: 'Automated Workflow Time:', value: this.formatTimeDuration(automatedTime), class: 'aa-roi-auto' },
                    { label: 'Workflow Efficiency:', value: `${manualTime > 0 ? ((manualTime - automatedTime) / manualTime * 100).toFixed(1) : '0.0'}%`, class: 'aa-roi-highlight' }
                ];
                
                comparisonStats.forEach(stat => {
                    const statDiv = document.createElement('div');
                    statDiv.className = 'aa-stat';
                    
                    const labelSpan = document.createElement('span');
                    labelSpan.className = 'aa-stat-label';
                    labelSpan.textContent = stat.label;
                    
                    const valueSpan = document.createElement('span');
                    valueSpan.className = `aa-stat-value ${stat.class || ''}`;
                    valueSpan.textContent = stat.value;
                    
                    statDiv.appendChild(labelSpan);
                    statDiv.appendChild(valueSpan);
                    comparisonDiv.appendChild(statDiv);
                });
                
                // Create credits section for ROI tab too
                const creditsDiv = document.createElement('div');
                creditsDiv.className = 'aa-credits';
                
                const creditsText = document.createElement('small');
                creditsText.textContent = 'Created by ';
                
                const creditsLink = document.createElement('a');
                creditsLink.href = 'https://linkedin.com/in/ivalsaraj';
                creditsLink.target = '_blank';
                creditsLink.textContent = '@ivalsaraj';
                
                creditsText.appendChild(creditsLink);
                creditsDiv.appendChild(creditsText);
                
                // Append all sections
                container.appendChild(summaryDiv);
                container.appendChild(impactDiv);
                container.appendChild(comparisonDiv);
                container.appendChild(creditsDiv);
            }
            
            renderFilesList(container) {
                if (this.analytics.files.size === 0) {
                    const noFilesDiv = document.createElement('div');
                    noFilesDiv.className = 'aa-no-files';
                    noFilesDiv.textContent = 'No files modified yet';
                    container.appendChild(noFilesDiv);
                    return;
                }
                
                const sortedFiles = Array.from(this.analytics.files.entries())
                    .sort((a, b) => b[1].lastAccepted - a[1].lastAccepted);
                
                sortedFiles.forEach(([filename, data]) => {
                    const timeAgo = this.getTimeAgo(data.lastAccepted);
                    
                    const fileItem = document.createElement('div');
                    fileItem.className = 'aa-file-item';
                    
                    const fileName = document.createElement('div');
                    fileName.className = 'aa-file-name';
                    fileName.textContent = filename;
                    
                    const fileStats = document.createElement('div');
                    fileStats.className = 'aa-file-stats';
                    
                    const fileCount = document.createElement('span');
                    fileCount.className = 'aa-file-count';
                    fileCount.textContent = `${data.acceptCount}x`;
                    
                    const fileChanges = document.createElement('span');
                    fileChanges.className = 'aa-file-changes';
                    fileChanges.textContent = `+${data.totalAdded}/-${data.totalDeleted}`;
                    
                    const fileTime = document.createElement('span');
                    fileTime.className = 'aa-file-time';
                    fileTime.textContent = timeAgo;
                    
                    fileStats.appendChild(fileCount);
                    fileStats.appendChild(fileChanges);
                    fileStats.appendChild(fileTime);
                    
                    fileItem.appendChild(fileName);
                    fileItem.appendChild(fileStats);
                    
                    container.appendChild(fileItem);
                });
            }
            
            getTimeAgo(date) {
                const now = new Date();
                const diff = Math.round((now - date) / 1000); // seconds
                
                if (diff < 60) return `${diff}s ago`;
                if (diff < 3600) return `${Math.round(diff/60)}m ago`;
                if (diff < 86400) return `${Math.round(diff/3600)}h ago`;
                return `${Math.round(diff/86400)}d ago`;
            }
            
            exportAnalytics() {
                const data = {
                    session: {
                        start: this.analytics.sessionStart,
                        duration: new Date() - this.analytics.sessionStart,
                        totalAccepts: this.analytics.totalAccepts
                    },
                    files: Object.fromEntries(this.analytics.files),
                    sessions: this.analytics.sessions,
                    config: this.config,
                    exportedAt: new Date()
                };
                
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `cursor-auto-accept-analytics-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
                
                this.logToPanel('📥 Analytics exported', 'info');
            }
            
            clearAnalytics() {
                if (confirm('Clear all analytics data? This cannot be undone.')) {
                    this.analytics.files.clear();
                    this.analytics.sessions = [];
                    this.analytics.totalAccepts = 0;
                    this.analytics.sessionStart = new Date();
                    this.updateAnalyticsContent();
                    this.logToPanel('🗑️ Analytics cleared', 'warning');
                }
            }
            
            addPanelStyles() {
                if (document.getElementById('auto-accept-styles')) return;
                
                const style = document.createElement('style');
                style.id = 'auto-accept-styles';
                style.textContent = `
                    .aa-header {
                        background: #2d2d2d;
                        padding: 6px 10px;
                        border-radius: 5px 5px 0 0;
                        cursor: move;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-bottom: 1px solid #333;
                    }
                    
                    .aa-tabs {
                        display: flex;
                        gap: 4px;
                    }
                    
                    .aa-tab {
                        background: #444;
                        border: none;
                        color: #ccc;
                        font-size: 11px;
                        cursor: pointer;
                        padding: 4px 8px;
                        border-radius: 3px;
                        transition: all 0.2s;
                    }
                    
                    .aa-tab:hover {
                        background: #555;
                    }
                    
                    .aa-tab-active {
                        background: #0d7377 !important;
                        color: white !important;
                    }
                    
                    .aa-header-controls {
                        display: flex;
                        gap: 4px;
                    }
                    
                    .aa-title {
                        font-weight: 500;
                        color: #fff;
                        font-size: 12px;
                    }
                    .aa-minimize, .aa-close {
                        background: #444;
                        border: none;
                        color: #ccc;
                        font-size: 12px;
                        font-weight: bold;
                        cursor: pointer;
                        padding: 2px 5px;
                        border-radius: 2px;
                        line-height: 1;
                        width: 16px;
                        height: 16px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .aa-minimize:hover, .aa-close:hover {
                        background: #555;
                    }
                    .aa-close:hover {
                        background: #dc3545;
                        color: white;
                    }
                    .aa-content {
                        padding: 12px;
                        overflow-y: auto;
                        flex: 1;
                    }
                    .aa-status {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 10px;
                        padding: 6px 8px;
                        background: #252525;
                        border-radius: 4px;
                        font-size: 11px;
                    }
                    .aa-status-text.running {
                        color: #4CAF50;
                        font-weight: 500;
                    }
                    .aa-status-text.stopped {
                        color: #f44336;
                    }
                    .aa-clicks {
                        color: #888;
                    }
                    .aa-controls {
                        display: flex;
                        gap: 6px;
                        margin-bottom: 10px;
                    }
                    .aa-btn {
                        flex: 1;
                        padding: 6px 12px;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 11px;
                        font-weight: 500;
                        transition: all 0.2s;
                    }
                    .aa-btn-small {
                        flex: none;
                        padding: 4px 8px;
                        font-size: 10px;
                    }
                    .aa-start {
                        background: #4CAF50;
                        color: white;
                    }
                    .aa-start:hover:not(:disabled) {
                        background: #45a049;
                    }
                    .aa-stop {
                        background: #f44336;
                        color: white;
                    }
                    .aa-stop:hover:not(:disabled) {
                        background: #da190b;
                    }
                    .aa-config {
                        background: #2196F3;
                        color: white;
                    }
                    .aa-config:hover:not(:disabled) {
                        background: #1976D2;
                    }
                    .aa-btn:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                    }
                    .aa-config-panel {
                        background: #252525;
                        border-radius: 4px;
                        padding: 8px;
                        margin-bottom: 10px;
                    }
                    .aa-config-panel label {
                        display: block;
                        margin-bottom: 4px;
                        font-size: 11px;
                        cursor: pointer;
                    }
                    .aa-config-panel input[type="checkbox"] {
                        margin-right: 6px;
                    }
                    .aa-log {
                        background: #252525;
                        border-radius: 4px;
                        padding: 8px;
                        height: 120px;
                        overflow-y: auto;
                        font-size: 10px;
                        line-height: 1.3;
                    }
                    .aa-log-entry {
                        margin-bottom: 2px;
                        padding: 2px 4px;
                        border-radius: 2px;
                    }
                    .aa-log-entry.info {
                        color: #4CAF50;
                    }
                    .aa-log-entry.warning {
                        color: #FF9800;
                    }
                    .aa-log-entry.error {
                        color: #f44336;
                    }
                    .aa-log-entry.file {
                        color: #2196F3;
                        background: rgba(33, 150, 243, 0.1);
                    }
                    
                    /* Analytics Styles */
                    .aa-analytics-summary {
                        background: #252525;
                        border-radius: 4px;
                        padding: 8px;
                        margin-bottom: 10px;
                    }
                    
                    .aa-analytics-summary h4 {
                        margin: 0 0 8px 0;
                        font-size: 12px;
                        color: #fff;
                    }
                    
                    .aa-stat {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 4px;
                        font-size: 11px;
                    }
                    
                    .aa-stat-label {
                        color: #888;
                    }
                    
                    .aa-stat-value {
                        color: #fff;
                        font-weight: 500;
                    }
                    
                    .aa-stat-added {
                        color: #4CAF50;
                    }
                    
                    .aa-stat-deleted {
                        color: #f44336;
                    }
                    
                    .aa-analytics-files {
                        background: #252525;
                        border-radius: 4px;
                        padding: 8px;
                        margin-bottom: 10px;
                    }
                    
                    .aa-analytics-files h4 {
                        margin: 0 0 8px 0;
                        font-size: 12px;
                        color: #fff;
                    }
                    
                    .aa-files-list {
                        max-height: 150px;
                        overflow-y: auto;
                    }
                    
                    .aa-file-item {
                        padding: 4px 0;
                        border-bottom: 1px solid #333;
                    }
                    
                    .aa-file-item:last-child {
                        border-bottom: none;
                    }
                    
                    .aa-file-name {
                        font-size: 11px;
                        color: #fff;
                        font-weight: 500;
                        margin-bottom: 2px;
                        word-break: break-all;
                    }
                    
                    .aa-file-stats {
                        display: flex;
                        gap: 8px;
                        font-size: 10px;
                        color: #888;
                    }
                    
                    .aa-file-count {
                        background: #444;
                        padding: 1px 4px;
                        border-radius: 2px;
                        color: #ccc;
                    }
                    
                    .aa-file-changes {
                        color: #2196F3;
                    }
                    
                    .aa-file-time {
                        margin-left: auto;
                    }
                    
                    .aa-no-files {
                        color: #888;
                        font-size: 11px;
                        text-align: center;
                        padding: 20px;
                    }
                    
                    .aa-analytics-actions {
                        display: flex;
                        gap: 6px;
                        margin-bottom: 10px;
                    }
                    
                    .aa-analytics-actions .aa-btn {
                        background: #444;
                        color: #ccc;
                    }
                    
                    .aa-analytics-actions .aa-btn:hover {
                        background: #555;
                    }
                    
                    .aa-credits {
                        text-align: center;
                        padding: 8px;
                        border-top: 1px solid #333;
                        color: #666;
                    }
                    
                    .aa-credits a {
                        color: #2196F3;
                        text-decoration: none;
                    }
                    
                    .aa-credits a:hover {
                        text-decoration: underline;
                    }
                    
                    /* ROI Tab Styles */
                    .aa-roi-summary, .aa-roi-impact, .aa-roi-comparison {
                        margin-bottom: 12px;
                        padding: 8px;
                        background: #333;
                        border-radius: 4px;
                    }
                    
                    .aa-roi-highlight {
                        color: #4CAF50 !important;
                        font-weight: 600;
                    }
                    
                    .aa-roi-percentage {
                        color: #2196F3 !important;
                        font-weight: 600;
                    }
                    
                    .aa-roi-manual {
                        color: #FF9800 !important;
                    }
                    
                    .aa-roi-auto {
                        color: #4CAF50 !important;
                    }
                    
                    .aa-roi-text {
                        margin-top: 8px;
                    }
                    
                    .aa-roi-scenario {
                        margin: 4px 0;
                        padding: 4px;
                        background: #444;
                        border-radius: 3px;
                        font-size: 11px;
                        color: #ccc;
                    }
                    
                    /* ROI Footer Styles (for main tab) */
                    .aa-roi-footer {
                        margin-top: 8px;
                        padding: 6px 8px;
                        background: #2d2d2d;
                        border-radius: 4px;
                        border-top: 1px solid #444;
                    }
                    
                    .aa-roi-footer-title {
                        font-size: 10px;
                        color: #fff;
                        font-weight: 600;
                        margin-bottom: 4px;
                    }
                    
                    .aa-roi-footer-stats {
                        display: flex;
                        justify-content: space-between;
                        font-size: 9px;
                        color: #888;
                    }
                    
                    .aa-roi-footer-stats span {
                        color: #4CAF50;
                    }
                    
                    /* Minimize functionality */
                    #auto-accept-control-panel.aa-minimized .aa-content {
                        display: none;
                    }
                    
                    #auto-accept-control-panel.aa-minimized {
                        height: auto;
                        max-height: none;
                    }
                `;
                document.head.appendChild(style);
            }
            
            setupPanelEvents() {
                const header = this.controlPanel.querySelector('.aa-header');
                const minimizeBtn = this.controlPanel.querySelector('.aa-minimize');
                const closeBtn = this.controlPanel.querySelector('.aa-close');
                const startBtn = this.controlPanel.querySelector('.aa-start');
                const stopBtn = this.controlPanel.querySelector('.aa-stop');
                const configBtn = this.controlPanel.querySelector('.aa-config');
                const configPanel = this.controlPanel.querySelector('.aa-config-panel');
                
                // Dragging functionality
                header.addEventListener('mousedown', (e) => {
                    if (e.target === minimizeBtn || e.target === closeBtn) return;
                    this.isDragging = true;
                    const rect = this.controlPanel.getBoundingClientRect();
                    this.dragOffset.x = e.clientX - rect.left;
                    this.dragOffset.y = e.clientY - rect.top;
                    e.preventDefault();
                });
                
                document.addEventListener('mousemove', (e) => {
                    if (!this.isDragging) return;
                    const x = e.clientX - this.dragOffset.x;
                    const y = e.clientY - this.dragOffset.y;
                    this.controlPanel.style.left = Math.max(0, Math.min(window.innerWidth - this.controlPanel.offsetWidth, x)) + 'px';
                    this.controlPanel.style.top = Math.max(0, Math.min(window.innerHeight - this.controlPanel.offsetHeight, y)) + 'px';
                    this.controlPanel.style.right = 'auto';
                });
                
                document.addEventListener('mouseup', () => {
                    this.isDragging = false;
                });
                
                // Control buttons
                minimizeBtn.addEventListener('click', () => {
                    this.controlPanel.classList.toggle('aa-minimized');
                });
                
                closeBtn.addEventListener('click', () => {
                    this.hideControlPanel();
                });
                
                startBtn.addEventListener('click', () => {
                    this.start();
                });
                
                stopBtn.addEventListener('click', () => {
                    this.stop();
                });
                
                configBtn.addEventListener('click', () => {
                    configPanel.style.display = configPanel.style.display === 'none' ? 'block' : 'none';
                });
                
                // Config checkboxes
                const checkboxes = this.controlPanel.querySelectorAll('.aa-config-panel input[type="checkbox"]');
                checkboxes.forEach(checkbox => {
                    checkbox.addEventListener('change', () => {
                        const configMap = {
                            'aa-accept-all': 'enableAcceptAll',
                            'aa-accept': 'enableAccept',
                            'aa-run': 'enableRun',
                            'aa-apply': 'enableApply'
                        };
                        const configKey = configMap[checkbox.id];
                        if (configKey) {
                            this.config[configKey] = checkbox.checked;
                            this.config.enableRunCommand = this.config.enableRun;
                            this.config.enableExecute = this.config.enableApply;
                        }
                    });
                });
            }
            
            updatePanelStatus() {
                if (!this.controlPanel) return;
                
                const statusText = this.controlPanel.querySelector('.aa-status-text');
                const clicksText = this.controlPanel.querySelector('.aa-clicks');
                const startBtn = this.controlPanel.querySelector('.aa-start');
                const stopBtn = this.controlPanel.querySelector('.aa-stop');
                
                if (this.isRunning) {
                    statusText.textContent = 'Running';
                    statusText.className = 'aa-status-text running';
                    startBtn.disabled = true;
                    stopBtn.disabled = false;
                } else {
                    statusText.textContent = 'Stopped';
                    statusText.className = 'aa-status-text stopped';
                    startBtn.disabled = false;
                    stopBtn.disabled = true;
                }
                
                clicksText.textContent = `${this.totalClicks} clicks`;
            }
            
            logToPanel(message, type = 'info') {
                if (!this.controlPanel) return;
                
                // Create unique message key to prevent duplicates
                const messageKey = `${type}:${message}`;
                const now = Date.now();
                
                // Skip if same message was logged within last 2 seconds
                if (this.loggedMessages.has(messageKey)) {
                    return;
                }
                
                // Add to logged messages and clean up old entries
                this.loggedMessages.add(messageKey);
                setTimeout(() => this.loggedMessages.delete(messageKey), 2000);
                
                const logContainer = this.controlPanel.querySelector('.aa-log');
                const logEntry = document.createElement('div');
                logEntry.className = `aa-log-entry ${type}`;
                logEntry.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
                
                logContainer.appendChild(logEntry);
                logContainer.scrollTop = logContainer.scrollHeight;
                
                // Keep only last 20 entries
                while (logContainer.children.length > 20) {
                    logContainer.removeChild(logContainer.firstChild);
                }
            }
            
            showControlPanel() {
                if (!this.controlPanel) this.createControlPanel();
                this.controlPanel.style.display = 'block';
            }
            
            hideControlPanel() {
                if (this.controlPanel) {
                    this.controlPanel.style.display = 'none';
                }
            }
            
            log(message) {
                const timestamp = new Date().toISOString();
                const prefix = '[AutoAccept]';
                const fullMessage = `${prefix} ${timestamp} - ${message}`;
                
                // Console logging
                console.log(fullMessage);
                
                // Panel logging
                this.logToPanel(message, 'info');
            }
            
            // Find the input box and check its previous siblings for buttons
            findAcceptButtons() {
                const buttons = [];
                
                // Find the input box
                const inputBox = document.querySelector('div.full-input-box');
                if (!inputBox) {
                    this.log('Input box not found');
                    return buttons;
                }
                
                // Check previous sibling elements
                let currentElement = inputBox.previousElementSibling;
                let searchDepth = 0;
                
                while (currentElement && searchDepth < 5) {
                    // Look for any clickable elements containing "Accept" text
                    const acceptElements = this.findAcceptInElement(currentElement);
                    buttons.push(...acceptElements);
                    
                    currentElement = currentElement.previousElementSibling;
                    searchDepth++;
                }
                
                return buttons;
            }
            
            // Find accept buttons within a specific element
            findAcceptInElement(element) {
                const buttons = [];
                
                // Get all clickable elements (divs, buttons, spans with click handlers)
                const clickableSelectors = [
                    'div[class*="button"]',
                    'button',
                    'div[onclick]',
                    'div[style*="cursor: pointer"]',
                    'div[style*="cursor:pointer"]',
                    '[class*="anysphere"]',
                    '[class*="cursor-button"]',
                    '[class*="text-button"]',
                    '[class*="primary-button"]',
                    '[class*="secondary-button"]'
                ];
                
                for (const selector of clickableSelectors) {
                    const elements = element.querySelectorAll(selector);
                    for (const el of elements) {
                        if (this.isAcceptButton(el)) {
                            buttons.push(el);
                        }
                    }
                }
                
                // Also check the element itself
                if (this.isAcceptButton(element)) {
                    buttons.push(element);
                }
                
                return buttons;
            }
            
            // Check if element is an Accept button
            isAcceptButton(element) {
                if (!element || !element.textContent) return false;
                
                const text = element.textContent.toLowerCase().trim();
                
                // Check each pattern based on configuration
                const patterns = [
                    { pattern: 'accept all', enabled: this.config.enableAcceptAll },
                    { pattern: 'accept', enabled: this.config.enableAccept },
                    { pattern: 'run command', enabled: this.config.enableRunCommand },
                    { pattern: 'run', enabled: this.config.enableRun },
                    { pattern: 'apply', enabled: this.config.enableApply },
                    { pattern: 'execute', enabled: this.config.enableExecute }
                ];
                
                // Check if text matches any enabled pattern
                const matchesEnabledPattern = patterns.some(({ pattern, enabled }) => 
                    enabled && text.includes(pattern)
                );
                
                if (!matchesEnabledPattern) return false;
                
                const isVisible = this.isElementVisible(element);
                const isClickable = this.isElementClickable(element);
                
                return isVisible && isClickable;
            }
            
            // Check if element is visible
            isElementVisible(element) {
                const style = window.getComputedStyle(element);
                const rect = element.getBoundingClientRect();
                
                return (
                    style.display !== 'none' &&
                    style.visibility !== 'hidden' &&
                    parseFloat(style.opacity) > 0.1 &&
                    rect.width > 0 &&
                    rect.height > 0
                );
            }
            
            // Check if element is clickable
            isElementClickable(element) {
                const style = window.getComputedStyle(element);
                return (
                    style.pointerEvents !== 'none' &&
                    !element.disabled &&
                    !element.hasAttribute('disabled')
                );
            }
            
            // Click element with multiple strategies
            clickElement(element) {
                try {
                    // Extract file info and button type before clicking
                    const fileInfo = this.extractFileInfo(element);
                    const buttonText = element.textContent.trim().toLowerCase();
                    
                    const rect = element.getBoundingClientRect();
                    const x = rect.left + rect.width / 2;
                    const y = rect.top + rect.height / 2;
                    
                    // Strategy 1: Direct click
                    element.click();
                    
                    // Strategy 2: Mouse events
                    const mouseEvent = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                        clientX: x,
                        clientY: y
                    });
                    element.dispatchEvent(mouseEvent);
                    
                    // Strategy 3: Focus and Enter
                    if (element.focus) element.focus();
                    const enterEvent = new KeyboardEvent('keydown', {
                        key: 'Enter',
                        code: 'Enter',
                        keyCode: 13,
                        bubbles: true
                    });
                    element.dispatchEvent(enterEvent);
                    
                    // Track file analytics if we have file info
                    if (fileInfo) {
                        this.trackFileAcceptance(fileInfo, buttonText);
                    } else {
                        // Still track time saved even without file info
                        this.calculateTimeSaved(buttonText);
                        this.logToPanel(`✓ Clicked: ${element.textContent.trim()}`, 'info');
                    }
                    
                    return true;
                } catch (error) {
                    this.logToPanel(`Failed to click: ${error.message}`, 'warning');
                    return false;
                }
            }
            
            // Main execution
            checkAndClick() {
                try {
                    const buttons = this.findAcceptButtons();
                    
                    if (buttons.length === 0) {
                        // Don't spam the log for "no buttons found"
                        return;
                    }
                    
                    // Click the first button found
                    const button = buttons[0];
                    const buttonText = button.textContent.trim().substring(0, 30);
                    
                    const success = this.clickElement(button);
                    if (success) {
                        this.totalClicks++;
                        this.updatePanelStatus();
                    }
                    
                } catch (error) {
                    this.log(`Error executing: ${error.message}`);
                }
            }
            
            start() {
                if (this.isRunning) {
                    this.logToPanel('Already running', 'warning');
                    return;
                }
                
                this.isRunning = true;
                this.totalClicks = 0;
                this.updatePanelStatus();
                
                // Initial check
                this.checkAndClick();
                
                // Set interval
                this.monitorInterval = setInterval(() => {
                    this.checkAndClick();
                }, this.interval);
                
                this.logToPanel(`Started (${this.interval/1000}s interval)`, 'info');
            }
            
            stop() {
                if (!this.isRunning) {
                    this.logToPanel('Not running', 'warning');
                    return;
                }
                
                clearInterval(this.monitorInterval);
                this.isRunning = false;
                this.updatePanelStatus();
                this.logToPanel(`Stopped (${this.totalClicks} clicks)`, 'info');
            }
            
            status() {
                return {
                    isRunning: this.isRunning,
                    interval: this.interval,
                    totalClicks: this.totalClicks,
                    config: this.config
                };
            }
            
            // Configuration control methods
            enableOnly(buttonTypes) {
                // Disable all first
                Object.keys(this.config).forEach(key => {
                    this.config[key] = false;
                });
                
                // Enable specified types
                buttonTypes.forEach(type => {
                    const configKey = `enable${type.charAt(0).toUpperCase() + type.slice(1)}`;
                    if (this.config.hasOwnProperty(configKey)) {
                        this.config[configKey] = true;
                        this.log(`Enabled ${type} buttons`);
                    }
                });
                
                this.log(`Configuration updated: Only ${buttonTypes.join(', ')} buttons enabled`);
            }
            
            enableAll() {
                Object.keys(this.config).forEach(key => {
                    this.config[key] = true;
                });
                this.log('All button types enabled');
            }
            
            disableAll() {
                Object.keys(this.config).forEach(key => {
                    this.config[key] = false;
                });
                this.log('All button types disabled');
            }
            
            toggle(buttonType) {
                const configKey = `enable${buttonType.charAt(0).toUpperCase() + buttonType.slice(1)}`;
                if (this.config.hasOwnProperty(configKey)) {
                    this.config[configKey] = !this.config[configKey];
                    this.log(`${buttonType} buttons ${this.config[configKey] ? 'enabled' : 'disabled'}`);
                } else {
                    this.log(`Unknown button type: ${buttonType}`);
                }
            }
            
            enable(buttonType) {
                const configKey = `enable${buttonType.charAt(0).toUpperCase() + buttonType.slice(1)}`;
                if (this.config.hasOwnProperty(configKey)) {
                    this.config[configKey] = true;
                    this.log(`${buttonType} buttons enabled`);
                } else {
                    this.log(`Unknown button type: ${buttonType}`);
                }
            }
            
            disable(buttonType) {
                const configKey = `enable${buttonType.charAt(0).toUpperCase() + buttonType.slice(1)}`;
                if (this.config.hasOwnProperty(configKey)) {
                    this.config[configKey] = false;
                    this.log(`${buttonType} buttons disabled`);
                } else {
                    this.log(`Unknown button type: ${buttonType}`);
                }
            }
            
            // Manual search for debugging
            debugSearch() {
                this.log('=== DEBUG SEARCH ===');
                const inputBox = document.querySelector('div.full-input-box');
                if (!inputBox) {
                    this.log('No input box found');
                    return;
                }
                
                this.log('Input box found, checking siblings...');
                
                let currentElement = inputBox.previousElementSibling;
                let siblingIndex = 1;
                
                while (currentElement && siblingIndex <= 10) {
                    this.log(`Sibling ${siblingIndex}: ${currentElement.tagName} ${currentElement.className}`);
                    
                    // Check for any text content
                    const text = currentElement.textContent ? currentElement.textContent.trim() : '';
                    if (text) {
                        this.log(`  Text: "${text.substring(0, 100)}"`);
                        
                        // Check specifically for run/accept patterns
                        const patterns = ['accept', 'run', 'execute', 'apply'];
                        const foundPatterns = patterns.filter(pattern => text.toLowerCase().includes(pattern));
                        if (foundPatterns.length > 0) {
                            this.log(`  >>> Contains patterns: ${foundPatterns.join(', ')}`);
                        }
                    }
                    
                    // Check for buttons in this sibling
                    const buttons = this.findAcceptInElement(currentElement);
                    if (buttons.length > 0) {
                        this.log(`  Found ${buttons.length} clickable buttons!`);
                        buttons.forEach((btn, i) => {
                            this.log(`    Button ${i+1}: "${btn.textContent.trim().substring(0, 50)}"`);
                        });
                    }
                    
                    currentElement = currentElement.previousElementSibling;
                    siblingIndex++;
                }
                
                this.log('=== END DEBUG ===');
            }
        }
        
        globalThis.SimpleAutoAccept = SimpleAutoAccept;
    }
    
    // Initialize
    if (!globalThis.simpleAccept) {
        globalThis.simpleAccept = new globalThis.SimpleAutoAccept(2000);
        
        // Expose controls
        globalThis.startAccept = () => globalThis.simpleAccept.start();
        globalThis.stopAccept = () => globalThis.simpleAccept.stop();
        globalThis.acceptStatus = () => globalThis.simpleAccept.status();
        globalThis.debugAccept = () => globalThis.simpleAccept.debugSearch();
        
        // Force log test function
        globalThis.testLogs = () => {
            console.log('TEST LOG 1 - console.log');
            console.info('TEST LOG 2 - console.info');
            console.warn('TEST LOG 3 - console.warn');
            console.error('TEST LOG 4 - console.error');
            alert('TEST: Console logging test completed. Check console above.');
            return 'Logging test completed';
        };
        
        // Configuration controls
        globalThis.enableOnly = (types) => globalThis.simpleAccept.enableOnly(types);
        globalThis.enableAll = () => globalThis.simpleAccept.enableAll();
        globalThis.disableAll = () => globalThis.simpleAccept.disableAll();
        globalThis.toggleButton = (type) => globalThis.simpleAccept.toggle(type);
        globalThis.enableButton = (type) => globalThis.simpleAccept.enable(type);
        globalThis.disableButton = (type) => globalThis.simpleAccept.disable(type);
        
        // Analytics controls
        globalThis.exportAnalytics = () => globalThis.simpleAccept.exportAnalytics();
        globalThis.clearAnalytics = () => globalThis.simpleAccept.clearAnalytics();
        globalThis.clearStorage = () => globalThis.simpleAccept.clearStorage();
        globalThis.validateData = () => globalThis.simpleAccept.validateData();
        globalThis.toggleDebug = () => globalThis.simpleAccept.toggleDebug();
        globalThis.calibrateWorkflow = (manualSeconds, autoMs) => globalThis.simpleAccept.calibrateWorkflowTimes(manualSeconds, autoMs);
        globalThis.showAnalytics = () => {
            globalThis.simpleAccept.switchTab('analytics');
            console.log('Analytics tab opened in control panel');
        };
        
        // Force visible startup message
        const startupMsg = '[SimpleAutoAccept] SCRIPT LOADED AND ACTIVE!';
        console.log(startupMsg);
        console.info(startupMsg);
        console.warn(startupMsg);
        
        // Also create visual notification
        try {
            const notification = document.createElement('div');
            notification.textContent = '✅ AutoAccept Control Panel Ready! Now with File Analytics - Click Analytics tab!';
            notification.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);background:#4CAF50;color:white;padding:10px 20px;border-radius:5px;z-index:99999;font-weight:bold;max-width:400px;text-align:center;';
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 4000);
        } catch (e) {
            // Ignore
        }
        
        console.log('Commands: startAccept(), stopAccept(), acceptStatus(), debugAccept()');
        console.log('Analytics: showAnalytics(), exportAnalytics(), clearAnalytics(), clearStorage(), validateData()');
        console.log('Debug: toggleDebug() - Enable/disable debug logging');
        console.log('Calibration: calibrateWorkflow(manualSeconds, autoMs) - Adjust workflow timing');
        console.log('Config: enableOnly([types]), enableAll(), disableAll(), toggleButton(type)');
        console.log('Types: "acceptAll", "accept", "run", "runCommand", "apply", "execute"');
    }
})(); 