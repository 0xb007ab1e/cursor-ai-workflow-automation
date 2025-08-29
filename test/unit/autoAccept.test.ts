// Mock ButtonDetector before importing AutoAcceptManager
jest.mock('../../src/buttonDetector');

import { AutoAcceptManager } from '../../src/autoAccept';
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
});
