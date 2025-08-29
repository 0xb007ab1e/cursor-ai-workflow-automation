import { DiffBlock, ConversationContext } from './autoAccept';

export interface ButtonConfiguration {
  enableAcceptAll: boolean;
  enableAccept: boolean;
  enableRun: boolean;
  enableApply: boolean;
  enableResume: boolean;
  enableConnectionResume: boolean;
  enableTryAgain: boolean;
}

export class ButtonDetector {
  private config: ButtonConfiguration;
  private ideType: 'cursor' | 'windsurf';

  constructor(ideType: 'cursor' | 'windsurf') {
    this.ideType = ideType;
    this.config = {
      enableAcceptAll: true,
      enableAccept: true,
      enableRun: true,
      enableApply: true,
      enableResume: true,
      enableConnectionResume: true,
      enableTryAgain: true,
    };
  }

  public updateConfiguration(newConfig: Partial<ButtonConfiguration>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public findAcceptButtons(): Element[] {
    const buttons: Element[] = [];

    // IDE-specific input box selectors
    let inputBox: Element | null = null;

    if (this.ideType === 'windsurf') {
      // Windsurf doesn't have a specific input box, look for button containers directly
      inputBox =
        document.querySelector('.flex.w-full.items-center.justify-between') ||
        document.querySelector('[class*="bg-ide-editor-background"]') ||
        document.querySelector('.flex.flex-row.gap-x-1');
    } else {
      // Cursor IDE
      inputBox = document.querySelector('div.full-input-box');
    }

    if (!inputBox) {
      // Fallback: search entire document for buttons
      return this.findButtonsGlobally();
    }

    if (this.ideType === 'windsurf') {
      // For Windsurf, search the entire document for button patterns
      const windsurfButtons = this.findWindsurfButtons();
      buttons.push(...windsurfButtons);
    } else {
      // Cursor IDE - check previous sibling elements for regular buttons
      let currentElement = inputBox.previousElementSibling;
      let searchDepth = 0;

      while (currentElement && searchDepth < 5) {
        // Look for any clickable elements containing "Accept" text
        const acceptElements = this.findAcceptInElement(currentElement);
        buttons.push(...acceptElements);

        currentElement = currentElement.previousElementSibling;
        searchDepth++;
      }
    }

    // Also search for Resume Conversation links in message bubbles if enabled
    if (this.config.enableResume) {
      const resumeLinks = this.findResumeLinks();
      buttons.push(...resumeLinks);
    }

    // Search for connection failure buttons (Resume/Try again in dropdowns)
    if (this.config.enableConnectionResume || this.config.enableTryAgain) {
      const connectionButtons = this.findConnectionFailureButtons();
      buttons.push(...connectionButtons);
    }

    return buttons;
  }

  private findAcceptInElement(element: Element): Element[] {
    const buttons: Element[] = [];

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
      '[class*="secondary-button"]',
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

  public isAcceptButton(element: Element): boolean {
    if (!element || !element.textContent) return false;

    // Check if it's a Resume Conversation link first
    if (this.config.enableResume && this.isResumeLink(element)) {
      return true;
    }

    // Use IDE-specific detection
    if (this.ideType === 'windsurf') {
      return this.isWindsurfAcceptButton(element);
    }

    // Cursor IDE detection
    const text = element.textContent.toLowerCase().trim();

    // Check each pattern based on configuration
    const patterns = [
      { pattern: 'accept all', enabled: this.config.enableAcceptAll },
      { pattern: 'accept', enabled: this.config.enableAccept },
      { pattern: 'run command', enabled: this.config.enableRun },
      { pattern: 'run', enabled: this.config.enableRun },
      { pattern: 'apply', enabled: this.config.enableApply },
      { pattern: 'execute', enabled: this.config.enableRun },
      {
        pattern: 'resume',
        enabled: this.config.enableResume || this.config.enableConnectionResume,
      },
      { pattern: 'try again', enabled: this.config.enableTryAgain },
    ];

    // Check if text matches any enabled pattern
    const matchesEnabledPattern = patterns.some(
      ({ pattern, enabled }) => enabled && text.includes(pattern)
    );

    if (!matchesEnabledPattern) return false;

    const isVisible = this.isElementVisible(element);
    const isClickable = this.isElementClickable(element);

    return isVisible && isClickable;
  }

  private isElementVisible(element: Element): boolean {
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

  private isElementClickable(element: Element): boolean {
    const style = window.getComputedStyle(element);
    return (
      style.pointerEvents !== 'none' &&
      !(element as HTMLButtonElement).disabled &&
      !element.hasAttribute('disabled')
    );
  }

  public isResumeLink(element: Element): boolean {
    if (!element) return false;

    // Check for Resume Conversation specific attributes and text
    const hasResumeCommand =
      element.getAttribute('data-link') === 'command:composer.resumeCurrentChat';
    const hasResumeText =
      element.textContent && element.textContent.toLowerCase().includes('resume');

    if (!hasResumeCommand && !hasResumeText) return false;

    const isVisible = this.isElementVisible(element);
    const isClickable = this.isElementClickable(element);

    return isVisible && isClickable;
  }

  private findResumeLinks(): Element[] {
    const resumeLinks: Element[] = [];

    // Look for Resume Conversation markdown links
    const resumeSelectors = [
      '.markdown-link[data-link="command:composer.resumeCurrentChat"]',
      '.markdown-link[data-link*="resume"]',
      'span.markdown-link[data-link="command:composer.resumeCurrentChat"]',
    ];

    for (const selector of resumeSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        if (this.isElementVisible(element) && this.isElementClickable(element)) {
          resumeLinks.push(element);
        }
      }
    }

    return resumeLinks;
  }

  private findConnectionFailureButtons(): Element[] {
    const buttons: Element[] = [];

    // Look for connection failure dropdown containers
    const dropdownSelectors = [
      '.bg-dropdown-background',
      '[class*="dropdown"]',
      '[class*="fade-in"]',
    ];

    for (const selector of dropdownSelectors) {
      const dropdowns = document.querySelectorAll(selector);

      for (const dropdown of dropdowns) {
        // Check if this dropdown contains connection failure text
        const text = dropdown.textContent?.toLowerCase() || '';
        if (
          text.includes('connection failed') ||
          text.includes('check your internet') ||
          text.includes('vpn')
        ) {
          // Look for Resume and Try again buttons within this dropdown
          const buttonSelectors = [
            '.anysphere-secondary-button',
            '.anysphere-text-button',
            '[class*="button"]',
            '[style*="cursor: pointer"]',
          ];

          for (const btnSelector of buttonSelectors) {
            const dropdownButtons = dropdown.querySelectorAll(btnSelector);

            for (const btn of dropdownButtons) {
              const btnText = btn.textContent?.toLowerCase().trim() || '';

              // Check for Resume or Try again buttons
              if (
                (btnText === 'resume' && this.config.enableConnectionResume) ||
                (btnText === 'try again' && this.config.enableTryAgain)
              ) {
                if (this.isElementVisible(btn) && this.isElementClickable(btn)) {
                  buttons.push(btn);
                }
              }
            }
          }
        }
      }
    }

    return buttons;
  }

  private findWindsurfButtons(): Element[] {
    const buttons: Element[] = [];

    // Search in main document first
    this.searchWindsurfButtonsInDocument(document, buttons);

    // Search in iframes (Windsurf often runs in iframe)
    const iframes = document.querySelectorAll('iframe');
    for (const iframe of iframes) {
      try {
        // Check if this is the Windsurf iframe
        if (
          iframe.id === 'windsurf.cascadePanel' ||
          iframe.src.includes('windsurf') ||
          iframe.src.includes('cascadePanel')
        ) {
          // Access iframe document
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            this.searchWindsurfButtonsInDocument(iframeDoc, buttons);
          }
        }
      } catch (error) {
        // Cross-origin or access restrictions
      }
    }

    return buttons;
  }

  private searchWindsurfButtonsInDocument(doc: Document, buttons: Element[]): void {
    // Windsurf button selectors based on the UI structure
    const windsurfSelectors = [
      // Accept/Reject buttons in command execution
      'button.hover\\:bg-ide-button-hover-background.cursor-pointer.rounded.bg-ide-button-background',
      'button[class*="bg-ide-button-background"]',
      'button[class*="text-ide-button-color"]',

      // Accept all buttons in file changes
      'span.hover\\:text-ide-button-hover-color.hover\\:bg-ide-button-hover-background.cursor-pointer',
      'span[class*="bg-ide-button-background"]',
      'span[class*="text-ide-button-color"]',
      'span.hover\\:bg-ide-button-hover-background.cursor-pointer.select-none.rounded-sm.bg-ide-button-background',

      // Generic clickable elements with specific Windsurf patterns
      '[class*="cursor-pointer"][class*="rounded"]',
      '[class*="cursor-pointer"][class*="select-none"]',
      'button[class*="transition"]',
      'span[class*="cursor-pointer"]',

      // More specific selectors for file changes UI
      'span.cursor-pointer.select-none.rounded-sm',
      'span[class*="hover:text-ide-button-hover-color"]',
      'span[class*="hover:bg-ide-button-hover-background"]',
    ];

    for (const selector of windsurfSelectors) {
      try {
        const elements = doc.querySelectorAll(selector);
        for (const element of elements) {
          if (this.isWindsurfAcceptButton(element)) {
            buttons.push(element);
          }
        }
      } catch (error) {
        // Skip invalid selectors
      }
    }
  }

  private isWindsurfAcceptButton(element: Element): boolean {
    if (!element || !element.textContent) return false;

    const text = element.textContent.toLowerCase().trim();

    // Windsurf button patterns
    const windsurfPatterns = [
      { pattern: 'accept all', enabled: this.config.enableAcceptAll },
      { pattern: 'accept', enabled: this.config.enableAccept },
      { pattern: 'run command', enabled: this.config.enableRun },
      { pattern: 'run', enabled: this.config.enableRun },
      { pattern: 'apply', enabled: this.config.enableApply },
      { pattern: 'execute', enabled: this.config.enableRun },
    ];

    // Check if text matches any enabled pattern
    const matchesPattern = windsurfPatterns.some(
      ({ pattern, enabled }) => enabled && text.includes(pattern)
    );

    if (!matchesPattern) return false;

    // Enhanced Windsurf-specific class checks
    const hasWindsurfClasses =
      element.className.includes('bg-ide-button-background') ||
      element.className.includes('text-ide-button-color') ||
      element.className.includes('cursor-pointer') ||
      element.className.includes('hover:bg-ide-button-hover-background') ||
      element.className.includes('hover:text-ide-button-hover-color') ||
      element.className.includes('select-none');

    if (!hasWindsurfClasses) return false;

    // Additional check for reject buttons - exclude them
    if (text.includes('reject')) {
      return false;
    }

    const isVisible = this.isElementVisible(element);
    const isClickable = this.isElementClickable(element);

    return isVisible && isClickable;
  }

  private findButtonsGlobally(): Element[] {
    const buttons: Element[] = [];

    // Search in main document
    this.searchButtonsInDocument(document, buttons);

    // Search in iframes
    const iframes = document.querySelectorAll('iframe');
    for (const iframe of iframes) {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          this.searchButtonsInDocument(iframeDoc, buttons);
        }
      } catch (error) {
        // Cross-origin restrictions
      }
    }

    return buttons;
  }

  private searchButtonsInDocument(doc: Document, buttons: Element[]): void {
    // Combined selectors for both IDEs
    const globalSelectors = [
      // Cursor selectors
      'div[class*="button"]',
      'button',
      '[class*="anysphere"]',

      // Windsurf selectors
      'button[class*="bg-ide-button-background"]',
      'span[class*="cursor-pointer"]',
      '[class*="hover:bg-ide-button-hover-background"]',

      // Generic selectors
      '[class*="cursor-pointer"]',
      '[onclick]',
      '[style*="cursor: pointer"]',
    ];

    for (const selector of globalSelectors) {
      try {
        const elements = doc.querySelectorAll(selector);
        for (const element of elements) {
          if (this.isAcceptButton(element)) {
            buttons.push(element);
          }
        }
      } catch (error) {
        // Skip invalid selectors
      }
    }
  }

  // Configuration control methods
  public enableOnly(buttonTypes: string[]): void {
    // Disable all first
    Object.keys(this.config).forEach(key => {
      (this.config as any)[key] = false;
    });

    // Enable specified types
    buttonTypes.forEach(type => {
      const configKey = `enable${type.charAt(0).toUpperCase() + type.slice(1)}`;
      if (Object.prototype.hasOwnProperty.call(this.config, configKey)) {
        (this.config as any)[configKey] = true;
      }
    });
  }

  public enableAll(): void {
    Object.keys(this.config).forEach(key => {
      (this.config as any)[key] = true;
    });
  }

  public disableAll(): void {
    Object.keys(this.config).forEach(key => {
      (this.config as any)[key] = false;
    });
  }

  public toggleButton(buttonType: string): void {
    const configKey = `enable${buttonType.charAt(0).toUpperCase() + buttonType.slice(1)}`;
    if (Object.prototype.hasOwnProperty.call(this.config, configKey)) {
      (this.config as any)[configKey] = !(this.config as any)[configKey];
    }
  }

  public enableButton(buttonType: string): void {
    const configKey = `enable${buttonType.charAt(0).toUpperCase() + buttonType.slice(1)}`;
    if (Object.prototype.hasOwnProperty.call(this.config, configKey)) {
      (this.config as any)[configKey] = true;
    }
  }

  public disableButton(buttonType: string): void {
    const configKey = `enable${buttonType.charAt(0).toUpperCase() + buttonType.slice(1)}`;
    if (Object.prototype.hasOwnProperty.call(this.config, configKey)) {
      (this.config as any)[configKey] = false;
    }
  }

  // Diff Block Detection and Analysis
  public findDiffBlocks(): DiffBlock[] {
    const diffBlocks: DiffBlock[] = [];

    // Look for composer diff blocks in the conversation
    const diffSelectors = [
      'div.composer-diff-block',
      'div.composer-code-block-container',
      'div.composer-tool-former-message',
    ];

    for (const selector of diffSelectors) {
      const blocks = document.querySelectorAll(selector);
      for (const block of blocks) {
        const diffInfo = this.analyzeDiffBlock(block);
        if (diffInfo) {
          diffBlocks.push(diffInfo);
        }
      }
    }

    return diffBlocks;
  }

  private analyzeDiffBlock(block: Element): DiffBlock | null {
    try {
      if (!block) return null;

      const diffInfo: DiffBlock = {
        blockElement: block,
        timestamp: new Date(),
        files: [],
        changeType: 'unknown',
      };

      // Look for file header information
      const fileHeader = block.querySelector('.composer-code-block-header');
      if (fileHeader) {
        const fileInfo = this.extractFileInfoFromHeader(fileHeader);
        if (fileInfo) {
          diffInfo.files.push(fileInfo);
        }
      }

      // Look for file name in the filename span
      const filenameSpan = block.querySelector('.composer-code-block-filename span');
      if (filenameSpan && !diffInfo.files.length) {
        const filename = filenameSpan.textContent?.trim();
        if (filename) {
          diffInfo.files.push({
            name: filename,
            path: filename,
            extension: this.getFileExtension(filename),
          });
        }
      }

      // Check for change indicators (+/- numbers)
      const statusSpan = block.querySelector('.composer-code-block-status span[style*="color"]');
      if (statusSpan) {
        const statusText = statusSpan.textContent || '';
        if (statusText.includes('+')) {
          diffInfo.changeType = 'addition';
          diffInfo.linesAdded = this.extractNumber(statusText);
        } else if (statusText.includes('-')) {
          diffInfo.changeType = 'deletion';
          diffInfo.linesDeleted = this.extractNumber(statusText);
        }
      }

      // Look for both additions and deletions
      const allStatusSpans = block.querySelectorAll(
        '.composer-code-block-status span[style*="color"]'
      );
      let hasAdditions = false,
        hasDeletions = false;

      allStatusSpans.forEach(span => {
        const text = span.textContent || '';
        if (text.includes('+')) {
          hasAdditions = true;
          diffInfo.linesAdded = this.extractNumber(text);
        } else if (text.includes('-')) {
          hasDeletions = true;
          diffInfo.linesDeleted = this.extractNumber(text);
        }
      });

      if (hasAdditions && hasDeletions) {
        diffInfo.changeType = 'modification';
      } else if (hasAdditions) {
        diffInfo.changeType = 'addition';
      } else if (hasDeletions) {
        diffInfo.changeType = 'deletion';
      }

      return diffInfo.files.length > 0 ? diffInfo : null;
    } catch (error) {
      return null;
    }
  }

  private extractFileInfoFromHeader(
    header: Element
  ): { name: string; path: string; extension: string; hasIcon?: boolean } | null {
    try {
      const fileInfo = header.querySelector('.composer-code-block-file-info');
      if (!fileInfo) return null;

      const filenameElement = fileInfo.querySelector('.composer-code-block-filename span');
      const filename = filenameElement?.textContent?.trim();

      if (!filename) return null;

      return {
        name: filename,
        path: filename,
        extension: this.getFileExtension(filename),
        hasIcon: !!fileInfo.querySelector('.composer-code-block-file-icon'),
      };
    } catch (error) {
      return null;
    }
  }

  private getFileExtension(filename: string): string {
    if (!filename || typeof filename !== 'string') return '';
    const lastDot = filename.lastIndexOf('.');
    return lastDot > 0 ? filename.substring(lastDot + 1).toLowerCase() : '';
  }

  private extractNumber(text: string): number {
    if (!text) return 0;
    const match = text.match(/[+-]?(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  public findRecentDiffBlocks(maxAge: number = 30000): DiffBlock[] {
    const allDiffs = this.findDiffBlocks();
    const cutoffTime = Date.now() - maxAge;

    return allDiffs.filter(diff => diff.timestamp && diff.timestamp.getTime() > cutoffTime);
  }

  public getConversationContext(): ConversationContext {
    const conversationDiv = document.querySelector('div.conversations');

    const context: ConversationContext = {
      conversationElement: conversationDiv,
      totalMessages: 0,
      recentDiffs: [],
      filesChanged: [],
      lastActivity: null,
    };

    if (conversationDiv) {
      // Count message bubbles
      const messageBubbles = conversationDiv.querySelectorAll('[data-message-index]');
      context.totalMessages = messageBubbles.length;

      // Find recent diff blocks
      const recentDiffs = this.findRecentDiffBlocks();
      context.recentDiffs = recentDiffs;

      // Extract unique files from recent diffs
      const filesSet = new Set<string>();
      recentDiffs.forEach(diff => {
        diff.files.forEach(file => {
          filesSet.add(file.name);
        });
      });
      context.filesChanged = Array.from(filesSet);

      // Find last activity timestamp
      if (messageBubbles.length > 0) {
        context.lastActivity = new Date(); // Current time as approximation
      }
    }

    return context;
  }

  public logConversationActivity(): void {
    // Get conversation context for logging
    // Conversation activity logging disabled
  }
}
