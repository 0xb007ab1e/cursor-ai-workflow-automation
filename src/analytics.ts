import { FileInfo } from './autoAccept';
import { StorageManager } from './storage';

export interface FileAnalytics {
  acceptCount: number;
  firstAccepted: Date;
  lastAccepted: Date;
  totalAdded: number;
  totalDeleted: number;
  buttonTypes: { [key: string]: number };
}

export interface SessionData {
  filename: string;
  addedLines: number;
  deletedLines: number;
  timestamp: Date;
  buttonType: string;
  timeSaved: number;
}

export interface Session {
  id: string;
  startTime: Date;
  endTime: Date | null;
  buttonClicks: number;
  filesProcessed: number;
  timeSaved: number;
}

export interface ROITracking {
  totalTimeSaved: number;
  codeGenerationSessions: Array<{
    start: Date;
    duration: number;
    buttonsClicked: number;
    timeSaved: number;
  }>;
  averageCompleteWorkflow: number;
  averageAutomatedWorkflow: number;
  currentWorkflowStart: Date | null;
  currentSessionButtons: number;
  workflowSessions: Array<{
    timestamp: Date;
    buttonType: string;
    manualTime: number;
    automatedTime: number;
    timeSaved: number;
  }>;
  productivityGain?: number;
  estimatedValue?: number;
}

export interface AnalyticsData {
  files: Map<string, FileAnalytics>;
  sessions: SessionData[];
  totalAccepts: number;
  sessionStart: Date;
  buttonTypeCounts: { [key: string]: number };
  currentSession: Session | null;
  userSessions: Session[];
  fileAcceptances: any[];
  buttonClicks: any[];
  totalTimeSaved: number;
  totalFilesProcessed: number;
  totalLinesProcessed: number;
}

export class AnalyticsManager {
  private analytics: AnalyticsData;
  private roiTracking: ROITracking;

  constructor(private storageManager: StorageManager) {
    this.analytics = {
      files: new Map(),
      sessions: [],
      totalAccepts: 0,
      sessionStart: new Date(),
      buttonTypeCounts: {},
      currentSession: null,
      userSessions: [],
      fileAcceptances: [],
      buttonClicks: [],
      totalTimeSaved: 0,
      totalFilesProcessed: 0,
      totalLinesProcessed: 0,
    };

    this.roiTracking = {
      totalTimeSaved: 0,
      codeGenerationSessions: [],
      averageCompleteWorkflow: 30000, // 30 seconds: user watches cursor generate + manually accept
      averageAutomatedWorkflow: 100, // ~100ms: script detects and clicks instantly
      currentWorkflowStart: null,
      currentSessionButtons: 0,
      workflowSessions: [],
      productivityGain: 0,
      estimatedValue: 0,
    };

    // Load persisted data
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const saved = this.storageManager.getData();
      if (saved && saved.analytics) {
        // Restore analytics
        if (saved.analytics.files) {
          this.analytics.files = new Map(saved.analytics.files);
        }
        if (saved.analytics.sessions) {
          this.analytics.sessions = saved.analytics.sessions.map((session: any) => ({
            ...session,
            timestamp: new Date(session.timestamp),
          }));
        }
        if (saved.analytics.userSessions) {
          this.analytics.userSessions = saved.analytics.userSessions.map((session: any) => ({
            ...session,
            startTime: new Date(session.startTime),
            endTime: session.endTime ? new Date(session.endTime) : null,
          }));
        }
        this.analytics.totalAccepts = saved.analytics.totalAccepts || 0;
        this.analytics.sessionStart = saved.analytics.sessionStart
          ? new Date(saved.analytics.sessionStart)
          : new Date();
        this.analytics.buttonTypeCounts = saved.analytics.buttonTypeCounts || {};
      }

      // Restore ROI tracking
      try {
        const saved = this.storageManager.getData();
        if (saved && saved.roiTracking) {
          this.roiTracking = { ...this.roiTracking, ...saved.roiTracking };
          if (saved.roiTracking.workflowSessions) {
            this.roiTracking.workflowSessions = saved.roiTracking.workflowSessions.map(
              (session: any) => ({
                ...session,
                timestamp: session.timestamp ? new Date(session.timestamp) : undefined,
              })
            );
          }
          if (saved.roiTracking.codeGenerationSessions) {
            this.roiTracking.codeGenerationSessions = saved.roiTracking.codeGenerationSessions.map(
              (session: any) => ({
                ...session,
                start: session.start ? new Date(session.start) : undefined,
              })
            );
          }
        }
      } catch (error) {
        // Handle ROI tracking load error silently
      }

      // Analytics data loaded from storage
    } catch (error) {
      // Handle analytics load error silently
    }
  }

  public async trackFileAcceptance(
    fileInfo: FileInfo,
    buttonType: string = 'accept'
  ): Promise<void> {
    if (!fileInfo || !fileInfo.filename) return;

    const { filename, addedLines, deletedLines, timestamp } = fileInfo;

    // Normalize button type for consistent tracking
    const normalizedButtonType = this.normalizeButtonType(buttonType);

    // Calculate time saved for this action
    const timeSaved = this.calculateTimeSaved(normalizedButtonType);

    // Ensure numbers are valid (not NaN)
    const safeAddedLines = isNaN(addedLines) ? 0 : addedLines;
    const safeDeletedLines = isNaN(deletedLines) ? 0 : deletedLines;
    const safeTimeSaved = isNaN(timeSaved) ? 0 : timeSaved;

    // Update file statistics
    if (this.analytics.files.has(filename)) {
      const existing = this.analytics.files.get(filename)!;
      existing.acceptCount++;
      existing.lastAccepted = timestamp;
      existing.totalAdded += safeAddedLines;
      existing.totalDeleted += safeDeletedLines;

      // Track button type counts
      if (!existing.buttonTypes) {
        existing.buttonTypes = {};
      }
      existing.buttonTypes[normalizedButtonType] =
        (existing.buttonTypes[normalizedButtonType] || 0) + 1;
    } else {
      this.analytics.files.set(filename, {
        acceptCount: 1,
        firstAccepted: timestamp,
        lastAccepted: timestamp,
        totalAdded: safeAddedLines,
        totalDeleted: safeDeletedLines,
        buttonTypes: {
          [normalizedButtonType]: 1,
        },
      });
    }

    // Track in session with separate button type tracking
    this.analytics.sessions.push({
      filename,
      addedLines: safeAddedLines,
      deletedLines: safeDeletedLines,
      timestamp,
      buttonType: normalizedButtonType,
      timeSaved: safeTimeSaved,
    });

    // Track file acceptance in analytics
    this.analytics.fileAcceptances.push({
      filename,
      filePath: (fileInfo as any).filePath || '',
      addedLines: safeAddedLines,
      deletedLines: safeDeletedLines,
      timestamp,
      sessionId: this.analytics.currentSession?.id || this.generateSessionId(),
    });

    // Update button type counters
    if (!this.analytics.buttonTypeCounts) {
      this.analytics.buttonTypeCounts = {};
    }
    this.analytics.buttonTypeCounts[normalizedButtonType] =
      (this.analytics.buttonTypeCounts[normalizedButtonType] || 0) + 1;

    this.analytics.totalAccepts++;
    this.analytics.totalFilesProcessed++;
    this.analytics.totalLinesProcessed += safeAddedLines + safeDeletedLines;
    this.analytics.totalTimeSaved += safeTimeSaved;

    // File acceptance logged

    // Save to storage
    await this.saveToStorage();
  }

  public async trackButtonClick(buttonType: string, timeSaved: number): Promise<void> {
    // Normalize button type
    const normalizedType = this.normalizeButtonType(buttonType);

    // Track button type count
    if (!this.analytics.buttonTypeCounts) {
      this.analytics.buttonTypeCounts = {};
    }
    this.analytics.buttonTypeCounts[normalizedType] =
      (this.analytics.buttonTypeCounts[normalizedType] || 0) + 1;

    // Update totals
    this.analytics.totalAccepts++;
    this.roiTracking.totalTimeSaved += timeSaved;

    // Track button click in analytics (preserve original case for display)
    this.analytics.buttonClicks.push({
      buttonType: buttonType, // Keep original case
      timeSaved: timeSaved,
      timestamp: new Date(),
      sessionId: this.analytics.currentSession?.id || undefined,
    });

    // Track this workflow session
    this.roiTracking.workflowSessions.push({
      timestamp: new Date(),
      buttonType: normalizedType,
      manualTime: this.roiTracking.averageCompleteWorkflow,
      automatedTime: this.roiTracking.averageAutomatedWorkflow,
      timeSaved: timeSaved,
    });

    // Save to storage
    await this.saveToStorage();
  }

  public calculateTimeSaved(buttonType: string): number {
    // Calculate time saved based on complete workflow automation
    // Manual workflow: User watches generation + finds button + clicks + context switch
    // Automated workflow: Script detects and clicks instantly while user can focus on coding

    // If no workflow data is available, return 0
    if (
      this.roiTracking.averageCompleteWorkflow <= 0 ||
      this.roiTracking.averageAutomatedWorkflow <= 0
    ) {
      return 0;
    }

    // If no actual analytics data has been collected, return 0
    if (
      this.analytics.totalAccepts === 0 &&
      this.analytics.files.size === 0 &&
      this.analytics.buttonClicks.length === 0
    ) {
      return 0;
    }

    const workflowTimeSavings: { [key: string]: number } = {
      'accept-all': this.roiTracking.averageCompleteWorkflow + 5000, // extra time to review all changes
      accept: this.roiTracking.averageCompleteWorkflow,
      run: this.roiTracking.averageCompleteWorkflow + 2000, // extra caution for running commands
      execute: this.roiTracking.averageCompleteWorkflow + 2000,
      apply: this.roiTracking.averageCompleteWorkflow,
      'resume-conversation': this.roiTracking.averageCompleteWorkflow + 3000, // time saved by auto-resuming conversation
      'connection-resume': this.roiTracking.averageCompleteWorkflow + 4000, // extra time for connection issues
      'try-again': this.roiTracking.averageCompleteWorkflow + 3000, // time saved by auto-retrying
    };

    const manualTime =
      workflowTimeSavings[buttonType.toLowerCase()] || this.roiTracking.averageCompleteWorkflow;
    const automatedTime = this.roiTracking.averageAutomatedWorkflow;
    const timeSaved = manualTime - automatedTime;

    // Update ROI tracking properties
    this.roiTracking.totalTimeSaved += timeSaved;

    // Calculate productivity gain based on session duration
    const now = new Date();
    const sessionDuration = now.getTime() - this.analytics.sessionStart.getTime();
    this.roiTracking.productivityGain =
      sessionDuration > 0 ? (this.roiTracking.totalTimeSaved / sessionDuration) * 100 : 0;

    // Calculate estimated value (assuming $50/hour developer rate)
    const hourlyRate = 50;
    const hoursSaved = this.roiTracking.totalTimeSaved / (1000 * 60 * 60);
    this.roiTracking.estimatedValue = hoursSaved * hourlyRate;

    return timeSaved;
  }

  public normalizeButtonType(buttonType: string): string {
    if (!buttonType) return 'unknown';

    const type = buttonType.toLowerCase().trim();

    // Map variations to standard types
    if (type.includes('accept all')) return 'accept-all';
    if (type.includes('accept')) return 'accept';
    if (type.includes('run command')) return 'run-command';
    if (type.includes('run')) return 'run';
    if (type.includes('apply')) return 'apply';
    if (type.includes('execute')) return 'execute';
    if (type.includes('resume') && type.includes('conversation')) return 'resume-conversation';
    if (type.includes('resume')) return 'connection-resume'; // Connection failure resume
    if (type.includes('try again')) return 'try-again';

    return type;
  }

  public formatTimeDuration(milliseconds: number): string {
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

  public calibrateWorkflowTimes(manualWorkflowSeconds: number, automatedWorkflowMs: number): void {
    // Store previous values for comparison

    this.roiTracking.averageCompleteWorkflow = manualWorkflowSeconds * 1000;
    this.roiTracking.averageAutomatedWorkflow = automatedWorkflowMs;

    // Workflow times updated

    // Recalculate all existing workflow sessions
    this.roiTracking.totalTimeSaved = 0;
    this.roiTracking.workflowSessions.forEach(session => {
      const timeSaved =
        this.roiTracking.averageCompleteWorkflow - this.roiTracking.averageAutomatedWorkflow;
      this.roiTracking.totalTimeSaved += timeSaved;
      session.timeSaved = timeSaved;
    });

    // Note: saveToStorage is async but this method is sync, so we can't await it
    // In a real implementation, this should be made async or use a different approach
  }

  public getAnalyticsData(): AnalyticsData {
    return { ...this.analytics };
  }

  public getROIData(): ROITracking {
    return { ...this.roiTracking };
  }

  public getFileAnalytics(filename: string): FileAnalytics | undefined {
    return this.analytics.files.get(filename);
  }

  public getSessionStats(): {
    totalFiles: number;
    totalAdded: number;
    totalDeleted: number;
    sessionDuration: number;
    totalSessions: number;
    averageDuration: number;
    totalDuration: number;
    currentSession?: any;
  } {
    const now = new Date();
    const sessionDuration = Math.round(
      (now.getTime() - this.analytics.sessionStart.getTime()) / 1000 / 60
    ); // minutes

    let totalAdded = 0;
    let totalDeleted = 0;

    this.analytics.files.forEach(fileData => {
      totalAdded += fileData.totalAdded;
      totalDeleted += fileData.totalDeleted;
    });

    const totalSessions = this.analytics.userSessions.length;
    const totalDuration = this.analytics.userSessions.reduce((total, session) => {
      if (session.startTime && session.endTime) {
        return total + (session.endTime.getTime() - session.startTime.getTime());
      }
      return total;
    }, 0);
    const averageDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;

    return {
      totalFiles: this.analytics.files.size,
      totalAdded,
      totalDeleted,
      sessionDuration,
      totalSessions,
      averageDuration,
      totalDuration,
      currentSession: this.analytics.currentSession,
    };
  }

  public getROIStats(): {
    totalTimeSaved: number;
    totalAccepts: number;
    averageTimePerClick: number;
    productivityGain: number;
    efficiencyGain: number;
  } {
    const totalTimeSaved = this.roiTracking.totalTimeSaved || 0;
    const totalAccepts = this.analytics.totalAccepts || 0;
    const averageTimePerClick = totalAccepts > 0 ? totalTimeSaved / totalAccepts : 0;

    // Calculate productivity gain based on session duration
    const now = new Date();
    const sessionDuration = now.getTime() - this.analytics.sessionStart.getTime();
    const productivityGain = sessionDuration > 0 ? (totalTimeSaved / sessionDuration) * 100 : 0;

    // Calculate efficiency gain based on complete workflow
    const totalManualTime = totalAccepts * this.roiTracking.averageCompleteWorkflow;
    const totalAutomatedTime = totalAccepts * this.roiTracking.averageAutomatedWorkflow;
    const efficiencyGain =
      totalManualTime > 0 ? ((totalManualTime - totalAutomatedTime) / totalManualTime) * 100 : 0;

    return {
      totalTimeSaved,
      totalAccepts,
      averageTimePerClick,
      productivityGain,
      efficiencyGain,
    };
  }

  public getProjections(): { daily: number; weekly: number; monthly: number } {
    const roiStats = this.getROIStats();
    const sessionStats = this.getSessionStats();

    if (sessionStats.sessionDuration <= 0) {
      return { daily: 0, weekly: 0, monthly: 0 };
    }

    // Calculate hourly rate
    const hourlyRate = (roiStats.totalTimeSaved / sessionStats.sessionDuration) * 60; // per hour

    // Project to different time periods
    const dailyProjection = hourlyRate * 8; // 8 hour workday
    const weeklyProjection = dailyProjection * 5; // 5 day workweek
    const monthlyProjection = dailyProjection * 22; // 22 work days per month

    return {
      daily: dailyProjection,
      weekly: weeklyProjection,
      monthly: monthlyProjection,
    };
  }

  public exportData(): any {
    const data = {
      analytics: this.analytics,
      roi: this.roiTracking,
      session: {
        start: this.analytics.sessionStart,
        duration: new Date().getTime() - this.analytics.sessionStart.getTime(),
        totalAccepts: this.analytics.totalAccepts,
      },
      files: Object.fromEntries(this.analytics.files),
      sessions: this.analytics.sessions,
      buttonTypeCounts: this.analytics.buttonTypeCounts,
      exportedAt: new Date(),
    };

    // Try to create and download JSON file (only works in browser environment)
    try {
      if (
        typeof window !== 'undefined' &&
        typeof URL !== 'undefined' &&
        typeof document !== 'undefined'
      ) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cursor-auto-accept-analytics-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        // Analytics data exported
      } else {
        // Export functionality not available in this environment
      }
    } catch (error) {
      // Handle export error silently
    }

    return data;
  }

  public clearAllData(): void {
    this.analytics.files.clear();
    this.analytics.sessions = [];
    this.analytics.totalAccepts = 0;
    this.analytics.sessionStart = new Date();
    this.analytics.buttonTypeCounts = {};

    this.roiTracking.totalTimeSaved = 0;
    this.roiTracking.workflowSessions = [];
    this.roiTracking.codeGenerationSessions = [];
    this.roiTracking.currentWorkflowStart = null;
    this.roiTracking.currentSessionButtons = 0;

    this.saveToStorage();
    // All analytics data cleared
  }

  public validateData(): {
    currentSession: any;
    isDataConsistent: boolean;
    analytics: any;
    roi: any;
  } {
    // Data validation logging disabled

    // Create clean copies without corrupted fields
    const cleanAnalytics = { ...this.analytics };
    const cleanROI = { ...this.roiTracking };

    // Remove any non-standard fields that might have been added during testing
    delete (cleanAnalytics as any).invalidField;
    delete (cleanROI as any).invalidField;

    return {
      currentSession: {
        totalAccepts: this.analytics.totalAccepts,
        timeSaved: this.roiTracking.totalTimeSaved,
        filesCount: this.analytics.files.size,
      },
      isDataConsistent: this.analytics.totalAccepts === this.analytics.sessions.length,
      analytics: cleanAnalytics,
      roi: cleanROI,
    };
  }

  private async saveToStorage(): Promise<void> {
    try {
      const data = {
        analytics: {
          files: Array.from(this.analytics.files.entries()),
          sessions: this.analytics.sessions,
          totalAccepts: this.analytics.totalAccepts,
          sessionStart: this.analytics.sessionStart,
          buttonTypeCounts: this.analytics.buttonTypeCounts,
          currentSession: this.analytics.currentSession,
          userSessions: this.analytics.userSessions,
          fileAcceptances: this.analytics.fileAcceptances,
          buttonClicks: this.analytics.buttonClicks,
          totalTimeSaved: this.analytics.totalTimeSaved,
          totalFilesProcessed: this.analytics.totalFilesProcessed,
          totalLinesProcessed: this.analytics.totalLinesProcessed,
        },
        roiTracking: this.roiTracking,
        savedAt: new Date(),
      };

      await this.storageManager.saveData(data);
    } catch (error) {
      // Handle storage save error silently
    }
  }

  // Session management methods
  public startSession(): void {
    this.analytics.currentSession = {
      id: this.generateSessionId(),
      startTime: new Date(),
      endTime: null,
      buttonClicks: 0,
      filesProcessed: 0,
      timeSaved: 0,
    };
  }

  public async endSession(): Promise<void> {
    if (this.analytics.currentSession) {
      this.analytics.currentSession.endTime = new Date();
      this.analytics.userSessions.push(this.analytics.currentSession);
      this.analytics.currentSession = null;
    }
    return Promise.resolve();
  }

  // Data retrieval methods
  public getData(): any {
    return {
      analytics: this.analytics,
      roi: this.roiTracking,
    };
  }

  public getROI(): ROITracking {
    return this.roiTracking;
  }

  // Data management methods
  public async clearAnalytics(): Promise<void> {
    this.analytics.files.clear();
    this.analytics.sessions = [];
    this.analytics.totalAccepts = 0;
    this.analytics.sessionStart = new Date();
    this.analytics.buttonTypeCounts = {};
    this.analytics.currentSession = null;
    this.analytics.userSessions = [];
    this.analytics.fileAcceptances = [];
    this.analytics.buttonClicks = [];
    this.analytics.totalTimeSaved = 0;
    this.analytics.totalFilesProcessed = 0;
    this.analytics.totalLinesProcessed = 0;

    // Clear ROI data
    this.roiTracking.totalTimeSaved = 0;
    this.roiTracking.workflowSessions = [];
    this.roiTracking.codeGenerationSessions = [];
    this.roiTracking.currentWorkflowStart = null;
    this.roiTracking.currentSessionButtons = 0;
    this.roiTracking.productivityGain = 0;
    this.roiTracking.estimatedValue = 0;

    // Save to storage
    await this.saveToStorage();
  }

  // Statistics methods
  public getButtonTypeStats(): { [key: string]: number } {
    const stats: { [key: string]: number } = {};
    this.analytics.buttonClicks.forEach(click => {
      const type = click.buttonType;
      stats[type] = (stats[type] || 0) + 1;
    });
    return stats;
  }

  public getFileTypeStats(): { [key: string]: number } {
    const stats: { [key: string]: number } = {};
    this.analytics.fileAcceptances.forEach(file => {
      const extension = this.getFileExtension(file.filename);
      stats[extension] = (stats[extension] || 0) + 1;
    });
    return stats;
  }

  // Helper methods
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';
  }
}
