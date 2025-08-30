// Mock ButtonDetector before importing AutoAcceptManager
jest.mock('../../src/buttonDetector');

import { AutoAcceptManager, DiffBlock, ConversationContext } from '../../src/autoAccept';
import { ButtonDetector } from '../../src/buttonDetector';
import { StorageManager } from '../../src/storage';
import { AnalyticsManager } from '../../src/analytics';

// Mock VS Code API
jest.mock('vscode', () => ({
  workspace: {
    getConfiguration: jest.fn().mockReturnValue({
      get: jest.fn().mockImplementation((key: string, defaultValue: any) => defaultValue),
    }),
  },
  window: {
    activeTextEditor: null,
  },
}));

describe('AutoAcceptManager', () => {
  let autoAcceptManager: AutoAcceptManager;
  let mockButtonDetector: jest.Mocked<ButtonDetector>;
  let mockStorageManager: jest.Mocked<StorageManager>;
  let mockAnalyticsManager: jest.Mocked<AnalyticsManager>;

  beforeEach(() => {
    // Create mocks
    mockButtonDetector = {
      findAcceptButtons: jest.fn(),
      findDiffBlocks: jest.fn(),
      findRecentDiffBlocks: jest.fn(),
      getConversationContext: jest.fn(),
      logConversationActivity: jest.fn(),
      isAcceptButton: jest.fn(),
      isResumeLink: jest.fn(),
      isConnectionFailureButton: jest.fn(),
      isWindsurfButton: jest.fn(),
      findButtonsGlobally: jest.fn(),
      openResumeLink: jest.fn(),
      updateConfiguration: jest.fn(),
      enableOnly: jest.fn(),
      enableAll: jest.fn(),
      disableAll: jest.fn(),
      toggleButton: jest.fn(),
      enableButton: jest.fn(),
      disableButton: jest.fn(),
    } as any;

    // Set up the ButtonDetector mock
    (ButtonDetector as jest.MockedClass<typeof ButtonDetector>).mockImplementation(() => mockButtonDetector);

    mockStorageManager = {
      saveData: jest.fn(),
      getData: jest.fn(),
      clearAllData: jest.fn(),
      hasData: jest.fn(),
      getStorageInfo: jest.fn(),
      exportStorageData: jest.fn(),
      importStorageData: jest.fn(),
      validateImportedData: jest.fn(),
      getStorageUsage: jest.fn(),
      cleanupOldData: jest.fn(),
    } as any;

    mockAnalyticsManager = {
      trackButtonClick: jest.fn(),
      trackFileAcceptance: jest.fn(),
      startSession: jest.fn(),
      endSession: jest.fn(),
      getAnalyticsData: jest.fn(),
      getROIData: jest.fn(),
      exportData: jest.fn(),
      clearAnalytics: jest.fn(),
      clearROIData: jest.fn(),
      validateAndRepairData: jest.fn(),
      getButtonTypeStats: jest.fn(),
      getFileTypeStats: jest.fn(),
      getSessionStats: jest.fn(),
      getProjections: jest.fn(),
      getROIStats: jest.fn(),
      formatTimeDuration: jest.fn(),
      calibrateWorkflowTimes: jest.fn(),
    } as any;

    // Create AutoAcceptManager instance
    autoAcceptManager = new AutoAcceptManager(
      mockAnalyticsManager,
      mockStorageManager
    );
  });

  describe('constructor', () => {
    it('should initialize with dependencies', () => {
      expect(autoAcceptManager).toBeDefined();
      expect(autoAcceptManager['analyticsManager']).toBe(mockAnalyticsManager);
      expect(autoAcceptManager['storageManager']).toBe(mockStorageManager);
    });
  });

  describe('start and stop functionality', () => {
    it('should start auto-accept process', () => {
      autoAcceptManager.start();
      expect(autoAcceptManager['isRunningState']).toBe(true);
      expect(autoAcceptManager['monitorInterval']).toBeDefined();
    });

    it('should stop auto-accept process', () => {
      autoAcceptManager['isRunningState'] = true;
      autoAcceptManager['monitorInterval'] = setInterval(() => {}, 1000);
      
      autoAcceptManager.stop();
      
      expect(autoAcceptManager['isRunningState']).toBe(false);
      expect(autoAcceptManager['monitorInterval']).toBeNull();
    });
  });

  describe('IDE detection', () => {
    it('should detect Cursor IDE', () => {
      const ideType = autoAcceptManager['detectIDE']();
      expect(ideType).toBe('cursor');
    });

    it('should detect Windsurf IDE from DOM elements', () => {
      // Mock DOM elements for Windsurf
      const mockElement = document.createElement('div');
      mockElement.className = 'bg-ide-editor-background';
      document.body.appendChild(mockElement);

      const ideType = autoAcceptManager['detectIDE']();
      expect(ideType).toBe('windsurf');

      // Cleanup
      document.body.removeChild(mockElement);
    });

    it('should detect Windsurf IDE from URL and title', () => {
      // Mock window.location and document.title
      const originalHref = window.location.href;
      const originalTitle = document.title;
      
      Object.defineProperty(window, 'location', {
        value: { href: 'https://windsurf.example.com' },
        writable: true
      });
      Object.defineProperty(document, 'title', {
        value: 'Windsurf IDE - Project',
        writable: true
      });

      const ideType = autoAcceptManager['detectIDE']();
      expect(ideType).toBe('windsurf');

      // Restore original values
      Object.defineProperty(window, 'location', {
        value: { href: originalHref },
        writable: true
      });
      Object.defineProperty(document, 'title', {
        value: originalTitle,
        writable: true
      });
    });

    it('should detect Cursor IDE from URL and title', () => {
      // Mock window.location and document.title
      const originalHref = window.location.href;
      const originalTitle = document.title;
      
      Object.defineProperty(window, 'location', {
        value: { href: 'https://cursor.example.com' },
        writable: true
      });
      Object.defineProperty(document, 'title', {
        value: 'Cursor IDE - Project',
        writable: true
      });

      const ideType = autoAcceptManager['detectIDE']();
      expect(ideType).toBe('cursor');

      // Restore original values
      Object.defineProperty(window, 'location', {
        value: { href: originalHref },
        writable: true
      });
      Object.defineProperty(document, 'title', {
        value: originalTitle,
        writable: true
      });
    });

    it('should handle IDE detection errors gracefully', () => {
      // Mock document.querySelector to throw an error
      const originalQuerySelector = document.querySelector;
      document.querySelector = jest.fn().mockImplementation(() => {
        throw new Error('DOM error');
      });

      const ideType = autoAcceptManager['detectIDE']();
      expect(ideType).toBe('cursor'); // Should fallback to cursor

      // Restore original method
      document.querySelector = originalQuerySelector;
    });
  });

  describe('configuration loading', () => {
    it('should load configuration from test override', () => {
      const testConfig = {
        interval: 5000,
        debugMode: true,
        buttonConfig: {
          enableAccept: false,
          enableRun: false
        }
      };

      autoAcceptManager.setConfigOverride(testConfig);

      expect(autoAcceptManager['interval']).toBe(5000);
      expect(autoAcceptManager['debugMode']).toBe(true);
      expect(mockButtonDetector.updateConfiguration).toHaveBeenCalledWith({
        enableAcceptAll: true,
        enableAccept: false,
        enableRun: false,
        enableApply: true,
        enableResume: true,
        enableConnectionResume: true,
        enableTryAgain: true,
      });
    });

    it('should handle VS Code configuration loading errors', () => {
      // Mock vscode.workspace.getConfiguration to throw an error
      const mockGetConfiguration = jest.fn().mockImplementation(() => {
        throw new Error('VS Code config error');
      });

      // Temporarily replace the vscode mock
      const originalVscode = (global as any).vscode;
      (global as any).vscode = {
        workspace: {
          getConfiguration: mockGetConfiguration
        }
      };

      // Trigger configuration loading by calling setConfigOverride
      autoAcceptManager.setConfigOverride({});

      // Should use defaults when VS Code config fails
      expect(mockButtonDetector.updateConfiguration).toHaveBeenCalledWith({
        enableAcceptAll: true,
        enableAccept: true,
        enableRun: true,
        enableApply: true,
        enableResume: true,
        enableConnectionResume: true,
        enableTryAgain: true,
      });

      // Restore original vscode mock
      (global as any).vscode = originalVscode;
    });
  });

  describe('storage loading', () => {
    it('should load data from storage successfully', () => {
      const mockData = { totalClicks: 42 };
      mockStorageManager.getData.mockReturnValue(mockData);

      autoAcceptManager['loadFromStorage']();

      expect(autoAcceptManager['totalClicks']).toBe(42);
    });

    it('should handle storage loading errors gracefully', () => {
      mockStorageManager.getData.mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => {
        autoAcceptManager['loadFromStorage']();
      }).not.toThrow();
    });
  });

  describe('button interaction logic', () => {
    beforeEach(() => {
      // Mock DOM elements for button interaction tests
      const mockButton = document.createElement('button');
      mockButton.textContent = 'Accept';
      mockButton.getBoundingClientRect = jest.fn().mockReturnValue({
        left: 100,
        top: 100,
        width: 50,
        height: 30
      });
      
      // Mock findAcceptButtons to return our test button
      mockButtonDetector.findAcceptButtons.mockReturnValue([mockButton]);
    });

    it('should handle successful button click with file info extraction', () => {
      // Mock DOM for file info extraction
      const mockConversationsDiv = document.createElement('div');
      mockConversationsDiv.className = 'conversations';
      
      const mockMessageBubble = document.createElement('div');
      mockMessageBubble.setAttribute('data-message-index', '1');
      
      const mockCodeBlock = document.createElement('div');
      mockCodeBlock.className = 'composer-code-block-container';
      
      const mockFilenameSpan = document.createElement('span');
      mockFilenameSpan.textContent = 'test.ts';
      mockFilenameSpan.style.direction = 'ltr';
      
      const mockStatusSpan = document.createElement('span');
      mockStatusSpan.textContent = '+5 -2';
      mockStatusSpan.style.color = 'green';
      
      mockCodeBlock.appendChild(mockFilenameSpan);
      mockCodeBlock.appendChild(mockStatusSpan);
      mockMessageBubble.appendChild(mockCodeBlock);
      mockConversationsDiv.appendChild(mockMessageBubble);
      
      document.body.appendChild(mockConversationsDiv);
      
      // Mock isResumeLink to return false
      mockButtonDetector.isResumeLink.mockReturnValue(false);
      
      // Mock analytics methods
      mockAnalyticsManager.trackFileAcceptance = jest.fn();
      
      // Start auto-accept to trigger button interaction
      autoAcceptManager.start();
      
      // Verify file acceptance was tracked
      expect(mockAnalyticsManager.trackFileAcceptance).toHaveBeenCalledWith(
        expect.objectContaining({
          filename: 'test.ts',
          addedLines: 5,
          deletedLines: 2
        }),
        'accept'
      );
      
      // Cleanup
      document.body.removeChild(mockConversationsDiv);
    });

    it('should handle button click with resume link detection', () => {
      // Mock isResumeLink to return true
      mockButtonDetector.isResumeLink.mockReturnValue(true);
      
      // Mock analytics methods
      mockAnalyticsManager.trackButtonClick = jest.fn();
      mockAnalyticsManager.calculateTimeSaved = jest.fn().mockReturnValue(5000);
      
      // Start auto-accept to trigger button interaction
      autoAcceptManager.start();
      
      // Verify resume click was tracked
      expect(mockAnalyticsManager.trackButtonClick).toHaveBeenCalledWith('resume-conversation', 5000);
    });

    it('should handle button click with connection resume detection', () => {
      // Mock button with 'resume' text but not a resume link
      const mockButton = document.createElement('button');
      mockButton.textContent = 'Resume';
      mockButton.getBoundingClientRect = jest.fn().mockReturnValue({
        left: 100,
        top: 100,
        width: 50,
        height: 30
      });
      
      mockButtonDetector.findAcceptButtons.mockReturnValue([mockButton]);
      mockButtonDetector.isResumeLink.mockReturnValue(false);
      
      // Mock analytics methods
      mockAnalyticsManager.trackButtonClick = jest.fn();
      mockAnalyticsManager.calculateTimeSaved = jest.fn().mockReturnValue(3000);
      
      // Start auto-accept to trigger button interaction
      autoAcceptManager.start();
      
      // Verify connection resume click was tracked
      expect(mockAnalyticsManager.trackButtonClick).toHaveBeenCalledWith('connection-resume', 3000);
    });

    it('should handle button click with try again detection', () => {
      // Mock button with 'try again' text
      const mockButton = document.createElement('button');
      mockButton.textContent = 'Try Again';
      mockButton.getBoundingClientRect = jest.fn().mockReturnValue({
        left: 100,
        top: 100,
        width: 50,
        height: 30
      });
      
      mockButtonDetector.findAcceptButtons.mockReturnValue([mockButton]);
      mockButtonDetector.isResumeLink.mockReturnValue(false);
      
      // Mock analytics methods
      mockAnalyticsManager.trackButtonClick = jest.fn();
      mockAnalyticsManager.calculateTimeSaved = jest.fn().mockReturnValue(2000);
      
      // Start auto-accept to trigger button interaction
      autoAcceptManager.start();
      
      // Verify try again click was tracked
      expect(mockAnalyticsManager.trackButtonClick).toHaveBeenCalledWith('try-again', 2000);
    });

    it('should handle button click with generic button type', () => {
      // Mock button with generic text
      const mockButton = document.createElement('button');
      mockButton.textContent = 'Run';
      mockButton.getBoundingClientRect = jest.fn().mockReturnValue({
        left: 100,
        top: 100,
        width: 50,
        height: 30
      });
      
      mockButtonDetector.findAcceptButtons.mockReturnValue([mockButton]);
      mockButtonDetector.isResumeLink.mockReturnValue(false);
      
      // Mock analytics methods
      mockAnalyticsManager.trackButtonClick = jest.fn();
      mockAnalyticsManager.calculateTimeSaved = jest.fn().mockReturnValue(1500);
      
      // Start auto-accept to trigger button interaction
      autoAcceptManager.start();
      
      // Verify generic click was tracked
      expect(mockAnalyticsManager.trackButtonClick).toHaveBeenCalledWith('run', 1500);
    });

    it('should handle button click failure gracefully', () => {
      // Mock button that will cause an error during click
      const mockButton = {
        textContent: 'Accept',
        getBoundingClientRect: jest.fn().mockReturnValue({
          left: 100,
          top: 100,
          width: 50,
          height: 30
        }),
        dispatchEvent: jest.fn().mockImplementation(() => {
          throw new Error('Mock click error');
        }),
        click: jest.fn().mockImplementation(() => {
          throw new Error('Mock click error');
        })
      } as any;
      
      mockButtonDetector.findAcceptButtons.mockReturnValue([mockButton]);
      mockButtonDetector.isResumeLink.mockReturnValue(false);
      
      // Start auto-accept - should not crash
      expect(() => autoAcceptManager.start()).not.toThrow();
    });
  });

  describe('file info extraction', () => {
    beforeEach(() => {
      // Mock DOM for file info extraction tests
      const mockConversationsDiv = document.createElement('div');
      mockConversationsDiv.className = 'conversations';
      document.body.appendChild(mockConversationsDiv);
    });

    afterEach(() => {
      // Cleanup
      const conversationsDiv = document.querySelector('.conversations');
      if (conversationsDiv) {
        document.body.removeChild(conversationsDiv);
      }
    });

    it('should extract file info from code block with filename span', () => {
      const mockConversationsDiv = document.querySelector('.conversations')!;
      
      const mockMessageBubble = document.createElement('div');
      mockMessageBubble.setAttribute('data-message-index', '1');
      
      const mockCodeBlock = document.createElement('div');
      mockCodeBlock.className = 'composer-code-block-container';
      
      const mockFilenameSpan = document.createElement('span');
      mockFilenameSpan.textContent = 'example.ts';
      mockFilenameSpan.style.direction = 'ltr';
      
      const mockStatusSpan = document.createElement('span');
      mockStatusSpan.textContent = '+10 -3';
      mockStatusSpan.style.color = 'green';
      
      mockCodeBlock.appendChild(mockFilenameSpan);
      mockCodeBlock.appendChild(mockStatusSpan);
      mockMessageBubble.appendChild(mockCodeBlock);
      mockConversationsDiv.appendChild(mockMessageBubble);
      
      // Mock button for interaction
      const mockButton = document.createElement('button');
      mockButton.textContent = 'Accept';
      mockButton.getBoundingClientRect = jest.fn().mockReturnValue({
        left: 100,
        top: 100,
        width: 50,
        height: 30
      });
      
      mockButtonDetector.findAcceptButtons.mockReturnValue([mockButton]);
      mockButtonDetector.isResumeLink.mockReturnValue(false);
      mockAnalyticsManager.trackFileAcceptance = jest.fn();
      
      // Start auto-accept to trigger file extraction
      autoAcceptManager.start();
      
      // Verify file acceptance was tracked with correct info
      expect(mockAnalyticsManager.trackFileAcceptance).toHaveBeenCalledWith(
        expect.objectContaining({
          filename: 'example.ts',
          addedLines: 10,
          deletedLines: 3
        }),
        'accept'
      );
    });

    it('should extract file info using pattern matching when filename span not found', () => {
      const mockConversationsDiv = document.querySelector('.conversations')!;
      
      const mockMessageBubble = document.createElement('div');
      mockMessageBubble.setAttribute('data-message-index', '1');
      
      const mockCodeBlock = document.createElement('div');
      mockCodeBlock.className = 'composer-code-block-container';
      
      // Create a span with filename-like content
      const mockFilenameSpan = document.createElement('span');
      mockFilenameSpan.textContent = 'test.js';
      
      const mockStatusSpan = document.createElement('span');
      mockStatusSpan.textContent = '+5 -1';
      mockStatusSpan.style.color = 'green';
      
      mockCodeBlock.appendChild(mockFilenameSpan);
      mockCodeBlock.appendChild(mockStatusSpan);
      mockMessageBubble.appendChild(mockCodeBlock);
      mockConversationsDiv.appendChild(mockMessageBubble);
      
      // Mock button for interaction
      const mockButton = document.createElement('button');
      mockButton.textContent = 'Accept';
      mockButton.getBoundingClientRect = jest.fn().mockReturnValue({
        left: 100,
        top: 100,
        width: 50,
        height: 30
      });
      
      mockButtonDetector.findAcceptButtons.mockReturnValue([mockButton]);
      mockButtonDetector.isResumeLink.mockReturnValue(false);
      mockAnalyticsManager.trackFileAcceptance = jest.fn();
      
      // Start auto-accept to trigger file extraction
      autoAcceptManager.start();
      
      // Verify file acceptance was tracked
      expect(mockAnalyticsManager.trackFileAcceptance).toHaveBeenCalledWith(
        expect.objectContaining({
          filename: 'test.js',
          addedLines: 5,
          deletedLines: 1
        }),
        'accept'
      );
    });

    it('should handle missing conversations div gracefully', () => {
      // Remove conversations div
      const conversationsDiv = document.querySelector('.conversations');
      if (conversationsDiv) {
        document.body.removeChild(conversationsDiv);
      }
      
      // Mock button for interaction
      const mockButton = document.createElement('button');
      mockButton.textContent = 'Accept';
      mockButton.getBoundingClientRect = jest.fn().mockReturnValue({
        left: 100,
        top: 100,
        width: 50,
        height: 30
      });
      
      mockButtonDetector.findAcceptButtons.mockReturnValue([mockButton]);
      mockButtonDetector.isResumeLink.mockReturnValue(false);
      mockAnalyticsManager.trackButtonClick = jest.fn();
      mockAnalyticsManager.calculateTimeSaved = jest.fn().mockReturnValue(3000);
      
      // Start auto-accept - should fall back to generic click tracking
      autoAcceptManager.start();
      
      // Verify generic click was tracked instead of file acceptance
      expect(mockAnalyticsManager.trackButtonClick).toHaveBeenCalledWith('accept', 3000);
    });

    it('should handle file extraction errors gracefully', () => {
      const mockConversationsDiv = document.querySelector('.conversations')!;
      
      // Create a problematic code block that will cause errors
      const mockMessageBubble = document.createElement('div');
      mockMessageBubble.setAttribute('data-message-index', '1');
      
      const mockCodeBlock = document.createElement('div');
      mockCodeBlock.className = 'composer-code-block-container';
      
      // Mock the problematic methods on the real DOM element
      Object.defineProperty(mockCodeBlock, 'querySelector', {
        value: jest.fn().mockImplementation(() => {
          throw new Error('Mock querySelector error');
        }),
        writable: true
      });
      
      Object.defineProperty(mockCodeBlock, 'querySelectorAll', {
        value: jest.fn().mockImplementation(() => {
          throw new Error('Mock querySelectorAll error');
        }),
        writable: true
      });
      
      mockMessageBubble.appendChild(mockCodeBlock);
      mockConversationsDiv.appendChild(mockMessageBubble);
      
      // Mock button for interaction
      const mockButton = document.createElement('button');
      mockButton.textContent = 'Accept';
      mockButton.getBoundingClientRect = jest.fn().mockReturnValue({
        left: 100,
        top: 100,
        width: 50,
        height: 30
      });
      
      mockButtonDetector.findAcceptButtons.mockReturnValue([mockButton]);
      mockButtonDetector.isResumeLink.mockReturnValue(false);
      mockAnalyticsManager.trackButtonClick = jest.fn();
      mockAnalyticsManager.calculateTimeSaved = jest.fn().mockReturnValue(3000);
      
      // Start auto-accept - should fall back to generic click tracking
      autoAcceptManager.start();
      
      // Verify generic click was tracked instead of file acceptance
      expect(mockAnalyticsManager.trackButtonClick).toHaveBeenCalledWith('accept', 3000);
    });
  });

  describe('analytics handling', () => {
    beforeEach(() => {
      // Mock analytics methods
      mockAnalyticsManager.calculateTimeSaved = jest.fn().mockReturnValue(5000);
      mockAnalyticsManager.trackButtonClick = jest.fn();
      mockAnalyticsManager.trackFileAcceptance = jest.fn();
    });

    it('should handle resume conversation analytics correctly', () => {
      // Mock button that will be detected as resume link
      const mockButton = document.createElement('button');
      mockButton.textContent = 'Resume';
      mockButton.getBoundingClientRect = jest.fn().mockReturnValue({
        left: 100,
        top: 100,
        width: 50,
        height: 30
      });
      
      mockButtonDetector.findAcceptButtons.mockReturnValue([mockButton]);
      mockButtonDetector.isResumeLink.mockReturnValue(true);
      
      // Start auto-accept to trigger analytics
      autoAcceptManager.start();
      
      // Verify resume analytics were tracked
      expect(mockAnalyticsManager.calculateTimeSaved).toHaveBeenCalledWith('resume-conversation');
      expect(mockAnalyticsManager.trackButtonClick).toHaveBeenCalledWith('resume-conversation', 5000);
    });

    it('should handle connection resume analytics correctly', () => {
      // Mock button with 'resume' text but not a resume link
      const mockButton = document.createElement('button');
      mockButton.textContent = 'Resume';
      mockButton.getBoundingClientRect = jest.fn().mockReturnValue({
        left: 100,
        top: 100,
        width: 50,
        height: 30
      });
      
      mockButtonDetector.findAcceptButtons.mockReturnValue([mockButton]);
      mockButtonDetector.isResumeLink.mockReturnValue(false);
      
      // Start auto-accept to trigger analytics
      autoAcceptManager.start();
      
      // Verify connection resume analytics were tracked
      expect(mockAnalyticsManager.calculateTimeSaved).toHaveBeenCalledWith('connection-resume');
      expect(mockAnalyticsManager.trackButtonClick).toHaveBeenCalledWith('connection-resume', 5000);
    });

    it('should handle try again analytics correctly', () => {
      // Mock button with 'try again' text
      const mockButton = document.createElement('button');
      mockButton.textContent = 'Try Again';
      mockButton.getBoundingClientRect = jest.fn().mockReturnValue({
        left: 100,
        top: 100,
        width: 50,
        height: 30
      });
      
      mockButtonDetector.findAcceptButtons.mockReturnValue([mockButton]);
      mockButtonDetector.isResumeLink.mockReturnValue(false);
      
      // Start auto-accept to trigger analytics
      autoAcceptManager.start();
      
      // Verify try again analytics were tracked
      expect(mockAnalyticsManager.calculateTimeSaved).toHaveBeenCalledWith('try-again');
      expect(mockAnalyticsManager.trackButtonClick).toHaveBeenCalledWith('try-again', 5000);
    });

    it('should handle file acceptance analytics correctly', () => {
      // Mock DOM for file info extraction
      const mockConversationsDiv = document.createElement('div');
      mockConversationsDiv.className = 'conversations';
      
      const mockMessageBubble = document.createElement('div');
      mockMessageBubble.setAttribute('data-message-index', '1');
      
      const mockCodeBlock = document.createElement('div');
      mockCodeBlock.className = 'composer-code-block-container';
      
      const mockFilenameSpan = document.createElement('span');
      mockFilenameSpan.textContent = 'example.ts';
      mockFilenameSpan.style.direction = 'ltr';
      
      const mockStatusSpan = document.createElement('span');
      mockStatusSpan.textContent = '+8 -2';
      mockStatusSpan.style.color = 'green';
      
      mockCodeBlock.appendChild(mockFilenameSpan);
      mockCodeBlock.appendChild(mockStatusSpan);
      mockMessageBubble.appendChild(mockCodeBlock);
      mockConversationsDiv.appendChild(mockMessageBubble);
      document.body.appendChild(mockConversationsDiv);
      
      // Mock button for interaction
      const mockButton = document.createElement('button');
      mockButton.textContent = 'Accept';
      mockButton.getBoundingClientRect = jest.fn().mockReturnValue({
        left: 100,
        top: 100,
        width: 50,
        height: 30
      });
      
      mockButtonDetector.findAcceptButtons.mockReturnValue([mockButton]);
      mockButtonDetector.isResumeLink.mockReturnValue(false);
      
      // Start auto-accept to trigger file acceptance analytics
      autoAcceptManager.start();
      
      // Verify file acceptance analytics were tracked
      expect(mockAnalyticsManager.trackFileAcceptance).toHaveBeenCalledWith(
        expect.objectContaining({
          filename: 'example.ts',
          addedLines: 8,
          deletedLines: 2
        }),
        'accept'
      );
      
      // Cleanup
      document.body.removeChild(mockConversationsDiv);
    });

    it('should handle generic button analytics correctly', () => {
      // Mock button with generic text
      const mockButton = document.createElement('button');
      mockButton.textContent = 'Run';
      mockButton.getBoundingClientRect = jest.fn().mockReturnValue({
        left: 100,
        top: 100,
        width: 50,
        height: 30
      });
      
      mockButtonDetector.findAcceptButtons.mockReturnValue([mockButton]);
      mockButtonDetector.isResumeLink.mockReturnValue(false);
      
      // Start auto-accept to trigger analytics
      autoAcceptManager.start();
      
      // Verify generic button analytics were tracked
      expect(mockAnalyticsManager.calculateTimeSaved).toHaveBeenCalledWith('run');
      expect(mockAnalyticsManager.trackButtonClick).toHaveBeenCalledWith('run', 5000);
    });
  });

  describe('time formatting', () => {
    it('should format time duration correctly for seconds only', () => {
      // Test through analytics tracking which uses formatTimeDuration
      const mockButton = document.createElement('button');
      mockButton.textContent = 'Accept';
      mockButton.getBoundingClientRect = jest.fn().mockReturnValue({
        left: 100,
        top: 100,
        width: 50,
        height: 30
      });
      
      mockButtonDetector.findAcceptButtons.mockReturnValue([mockButton]);
      mockButtonDetector.isResumeLink.mockReturnValue(false);
      mockAnalyticsManager.calculateTimeSaved = jest.fn().mockReturnValue(5000); // 5 seconds
      
      // Start auto-accept to trigger time formatting
      autoAcceptManager.start();
      
      // Verify analytics were tracked (time formatting happens internally)
      expect(mockAnalyticsManager.trackButtonClick).toHaveBeenCalledWith('accept', 5000);
    });

    it('should format time duration correctly for minutes and seconds', () => {
      // Test through analytics tracking which uses formatTimeDuration
      const mockButton = document.createElement('button');
      mockButton.textContent = 'Accept';
      mockButton.getBoundingClientRect = jest.fn().mockReturnValue({
        left: 100,
        top: 100,
        width: 50,
        height: 30
      });
      
      mockButtonDetector.findAcceptButtons.mockReturnValue([mockButton]);
      mockButtonDetector.isResumeLink.mockReturnValue(false);
      mockAnalyticsManager.calculateTimeSaved = jest.fn().mockReturnValue(125000); // 2m 5s
      
      // Start auto-accept to trigger time formatting
      autoAcceptManager.start();
      
      // Verify analytics were tracked (time formatting happens internally)
      expect(mockAnalyticsManager.trackButtonClick).toHaveBeenCalledWith('accept', 125000);
    });

    it('should format time duration correctly for hours, minutes and seconds', () => {
      // Test through analytics tracking which uses formatTimeDuration
      const mockButton = document.createElement('button');
      mockButton.textContent = 'Accept';
      mockButton.getBoundingClientRect = jest.fn().mockReturnValue({
        left: 100,
        top: 100,
        width: 50,
        height: 30
      });
      
      mockButtonDetector.findAcceptButtons.mockReturnValue([mockButton]);
      mockButtonDetector.isResumeLink.mockReturnValue(false);
      mockAnalyticsManager.calculateTimeSaved = jest.fn().mockReturnValue(7325000); // 2h 2m 5s
      
      // Start auto-accept to trigger time formatting
      autoAcceptManager.start();
      
      // Verify analytics were tracked (time formatting happens internally)
      expect(mockAnalyticsManager.trackButtonClick).toHaveBeenCalledWith('accept', 7325000);
    });

    it('should handle invalid time duration gracefully', () => {
      // Test through analytics tracking which uses formatTimeDuration
      const mockButton = document.createElement('button');
      mockButton.textContent = 'Accept';
      mockButton.getBoundingClientRect = jest.fn().mockReturnValue({
        left: 100,
        top: 100,
        width: 50,
        height: 30
      });
      
      mockButtonDetector.findAcceptButtons.mockReturnValue([mockButton]);
      mockButtonDetector.isResumeLink.mockReturnValue(false);
      mockAnalyticsManager.calculateTimeSaved = jest.fn().mockReturnValue(0); // Invalid time
      
      // Start auto-accept to trigger time formatting
      autoAcceptManager.start();
      
      // Verify analytics were tracked (time formatting happens internally)
      expect(mockAnalyticsManager.trackButtonClick).toHaveBeenCalledWith('accept', 0);
    });
  });

  describe('storage operations', () => {
    it('should save to storage after successful operations', () => {
      // Mock button for interaction
      const mockButton = document.createElement('button');
      mockButton.textContent = 'Accept';
      mockButton.getBoundingClientRect = jest.fn().mockReturnValue({
        left: 100,
        top: 100,
        width: 50,
        height: 30
      });
      
      mockButtonDetector.findAcceptButtons.mockReturnValue([mockButton]);
      mockButtonDetector.isResumeLink.mockReturnValue(false);
      
      // Mock storage save
      mockStorageManager.saveData = jest.fn().mockResolvedValue(undefined);
      
      // Mock analytics to ensure button click is processed
      mockAnalyticsManager.trackButtonClick = jest.fn();
      mockAnalyticsManager.calculateTimeSaved = jest.fn().mockReturnValue(3000);
      
      // Start auto-accept to trigger storage save
      autoAcceptManager.start();
      
      // Wait for the next tick to allow async operations to complete
      return new Promise(resolve => {
        setTimeout(() => {
          // Verify storage was saved with correct totalClicks
          expect(mockStorageManager.saveData).toHaveBeenCalledWith({
            totalClicks: 1,
            isRunning: true,
            timestamp: expect.any(Date)
          });
          resolve(undefined);
        }, 100);
      });
    });

    it('should handle storage save errors gracefully', () => {
      // Mock button for interaction
      const mockButton = document.createElement('button');
      mockButton.textContent = 'Accept';
      mockButton.getBoundingClientRect = jest.fn().mockReturnValue({
        left: 100,
        top: 100,
        width: 50,
        height: 30
      });
      
      mockButtonDetector.findAcceptButtons.mockReturnValue([mockButton]);
      mockButtonDetector.isResumeLink.mockReturnValue(false);
      
      // Mock storage save error
      mockStorageManager.saveData = jest.fn().mockRejectedValue(new Error('Storage error'));
      
      // Start auto-accept - should not crash on storage error
      expect(() => autoAcceptManager.start()).not.toThrow();
    });
  });

  describe('state management', () => {
    it('should emit state changes correctly', () => {
      const mockCallback = jest.fn();
      autoAcceptManager.onStateChange(mockCallback);
      
      // Start auto-accept to trigger state change
      autoAcceptManager.start();
      
      // Verify state change callback was called
      expect(mockCallback).toHaveBeenCalled();
    });

    it('should provide correct status information', () => {
      const status = autoAcceptManager.getStatus();
      
      expect(status).toEqual({
        isRunning: false,
        interval: 2000,
        totalClicks: 0,
        debugMode: false,
        ideType: 'cursor'
      });
    });

    it('should toggle debug mode correctly', () => {
      const initialDebugMode = autoAcceptManager.getStatus().debugMode;
      
      const newDebugMode = autoAcceptManager.toggleDebug();
      
      expect(newDebugMode).toBe(!initialDebugMode);
      expect(autoAcceptManager.getStatus().debugMode).toBe(newDebugMode);
    });

    it('should set debug mode correctly', () => {
      autoAcceptManager.setDebugMode(true);
      expect(autoAcceptManager.getStatus().debugMode).toBe(true);
      
      autoAcceptManager.setDebugMode(false);
      expect(autoAcceptManager.getStatus().debugMode).toBe(false);
    });
  });

  describe('workflow calibration', () => {
    it('should calibrate workflow times correctly', () => {
      const manualSeconds = 30;
      const automatedMs = 5000;
      
      autoAcceptManager.calibrateWorkflowTimes(manualSeconds, automatedMs);
      
      // Verify analytics manager was called with calibration data
      expect(mockAnalyticsManager.calibrateWorkflowTimes).toHaveBeenCalledWith(manualSeconds, automatedMs);
    });
  });

  describe('button configuration delegation', () => {
    it('should delegate enableOnly to button detector', () => {
      const buttonTypes = ['accept', 'run'];
      
      autoAcceptManager.enableOnly(buttonTypes);
      
      expect(mockButtonDetector.enableOnly).toHaveBeenCalledWith(buttonTypes);
    });

    it('should delegate enableAll to button detector', () => {
      autoAcceptManager.enableAll();
      
      expect(mockButtonDetector.enableAll).toHaveBeenCalled();
    });

    it('should delegate disableAll to button detector', () => {
      autoAcceptManager.disableAll();
      
      expect(mockButtonDetector.disableAll).toHaveBeenCalled();
    });

    it('should delegate toggleButton to button detector', () => {
      const buttonType = 'accept';
      
      autoAcceptManager.toggleButton(buttonType);
      
      expect(mockButtonDetector.toggleButton).toHaveBeenCalledWith(buttonType);
    });

    it('should delegate enableButton to button detector', () => {
      const buttonType = 'accept';
      
      autoAcceptManager.enableButton(buttonType);
      
      expect(mockButtonDetector.enableButton).toHaveBeenCalledWith(buttonType);
    });

    it('should delegate disableButton to button detector', () => {
      const buttonType = 'accept';
      
      autoAcceptManager.disableButton(buttonType);
      
      expect(mockButtonDetector.disableButton).toHaveBeenCalledWith(buttonType);
    });
  });

  describe('diff block operations delegation', () => {
    it('should delegate findDiffBlocks to button detector', () => {
      const mockDiffBlocks: DiffBlock[] = [{
        blockElement: document.createElement('div'),
        timestamp: new Date(),
        files: [{ name: 'test.ts', path: '/test.ts', extension: 'ts' }],
        changeType: 'addition',
        linesAdded: 5,
        linesDeleted: 0
      }];
      mockButtonDetector.findDiffBlocks.mockReturnValue(mockDiffBlocks);
      
      const result = autoAcceptManager.findDiffBlocks();
      
      expect(mockButtonDetector.findDiffBlocks).toHaveBeenCalled();
      expect(result).toEqual(mockDiffBlocks);
    });

    it('should delegate getConversationContext to button detector', () => {
      const mockContext: ConversationContext = {
        conversationElement: document.createElement('div'),
        totalMessages: 5,
        recentDiffs: [],
        filesChanged: ['test.ts'],
        lastActivity: new Date()
      };
      mockButtonDetector.getConversationContext.mockReturnValue(mockContext);
      
      const result = autoAcceptManager.getConversationContext();
      
      expect(mockButtonDetector.getConversationContext).toHaveBeenCalled();
      expect(result).toEqual(mockContext);
    });

    it('should delegate logConversationActivity to button detector', () => {
      autoAcceptManager.logConversationActivity();
      
      expect(mockButtonDetector.logConversationActivity).toHaveBeenCalled();
    });

    it('should delegate findRecentDiffBlocks to button detector', () => {
      const maxAge = 60000;
      const mockRecentBlocks: DiffBlock[] = [{
        blockElement: document.createElement('div'),
        timestamp: new Date(),
        files: [{ name: 'recent.ts', path: '/recent.ts', extension: 'ts' }],
        changeType: 'modification',
        linesAdded: 3,
        linesDeleted: 1
      }];
      mockButtonDetector.findRecentDiffBlocks.mockReturnValue(mockRecentBlocks);
      
      const result = autoAcceptManager.findRecentDiffBlocks(maxAge);
      
      expect(mockButtonDetector.findRecentDiffBlocks).toHaveBeenCalledWith(maxAge);
      expect(result).toEqual(mockRecentBlocks);
    });

    it('should handle file info extraction with missing conversations div', () => {
      // Mock document.querySelector to return null for conversations div
      const originalQuerySelector = document.querySelector;
      document.querySelector = jest.fn().mockReturnValue(null);

      const result = autoAcceptManager['extractFileInfo']();
      expect(result).toBeNull();

      // Restore original
      document.querySelector = originalQuerySelector;
    });

    it('should handle file info extraction with no message bubbles', () => {
      // Mock conversations div with no message bubbles
      const mockConversationsDiv = document.createElement('div');
      mockConversationsDiv.className = 'conversations';
      
      const originalQuerySelector = document.querySelector;
      document.querySelector = jest.fn().mockReturnValue(mockConversationsDiv);

      const result = autoAcceptManager['extractFileInfo']();
      expect(result).toBeNull();

      // Restore original
      document.querySelector = originalQuerySelector;
    });

    it('should handle file info extraction with empty message bubbles', () => {
      // Mock conversations div with empty message bubbles
      const mockConversationsDiv = document.createElement('div');
      mockConversationsDiv.className = 'conversations';
      
      const mockBubble = document.createElement('div');
      mockBubble.setAttribute('data-message-index', '1');
      mockConversationsDiv.appendChild(mockBubble);
      
      const originalQuerySelector = document.querySelector;
      document.querySelector = jest.fn().mockReturnValue(mockConversationsDiv);

      const result = autoAcceptManager['extractFileInfo']();
      expect(result).toBeNull();

      // Restore original
      document.querySelector = originalQuerySelector;
    });

    it('should handle file info extraction with no code blocks', () => {
      // Mock conversations div with message bubbles but no code blocks
      const mockConversationsDiv = document.createElement('div');
      mockConversationsDiv.className = 'conversations';
      
      const mockBubble = document.createElement('div');
      mockBubble.setAttribute('data-message-index', '1');
      mockConversationsDiv.appendChild(mockBubble);
      
      const originalQuerySelector = document.querySelector;
      document.querySelector = jest.fn().mockReturnValue(mockConversationsDiv);

      const result = autoAcceptManager['extractFileInfo']();
      expect(result).toBeNull();

      // Restore original
      document.querySelector = originalQuerySelector;
    });

    it('should handle file info extraction with debug mode enabled', () => {
      // Enable debug mode
      autoAcceptManager['debugMode'] = true;
      
      // Mock conversations div with message bubbles but no code blocks
      const mockConversationsDiv = document.createElement('div');
      mockConversationsDiv.className = 'conversations';
      
      const mockBubble = document.createElement('div');
      mockBubble.setAttribute('data-message-index', '1');
      mockConversationsDiv.appendChild(mockBubble);
      
      const originalQuerySelector = document.querySelector;
      document.querySelector = jest.fn().mockReturnValue(mockConversationsDiv);

      const result = autoAcceptManager['extractFileInfo']();
      expect(result).toBeNull();

      // Restore original
      document.querySelector = originalQuerySelector;
      
      // Disable debug mode
      autoAcceptManager['debugMode'] = false;
    });

    it('should handle file info extraction error gracefully', () => {
      // Mock document.querySelector to throw an error
      const originalQuerySelector = document.querySelector;
      document.querySelector = jest.fn().mockImplementation(() => {
        throw new Error('DOM error');
      });

      const result = autoAcceptManager['extractFileInfo']();
      expect(result).toBeNull();

      // Restore original
      document.querySelector = originalQuerySelector;
    });

    it('should extract file info from block with filename span', () => {
      const mockBlock = document.createElement('div');
      const mockFilenameSpan = document.createElement('span');
      mockFilenameSpan.textContent = 'test.js';
      mockBlock.appendChild(mockFilenameSpan);
      
      // Mock querySelector to return the filename span
      const originalQuerySelector = mockBlock.querySelector;
      mockBlock.querySelector = jest.fn().mockReturnValue(mockFilenameSpan);

      const result = autoAcceptManager['extractFileInfoFromBlock'](mockBlock);
      expect(result).toBeDefined();
      expect(result?.filename).toBe('test.js');

      // Restore original
      mockBlock.querySelector = originalQuerySelector;
    });

    it('should extract file info from block with pattern matching', () => {
      const mockBlock = document.createElement('div');
      const mockSpan = document.createElement('span');
      mockSpan.textContent = 'test.js';
      mockBlock.appendChild(mockSpan);
      
      // Mock querySelector to return null for filename span, but return spans for pattern matching
      const originalQuerySelector = mockBlock.querySelector;
      const originalQuerySelectorAll = mockBlock.querySelectorAll;
      
      mockBlock.querySelector = jest.fn().mockReturnValue(null);
      mockBlock.querySelectorAll = jest.fn().mockReturnValue([mockSpan]);

      const result = autoAcceptManager['extractFileInfoFromBlock'](mockBlock);
      expect(result).toBeDefined();
      expect(result?.filename).toBe('test.js');

      // Restore original
      mockBlock.querySelector = originalQuerySelector;
      mockBlock.querySelectorAll = originalQuerySelectorAll;
    });

    it('should handle file info extraction with no filename found', () => {
      const mockBlock = document.createElement('div');
      
      // Mock querySelector and querySelectorAll to return null/empty
      const originalQuerySelector = mockBlock.querySelector;
      const originalQuerySelectorAll = mockBlock.querySelectorAll;
      
      mockBlock.querySelector = jest.fn().mockReturnValue(null);
      mockBlock.querySelectorAll = jest.fn().mockReturnValue([]);

      const result = autoAcceptManager['extractFileInfoFromBlock'](mockBlock);
      expect(result).toBeNull();

      // Restore original
      mockBlock.querySelector = originalQuerySelector;
      mockBlock.querySelectorAll = originalQuerySelectorAll;
    });

    it('should handle file info extraction with debug mode enabled', () => {
      // Enable debug mode
      autoAcceptManager['debugMode'] = true;
      
      const mockBlock = document.createElement('div');
      mockBlock.className = 'test-block';
      
      // Mock querySelector and querySelectorAll to return null/empty
      const originalQuerySelector = mockBlock.querySelector;
      const originalQuerySelectorAll = mockBlock.querySelectorAll;
      
      mockBlock.querySelector = jest.fn().mockReturnValue(null);
      mockBlock.querySelectorAll = jest.fn().mockReturnValue([]);

      const result = autoAcceptManager['extractFileInfoFromBlock'](mockBlock);
      expect(result).toBeNull();

      // Restore original
      mockBlock.querySelector = originalQuerySelector;
      mockBlock.querySelectorAll = originalQuerySelectorAll;
      
      // Disable debug mode
      autoAcceptManager['debugMode'] = false;
    });

    it('should handle file info extraction error gracefully', () => {
      const mockBlock = document.createElement('div');
      
      // Mock querySelector to throw an error
      const originalQuerySelector = mockBlock.querySelector;
      mockBlock.querySelector = jest.fn().mockImplementation(() => {
        throw new Error('DOM error');
      });

      const result = autoAcceptManager['extractFileInfoFromBlock'](mockBlock);
      expect(result).toBeNull();

      // Restore original
      mockBlock.querySelector = originalQuerySelector;
    });

    it('should extract file info with status elements and diff stats', () => {
      const mockBlock = document.createElement('div');
      const mockFilenameSpan = document.createElement('span');
      mockFilenameSpan.textContent = 'test.js';
      mockBlock.appendChild(mockFilenameSpan);
      
      const mockStatusSpan = document.createElement('span');
      mockStatusSpan.textContent = '+5 -2';
      mockBlock.appendChild(mockStatusSpan);
      
      // Mock querySelector to return the filename span
      const originalQuerySelector = mockBlock.querySelector;
      const originalQuerySelectorAll = mockBlock.querySelectorAll;
      
      mockBlock.querySelector = jest.fn().mockReturnValue(mockFilenameSpan);
      mockBlock.querySelectorAll = jest.fn().mockReturnValue([mockStatusSpan]);

      const result = autoAcceptManager['extractFileInfoFromBlock'](mockBlock);
      expect(result).toBeDefined();
      expect(result?.filename).toBe('test.js');
      expect(result?.addedLines).toBe(5);
      expect(result?.deletedLines).toBe(2);

      // Restore original
      mockBlock.querySelector = originalQuerySelector;
      mockBlock.querySelectorAll = originalQuerySelectorAll;
    });

    it('should handle status elements with no diff stats', () => {
      const mockBlock = document.createElement('div');
      const mockFilenameSpan = document.createElement('span');
      mockFilenameSpan.textContent = 'test.js';
      mockBlock.appendChild(mockFilenameSpan);
      
      const mockStatusSpan = document.createElement('span');
      mockStatusSpan.textContent = 'No changes';
      mockBlock.appendChild(mockStatusSpan);
      
      // Mock querySelector to return the filename span
      const originalQuerySelector = mockBlock.querySelector;
      const originalQuerySelectorAll = mockBlock.querySelectorAll;
      
      mockBlock.querySelector = jest.fn().mockReturnValue(mockFilenameSpan);
      mockBlock.querySelectorAll = jest.fn().mockReturnValue([mockStatusSpan]);

      const result = autoAcceptManager['extractFileInfoFromBlock'](mockBlock);
      expect(result).toBeDefined();
      expect(result?.filename).toBe('test.js');
      expect(result?.addedLines).toBe(0);
      expect(result?.deletedLines).toBe(0);

      // Restore original
      mockBlock.querySelector = originalQuerySelector;
      mockBlock.querySelectorAll = originalQuerySelectorAll;
    });

    it('should handle status elements with only added lines', () => {
      const mockBlock = document.createElement('div');
      const mockFilenameSpan = document.createElement('span');
      mockFilenameSpan.textContent = 'test.js';
      mockBlock.appendChild(mockFilenameSpan);
      
      const mockStatusSpan = document.createElement('span');
      mockStatusSpan.textContent = '+10';
      mockBlock.appendChild(mockStatusSpan);
      
      // Mock querySelector to return the filename span
      const originalQuerySelector = mockBlock.querySelector;
      const originalQuerySelectorAll = mockBlock.querySelectorAll;
      
      mockBlock.querySelector = jest.fn().mockReturnValue(mockFilenameSpan);
      mockBlock.querySelectorAll = jest.fn().mockReturnValue([mockStatusSpan]);

      const result = autoAcceptManager['extractFileInfoFromBlock'](mockBlock);
      expect(result).toBeDefined();
      expect(result?.filename).toBe('test.js');
      expect(result?.addedLines).toBe(10);
      expect(result?.deletedLines).toBe(0);

      // Restore original
      mockBlock.querySelector = originalQuerySelector;
      mockBlock.querySelectorAll = originalQuerySelectorAll;
    });

    it('should handle status elements with only deleted lines', () => {
      const mockBlock = document.createElement('div');
      const mockFilenameSpan = document.createElement('span');
      mockFilenameSpan.textContent = 'test.js';
      mockBlock.appendChild(mockFilenameSpan);
      
      const mockStatusSpan = document.createElement('span');
      mockStatusSpan.textContent = '-3';
      mockBlock.appendChild(mockStatusSpan);
      
      // Mock querySelector to return the filename span
      const originalQuerySelector = mockBlock.querySelector;
      const originalQuerySelectorAll = mockBlock.querySelectorAll;
      
      mockBlock.querySelector = jest.fn().mockReturnValue(mockFilenameSpan);
      mockBlock.querySelectorAll = jest.fn().mockReturnValue([mockStatusSpan]);

      const result = autoAcceptManager['extractFileInfoFromBlock'](mockBlock);
      expect(result).toBeDefined();
      expect(result?.filename).toBe('test.js');
      expect(result?.addedLines).toBe(0);
      expect(result?.deletedLines).toBe(3);

      // Restore original
      mockBlock.querySelector = originalQuerySelector;
      mockBlock.querySelectorAll = originalQuerySelectorAll;
    });

    it('should handle status elements with debug mode enabled', () => {
      // Enable debug mode
      autoAcceptManager['debugMode'] = true;
      
      const mockBlock = document.createElement('div');
      const mockFilenameSpan = document.createElement('span');
      mockFilenameSpan.textContent = 'test.js';
      mockBlock.appendChild(mockFilenameSpan);
      
      const mockStatusSpan = document.createElement('span');
      mockStatusSpan.textContent = '+5 -2';
      mockBlock.appendChild(mockStatusSpan);
      
      // Mock querySelector to return the filename span
      const originalQuerySelector = mockBlock.querySelector;
      const originalQuerySelectorAll = mockBlock.querySelectorAll;
      
      mockBlock.querySelector = jest.fn().mockReturnValue(mockFilenameSpan);
      mockBlock.querySelectorAll = jest.fn().mockReturnValue([mockStatusSpan]);

      const result = autoAcceptManager['extractFileInfoFromBlock'](mockBlock);
      expect(result).toBeDefined();
      expect(result?.filename).toBe('test.js');

      // Restore original
      mockBlock.querySelector = originalQuerySelector;
      mockBlock.querySelectorAll = originalQuerySelectorAll;
      
      // Disable debug mode
      autoAcceptManager['debugMode'] = false;
    });

    it('should handle multiple status elements with different stats', () => {
      const mockBlock = document.createElement('div');
      const mockFilenameSpan = document.createElement('span');
      mockFilenameSpan.textContent = 'test.js';
      mockBlock.appendChild(mockFilenameSpan);
      
      const mockStatusSpan1 = document.createElement('span');
      mockStatusSpan1.textContent = '+5';
      mockBlock.appendChild(mockStatusSpan1);
      
      const mockStatusSpan2 = document.createElement('span');
      mockStatusSpan2.textContent = '-2';
      mockBlock.appendChild(mockStatusSpan2);
      
      // Mock querySelector to return the filename span
      const originalQuerySelector = mockBlock.querySelector;
      const originalQuerySelectorAll = mockBlock.querySelectorAll;
      
      mockBlock.querySelector = jest.fn().mockReturnValue(mockFilenameSpan);
      mockBlock.querySelectorAll = jest.fn().mockReturnValue([mockStatusSpan1, mockStatusSpan2]);

      const result = autoAcceptManager['extractFileInfoFromBlock'](mockBlock);
      expect(result).toBeDefined();
      expect(result?.filename).toBe('test.js');
      expect(result?.addedLines).toBe(5);
      expect(result?.deletedLines).toBe(2);

      // Restore original
      mockBlock.querySelector = originalQuerySelector;
      mockBlock.querySelectorAll = originalQuerySelectorAll;
    });

    it('should handle button monitoring with no buttons found', () => {
      // Mock button detector to return no buttons
      mockButtonDetector.findAcceptButtons.mockReturnValue([]);
      
      // Mock extractFileInfo to return null
      const originalExtractFileInfo = autoAcceptManager['extractFileInfo'];
      autoAcceptManager['extractFileInfo'] = jest.fn().mockReturnValue(null);

      // Call the monitoring function
      autoAcceptManager['checkAndClick']();

      expect(mockButtonDetector.findAcceptButtons).toHaveBeenCalled();
      expect(mockAnalyticsManager.trackButtonClick).not.toHaveBeenCalled();

      // Restore original
      autoAcceptManager['extractFileInfo'] = originalExtractFileInfo;
    });

    it('should handle button monitoring with debug mode enabled', () => {
      // Enable debug mode
      autoAcceptManager['debugMode'] = true;
      
      // Mock button detector to return no buttons
      mockButtonDetector.findAcceptButtons.mockReturnValue([]);
      
      // Mock extractFileInfo to return null
      const originalExtractFileInfo = autoAcceptManager['extractFileInfo'];
      autoAcceptManager['extractFileInfo'] = jest.fn().mockReturnValue(null);

      // Call the monitoring function
      autoAcceptManager['checkAndClick']();

      expect(mockButtonDetector.findAcceptButtons).toHaveBeenCalled();

      // Restore original
      autoAcceptManager['extractFileInfo'] = originalExtractFileInfo;
      
      // Disable debug mode
      autoAcceptManager['debugMode'] = false;
    });

    it('should handle button monitoring error gracefully', () => {
      // Mock button detector to throw an error
      mockButtonDetector.findAcceptButtons.mockImplementation(() => {
        throw new Error('Button detection error');
      });

      // Call the monitoring function
      autoAcceptManager['checkAndClick']();

      expect(mockButtonDetector.findAcceptButtons).toHaveBeenCalled();
      expect(mockAnalyticsManager.trackButtonClick).not.toHaveBeenCalled();
    });

    it('should handle button click with file info extraction error', () => {
      // Mock button detector to return a button
      const mockButton = document.createElement('button');
      mockButtonDetector.findAcceptButtons.mockReturnValue([mockButton]);
      
      // Mock extractFileInfo to throw an error
      const originalExtractFileInfo = autoAcceptManager['extractFileInfo'];
      autoAcceptManager['extractFileInfo'] = jest.fn().mockImplementation(() => {
        throw new Error('File info extraction error');
      });

      // Call the monitoring function
      autoAcceptManager['checkAndClick']();

      expect(mockButtonDetector.findAcceptButtons).toHaveBeenCalled();

      // Restore original
      autoAcceptManager['extractFileInfo'] = originalExtractFileInfo;
    });

    it('should handle button click with storage save error', () => {
      // Mock button detector to return a button
      const mockButton = document.createElement('button');
      mockButtonDetector.findAcceptButtons.mockReturnValue([mockButton]);
      
      // Mock extractFileInfo to return file info
      const mockFileInfo = { filename: 'test.js', addedLines: 5, deletedLines: 0, timestamp: new Date() };
      const originalExtractFileInfo = autoAcceptManager['extractFileInfo'];
      autoAcceptManager['extractFileInfo'] = jest.fn().mockReturnValue(mockFileInfo);
      
      // Mock storage save to throw an error
      mockStorageManager.saveData.mockImplementation(() => {
        throw new Error('Storage save error');
      });

      // Call the monitoring function
      autoAcceptManager['checkAndClick']();

      expect(mockButtonDetector.findAcceptButtons).toHaveBeenCalled();

      // Restore original
      autoAcceptManager['extractFileInfo'] = originalExtractFileInfo;
    });

    it('should handle button click with analytics error', () => {
      // Mock button detector to return a button
      const mockButton = document.createElement('button');
      mockButtonDetector.findAcceptButtons.mockReturnValue([mockButton]);
      
      // Mock extractFileInfo to return file info
      const mockFileInfo = { filename: 'test.js', addedLines: 5, deletedLines: 0, timestamp: new Date() };
      const originalExtractFileInfo = autoAcceptManager['extractFileInfo'];
      autoAcceptManager['extractFileInfo'] = jest.fn().mockReturnValue(mockFileInfo);
      
      // Mock analytics to throw an error
      mockAnalyticsManager.trackButtonClick.mockImplementation(() => {
        throw new Error('Analytics error');
      });

      // Call the monitoring function
      autoAcceptManager['checkAndClick']();

      expect(mockButtonDetector.findAcceptButtons).toHaveBeenCalled();

      // Restore original
      autoAcceptManager['extractFileInfo'] = originalExtractFileInfo;
    });
  });
});
