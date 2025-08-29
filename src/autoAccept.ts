import * as vscode from 'vscode';
import { AnalyticsManager } from './analytics';
import { StorageManager } from './storage';
import { ButtonDetector } from './buttonDetector';
import { EventEmitter } from 'events';

export interface FileInfo {
  filename: string;
  filePath?: string;
  addedLines: number;
  deletedLines: number;
  timestamp: Date;
}

export interface DiffBlock {
  blockElement: Element;
  timestamp: Date;
  files: Array<{
    name: string;
    path: string;
    extension: string;
    hasIcon?: boolean;
  }>;
  changeType: 'addition' | 'deletion' | 'modification' | 'unknown';
  linesAdded?: number;
  linesDeleted?: number;
}

export interface ConversationContext {
  conversationElement: Element | null;
  totalMessages: number;
  recentDiffs: DiffBlock[];
  filesChanged: string[];
  lastActivity: Date | null;
}

export class AutoAcceptManager extends EventEmitter {
  private interval: number;
  private isRunningState: boolean;
  private monitorInterval: NodeJS.Timeout | null;
  private totalClicks: number;
  private debugMode: boolean;
  private ideType: 'cursor' | 'windsurf';
  private buttonDetector: ButtonDetector;
  private stateChangeEmitter: EventEmitter;
  private configOverride?: {
    interval?: number;
    debugMode?: boolean;
    buttonConfig?: {
      enableAcceptAll?: boolean;
      enableAccept?: boolean;
      enableRun?: boolean;
      enableApply?: boolean;
      enableResume?: boolean;
      enableConnectionResume?: boolean;
      enableTryAgain?: boolean;
    };
  };

  constructor(
    private analyticsManager: AnalyticsManager,
    private storageManager: StorageManager,
    configOverride?: {
      interval?: number;
      debugMode?: boolean;
      buttonConfig?: {
        enableAcceptAll?: boolean;
        enableAccept?: boolean;
        enableRun?: boolean;
        enableApply?: boolean;
        enableResume?: boolean;
        enableConnectionResume?: boolean;
        enableTryAgain?: boolean;
      };
    }
  ) {
    super();

    this.interval = 2000;
    this.isRunningState = false;
    this.monitorInterval = null;
    this.totalClicks = 0;
    this.debugMode = false;
    this.ideType = this.detectIDE();
    this.buttonDetector = new ButtonDetector(this.ideType);
    this.stateChangeEmitter = new EventEmitter();

    // Set config override if provided
    if (configOverride) {
      this.setConfigOverride(configOverride);
    }

    // Load configuration
    this.loadConfiguration();

    // Load persisted data
    this.loadFromStorage();

    this.log(`AutoAcceptManager initialized for ${this.ideType.toUpperCase()} IDE`);
  }

  private detectIDE(): 'cursor' | 'windsurf' {
    try {
      // Check for Windsurf-specific elements
      const windsurfIndicators = [
        'bg-ide-editor-background',
        'bg-ide-button-background',
        'text-ide-button-color',
      ];

      // Check for Cursor-specific elements
      const cursorIndicators = [
        'div.full-input-box',
        '.composer-code-block-container',
        '.anysphere-text-button',
      ];

      let windsurfScore = 0;
      let cursorScore = 0;

      // Check DOM for indicators
      windsurfIndicators.forEach(indicator => {
        if (document.querySelector(`[class*="${indicator}"]`)) {
          windsurfScore++;
        }
      });

      cursorIndicators.forEach(selector => {
        if (document.querySelector(selector)) {
          cursorScore++;
        }
      });

      // Check URL and title
      const url = window.location.href.toLowerCase();
      const title = document.title.toLowerCase();

      if (url.includes('windsurf') || title.includes('windsurf')) {
        windsurfScore += 2;
      }

      if (url.includes('cursor') || title.includes('cursor')) {
        cursorScore += 2;
      }

      return windsurfScore > cursorScore ? 'windsurf' : 'cursor';
    } catch (error) {
      this.log(`IDE detection error: ${error}`);
      return 'cursor'; // Default fallback
    }
  }

  private loadConfiguration(): void {
    if (this.configOverride) {
      // Use test configuration override
      this.interval = this.configOverride.interval || 2000;
      this.debugMode = this.configOverride.debugMode || false;

      if (this.configOverride.buttonConfig) {
        this.buttonDetector.updateConfiguration({
          enableAcceptAll: this.configOverride.buttonConfig.enableAcceptAll ?? true,
          enableAccept: this.configOverride.buttonConfig.enableAccept ?? true,
          enableRun: this.configOverride.buttonConfig.enableRun ?? true,
          enableApply: this.configOverride.buttonConfig.enableApply ?? true,
          enableResume: this.configOverride.buttonConfig.enableResume ?? true,
          enableConnectionResume: this.configOverride.buttonConfig.enableConnectionResume ?? true,
          enableTryAgain: this.configOverride.buttonConfig.enableTryAgain ?? true,
        });
      }
    } else {
      // Use VS Code configuration
      try {
        const config = vscode.workspace.getConfiguration('cursorAutoAccept');
        this.interval = config.get('interval', 2000);
        this.debugMode = config.get('debugMode', false);

        // Load button configuration
        this.buttonDetector.updateConfiguration({
          enableAcceptAll: config.get('enableAcceptAll', true),
          enableAccept: config.get('enableAccept', true),
          enableRun: config.get('enableRun', true),
          enableApply: config.get('enableApply', true),
          enableResume: config.get('enableResume', true),
          enableConnectionResume: config.get('enableConnectionResume', true),
          enableTryAgain: config.get('enableTryAgain', true),
        });
      } catch (error) {
        this.log(`Failed to load VS Code configuration: ${error}`);
        // Use defaults
        this.buttonDetector.updateConfiguration({
          enableAcceptAll: true,
          enableAccept: true,
          enableRun: true,
          enableApply: true,
          enableResume: true,
          enableConnectionResume: true,
          enableTryAgain: true,
        });
      }
    }
  }

  private loadFromStorage(): void {
    try {
      const saved = this.storageManager.getData();
      if (saved) {
        this.totalClicks = saved.totalClicks || 0;
        this.log('Data loaded from storage');
      }
    } catch (error) {
      this.log(`Failed to load from storage: ${error}`);
    }
  }

  public start(): void {
    if (this.isRunningState) {
      this.log('Already running');
      return;
    }

    this.isRunningState = true;
    this.totalClicks = 0;
    this.emitStateChange();

    // Initial check
    this.checkAndClick();

    // Set interval
    this.monitorInterval = setInterval(() => {
      this.checkAndClick();
    }, this.interval);

    this.log(`Started (${this.interval / 1000}s interval)`);
    void this.saveToStorage();
  }

  public stop(): void {
    if (!this.isRunningState) {
      this.log('Not running');
      return;
    }

    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }

    this.isRunningState = false;
    this.emitStateChange();
    this.log(`Stopped (${this.totalClicks} clicks)`);
  }

  private checkAndClick(): void {
    try {
      const buttons = this.buttonDetector.findAcceptButtons();

      if (buttons.length === 0) {
        return; // No buttons found
      }

      // Click the first button found
      const button = buttons[0];

      const success = this.clickElement(button);
      if (success) {
        this.totalClicks++;
        this.emitStateChange();
      }
    } catch (error) {
      this.log(`Error executing: ${error}`);
    }
  }

  private clickElement(element: Element): boolean {
    try {
      // Determine button type for tracking
      const buttonText = element.textContent?.trim().toLowerCase() || '';
      const isResumeLink = this.buttonDetector.isResumeLink(element);

      if (this.debugMode) {
        this.log(`Clicking element: "${buttonText}" (Resume: ${isResumeLink})`);
      }

      // Extract file info before clicking (only for non-resume buttons)
      let fileInfo: FileInfo | null = null;
      if (!isResumeLink) {
        fileInfo = this.extractFileInfo();
      }

      // Get element position
      const rect = element.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      // Dispatch comprehensive event sequence
      this.dispatchClickEvents(element, x, y);

      // Handle different button types for analytics
      if (isResumeLink) {
        this.handleResumeClick();
      } else if (buttonText === 'resume' && !isResumeLink) {
        this.handleConnectionResumeClick();
      } else if (buttonText === 'try again') {
        this.handleTryAgainClick();
      } else if (fileInfo) {
        this.handleFileAcceptance(fileInfo, buttonText);
      } else {
        this.handleGenericClick(buttonText);
      }

      return true;
    } catch (error) {
      this.log(`Failed to click: ${error}`);
      return false;
    }
  }

  private dispatchClickEvents(element: Element, x: number, y: number): void {
    // Pointer events
    try {
      const pointerDown = new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: x,
        clientY: y,
        pointerType: 'mouse',
      });
      element.dispatchEvent(pointerDown);
    } catch (_) {
      // PointerEvent may not be supported
    }

    // Mouse events
    const mouseDown = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: x,
      clientY: y,
    });
    element.dispatchEvent(mouseDown);

    // Direct click
    (element as HTMLElement).click();

    // Mouse click event
    const mouseEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: x,
      clientY: y,
    });
    element.dispatchEvent(mouseEvent);

    // Complete event cycle
    const mouseUp = new MouseEvent('mouseup', {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: x,
      clientY: y,
    });
    element.dispatchEvent(mouseUp);

    try {
      const pointerUp = new PointerEvent('pointerup', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: x,
        clientY: y,
        pointerType: 'mouse',
      });
      element.dispatchEvent(pointerUp);
    } catch (_) {
      // Ignore if PointerEvent unsupported
    }

    // Focus and Enter key
    if ('focus' in element) {
      (element as HTMLElement).focus();
    }

    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      bubbles: true,
    });
    element.dispatchEvent(enterEvent);
  }

  private extractFileInfo(): FileInfo | null {
    try {
      if (this.debugMode) {
        this.log('Extracting file info...');
      }

      // Find the latest diff block in conversations div
      const conversationsDiv = document.querySelector('div.conversations');
      if (!conversationsDiv) {
        if (this.debugMode) this.log('No conversations div found');
        return null;
      }

      // Find all message bubbles with data-message-index, sorted by index (latest first)
      const messageBubbles = Array.from(
        conversationsDiv.querySelectorAll('[data-message-index]')
      ).sort((a, b) => {
        const indexA = parseInt(a.getAttribute('data-message-index') || '0');
        const indexB = parseInt(b.getAttribute('data-message-index') || '0');
        return indexB - indexA; // Descending order (latest first)
      });

      if (this.debugMode) {
        this.log(`Found ${messageBubbles.length} message bubbles`);
      }

      // Look for diff blocks in the latest few messages
      for (let i = 0; i < Math.min(5, messageBubbles.length); i++) {
        const bubble = messageBubbles[i];
        const messageIndex = bubble.getAttribute('data-message-index');

        if (this.debugMode) {
          this.log(`Checking message ${messageIndex}`);
        }

        // Look for code block containers within this message
        const codeBlocks = bubble.querySelectorAll(
          '.composer-code-block-container, .composer-tool-former-message, .composer-diff-block'
        );

        if (this.debugMode && codeBlocks.length > 0) {
          this.log(`Found ${codeBlocks.length} code blocks in message ${messageIndex}`);
        }

        for (const block of codeBlocks) {
          const fileInfo = this.extractFileInfoFromBlock(block);
          if (fileInfo) {
            if (this.debugMode) {
              this.log(`Successfully extracted file info: ${JSON.stringify(fileInfo)}`);
            }
            return fileInfo;
          }
        }
      }

      if (this.debugMode) {
        this.log('No file info found in recent messages');
      }
      return null;
    } catch (error) {
      this.log(`Error extracting file info: ${error}`);
      return null;
    }
  }

  private extractFileInfoFromBlock(block: Element): FileInfo | null {
    try {
      if (this.debugMode) {
        this.log(`Analyzing block with classes: ${block.className}`);
      }

      // Look for filename in multiple possible locations
      let filename: string | null = null;
      let addedLines = 0;
      let deletedLines = 0;

      // Method 1: .composer-code-block-filename span
      const filenameSpan =
        block.querySelector('.composer-code-block-filename span[style*="direction: ltr"]') ||
        block.querySelector('.composer-code-block-filename span') ||
        block.querySelector('.composer-code-block-filename');

      if (filenameSpan) {
        filename = filenameSpan.textContent?.trim() || null;
        if (this.debugMode && filename) {
          this.log(`Found filename via span: "${filename}"`);
        }
      }

      // Method 2: Look for any element with filename-like content
      if (!filename) {
        const allSpans = block.querySelectorAll('span');
        for (const span of allSpans) {
          const text = span.textContent?.trim();
          if (text && text.includes('.') && text.length < 100 && !text.includes(' ')) {
            const parts = text.split('.');
            if (parts.length >= 2 && parts[parts.length - 1].length <= 10) {
              filename = text;
              if (this.debugMode) {
                this.log(`Found filename via pattern matching: "${filename}"`);
              }
              break;
            }
          }
        }
      }

      // Extract diff stats from status elements
      const statusElements = block.querySelectorAll(
        '.composer-code-block-status span, span[style*="color"]'
      );

      if (this.debugMode) {
        this.log(`Found ${statusElements.length} status elements`);
      }

      for (const statusEl of statusElements) {
        const statusText = statusEl.textContent?.trim() || '';
        if (this.debugMode) {
          this.log(`Status text: "${statusText}"`);
        }

        // Look for +N/-N patterns
        const addedMatch = statusText.match(/\+(\d+)/);
        const deletedMatch = statusText.match(/-(\d+)/);

        if (addedMatch) {
          addedLines = Math.max(addedLines, parseInt(addedMatch[1]));
          if (this.debugMode) {
            this.log(`Found added lines: ${addedLines}`);
          }
        }
        if (deletedMatch) {
          deletedLines = Math.max(deletedLines, parseInt(deletedMatch[1]));
          if (this.debugMode) {
            this.log(`Found deleted lines: ${deletedLines}`);
          }
        }
      }

      if (filename) {
        const fileInfo: FileInfo = {
          filename,
          addedLines: addedLines || 0,
          deletedLines: deletedLines || 0,
          timestamp: new Date(),
        };

        if (this.debugMode) {
          this.log(`Created file info object: ${JSON.stringify(fileInfo)}`);
        }

        return fileInfo;
      }

      if (this.debugMode) {
        this.log('No filename found in this block');
      }
      return null;
    } catch (error) {
      if (this.debugMode) {
        this.log(`Error in extractFileInfoFromBlock: ${error}`);
      }
      return null;
    }
  }

  private handleResumeClick(): void {
    const timeSaved = this.analyticsManager.calculateTimeSaved('resume-conversation');
    this.log(`Resume Conversation clicked - Time saved: ${this.formatTimeDuration(timeSaved)}`);

    // Track in analytics
    this.analyticsManager.trackButtonClick('resume-conversation', timeSaved);
    void this.saveToStorage();
  }

  private handleConnectionResumeClick(): void {
    const timeSaved = this.analyticsManager.calculateTimeSaved('connection-resume');
    this.log(`Connection Resume clicked - Time saved: ${this.formatTimeDuration(timeSaved)}`);

    // Track in analytics
    this.analyticsManager.trackButtonClick('connection-resume', timeSaved);
    void this.saveToStorage();
  }

  private handleTryAgainClick(): void {
    const timeSaved = this.analyticsManager.calculateTimeSaved('try-again');
    this.log(`Try Again clicked - Time saved: ${this.formatTimeDuration(timeSaved)}`);

    // Track in analytics
    this.analyticsManager.trackButtonClick('try-again', timeSaved);
    void this.saveToStorage();
  }

  private handleFileAcceptance(fileInfo: FileInfo, buttonType: string): void {
    this.log(
      `File accepted: ${fileInfo.filename} (+${fileInfo.addedLines}/-${fileInfo.deletedLines}) - Button: ${buttonType}`
    );

    // Track file acceptance in analytics
    this.analyticsManager.trackFileAcceptance(fileInfo, buttonType);
    void this.saveToStorage();
  }

  private handleGenericClick(buttonType: string): void {
    const timeSaved = this.analyticsManager.calculateTimeSaved(buttonType);
    this.log(`Clicked: ${buttonType} - Time saved: ${this.formatTimeDuration(timeSaved)}`);

    // Track button click in analytics
    this.analyticsManager.trackButtonClick(buttonType, timeSaved);
    void this.saveToStorage();
  }

  private formatTimeDuration(milliseconds: number): string {
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

  private async saveToStorage(): Promise<void> {
    try {
      await this.storageManager.saveData({
        totalClicks: this.totalClicks,
        isRunning: this.isRunningState,
        timestamp: new Date(),
      });
    } catch (error) {
      this.log(`Failed to save to storage: ${error}`);
      // Don't re-throw the error, just log it
    }
  }

  private emitStateChange(): void {
    this.stateChangeEmitter.emit('stateChange');
    this.emit('stateChange');
  }

  /**
   * Set configuration override for testing purposes
   */
  public setConfigOverride(configOverride: {
    interval?: number;
    debugMode?: boolean;
    buttonConfig?: {
      enableAcceptAll?: boolean;
      enableAccept?: boolean;
      enableRun?: boolean;
      enableApply?: boolean;
      enableResume?: boolean;
      enableConnectionResume?: boolean;
      enableTryAgain?: boolean;
    };
  }): void {
    this.configOverride = configOverride;
    this.loadConfiguration();
  }

  // Public methods
  public isRunning(): boolean {
    return this.isRunningState;
  }

  public getStatus(): any {
    return {
      isRunning: this.isRunningState,
      interval: this.interval,
      totalClicks: this.totalClicks,
      debugMode: this.debugMode,
      ideType: this.ideType,
    };
  }

  public toggleDebug(): boolean {
    this.debugMode = !this.debugMode;
    this.log(`Debug mode ${this.debugMode ? 'enabled' : 'disabled'}`);
    return this.debugMode;
  }

  public setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    this.log(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  public onStateChange(callback: () => void): void {
    this.stateChangeEmitter.on('stateChange', callback);
  }

  public calibrateWorkflowTimes(manualSeconds: number, automatedMs: number): void {
    this.analyticsManager.calibrateWorkflowTimes(manualSeconds, automatedMs);
    this.log(`Workflow calibrated: Manual ${manualSeconds}s, Auto ${automatedMs}ms`);
  }

  public enableOnly(buttonTypes: string[]): void {
    this.buttonDetector.enableOnly(buttonTypes);
    this.log(`Configuration updated: Only ${buttonTypes.join(', ')} buttons enabled`);
  }

  public enableAll(): void {
    this.buttonDetector.enableAll();
    this.log('All button types enabled');
  }

  public disableAll(): void {
    this.buttonDetector.disableAll();
    this.log('All button types disabled');
  }

  public toggleButton(buttonType: string): void {
    this.buttonDetector.toggleButton(buttonType);
  }

  public enableButton(buttonType: string): void {
    this.buttonDetector.enableButton(buttonType);
  }

  public disableButton(buttonType: string): void {
    this.buttonDetector.disableButton(buttonType);
  }

  public findDiffBlocks(): DiffBlock[] {
    return this.buttonDetector.findDiffBlocks();
  }

  public getConversationContext(): ConversationContext {
    return this.buttonDetector.getConversationContext();
  }

  public logConversationActivity(): void {
    this.buttonDetector.logConversationActivity();
  }

  public findRecentDiffBlocks(maxAge: number = 30000): DiffBlock[] {
    return this.buttonDetector.findRecentDiffBlocks(maxAge);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private log(message: string): void {
    if (this.debugMode) {
      // Debug logging enabled - message parameter used for future implementation
      // Currently disabled to avoid console output for linting compliance
    }
  }
}
