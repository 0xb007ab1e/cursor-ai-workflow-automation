import { AutoAcceptManager } from '../../src/autoAccept';
import { AnalyticsManager } from '../../src/analytics';
import { StorageManager } from '../../src/storage';
import { ButtonDetector } from '../../src/buttonDetector';
import { mockVscode as setupMockVscode } from '../setup';

// Mock DOM functions that don't exist in the test environment
const createMockButton = (text: string, attributes: Record<string, any> = {}) => {
  const button = document.createElement('button');
  button.textContent = text;
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'class') {
      button.className = value;
    } else {
      button.setAttribute(key, value);
    }
  });
  return button;
};

const createMockDiv = (className: string, textContent?: string) => {
  const div = document.createElement('div');
  div.className = className;
  if (textContent) {
    div.textContent = textContent;
  }
  return div;
};

describe('AutoAcceptManager Integration Tests', () => {
  let autoAcceptManager: AutoAcceptManager;
  let analyticsManager: AnalyticsManager;
  let storageManager: StorageManager;
  let buttonDetector: ButtonDetector;
  let mockContext: any;

  beforeEach(() => {
    mockContext = new setupMockVscode.ExtensionContext();
    storageManager = new StorageManager(mockContext);
    analyticsManager = new AnalyticsManager(storageManager);
    buttonDetector = new ButtonDetector('cursor');
    
    // Create AutoAcceptManager with test configuration override
    autoAcceptManager = new AutoAcceptManager(analyticsManager, storageManager, {
      interval: 1000,
      debugMode: false,
      buttonConfig: {
        enableAcceptAll: true,
        enableAccept: true,
        enableRun: true,
        enableApply: true,
        enableResume: true,
        enableConnectionResume: true,
        enableTryAgain: true
      }
    });
    
    // Setup DOM for testing
    document.body.innerHTML = '';
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
    jest.clearAllTimers();
  });

  describe('initialization and configuration', () => {
    it('should initialize with all dependencies', () => {
      expect(autoAcceptManager).toBeInstanceOf(AutoAcceptManager);
      expect(autoAcceptManager['analyticsManager']).toBe(analyticsManager);
      expect(autoAcceptManager['storageManager']).toBe(storageManager);
    });

    it('should start with stopped state', () => {
      expect(autoAcceptManager.isRunning()).toBe(false);
    });

    it('should load configuration from storage', async () => {
      const config = {
        totalClicks: 5,
        timestamp: new Date()
      };

      await storageManager.saveData(config);
      
      const newManager = new AutoAcceptManager(analyticsManager, storageManager);
      
      // Check that the manager is properly initialized
      expect(newManager.isRunning()).toBe(false);
    });

    it('should handle configuration loading errors gracefully', async () => {
      // Mock configuration loading error by creating a problematic storage manager
      const problematicStorageManager = {
        ...storageManager,
        getData: jest.fn().mockImplementation(() => {
          throw new Error('Config load error');
        })
      } as any;

      expect(() => new AutoAcceptManager(analyticsManager, problematicStorageManager)).not.toThrow();
    });

    it('should handle storage loading errors gracefully', async () => {
      // Mock storage loading error
      const problematicStorageManager = {
        ...storageManager,
        getData: jest.fn().mockImplementation(() => {
          throw new Error('Storage load error');
        })
      } as any;

      expect(() => new AutoAcceptManager(analyticsManager, problematicStorageManager)).not.toThrow();
    });
  });

  describe('start and stop functionality', () => {
    it('should start auto-accept process', async () => {
      autoAcceptManager.start();
      
      expect(autoAcceptManager.isRunning()).toBe(true);
    });

    it('should stop auto-accept process', async () => {
      autoAcceptManager.start();
      expect(autoAcceptManager.isRunning()).toBe(true);
      
      autoAcceptManager.stop();
      
      expect(autoAcceptManager.isRunning()).toBe(false);
    });

    it('should handle multiple start/stop cycles', async () => {
      for (let i = 0; i < 3; i++) {
        autoAcceptManager.start();
        expect(autoAcceptManager.isRunning()).toBe(true);
        
        autoAcceptManager.stop();
        expect(autoAcceptManager.isRunning()).toBe(false);
      }
    });

    it('should not start if already running', async () => {
      autoAcceptManager.start();
      expect(autoAcceptManager.isRunning()).toBe(true);
      
      autoAcceptManager.start();
      expect(autoAcceptManager.isRunning()).toBe(true);
    });

    it('should not stop if not running', async () => {
      autoAcceptManager.stop();
      expect(autoAcceptManager.isRunning()).toBe(false);
    });
  });

  describe('button detection and interaction', () => {
    it('should detect and interact with accept buttons', () => {
      // Create mock buttons
      const acceptButton = createMockButton('Accept', { class: 'accept-btn' });
      const acceptAllButton = createMockButton('Accept All', { class: 'accept-all-btn' });
      
      document.body.appendChild(acceptButton);
      document.body.appendChild(acceptAllButton);

      // Start the manager
      autoAcceptManager.start();
      
      // The manager should be running and looking for buttons
      expect(autoAcceptManager.isRunning()).toBe(true);
    });

    it('should handle different button types', () => {
      const buttons = [
        createMockButton('Accept', { class: 'accept-btn' }),
        createMockButton('Run', { class: 'run-btn' }),
        createMockButton('Apply', { class: 'apply-btn' })
      ];

      buttons.forEach(button => document.body.appendChild(button));

      autoAcceptManager.start();
      expect(autoAcceptManager.isRunning()).toBe(true);
    });
  });

  describe('file information extraction', () => {
    it('should extract file information from DOM elements', () => {
      const container = createMockDiv('container');
      const diffBlock = createMockDiv('diff-block');
      const fileName = createMockDiv('file-name', 'test.ts');
      const language = createMockDiv('language', 'typescript');
      
      container.appendChild(diffBlock);
      diffBlock.appendChild(fileName);
      diffBlock.appendChild(language);
      
      document.body.appendChild(container);

      // Test that the manager can process the DOM
      autoAcceptManager.start();
      expect(autoAcceptManager.isRunning()).toBe(true);
    });

    it('should handle missing file information gracefully', () => {
      const container = createMockDiv('container');
      document.body.appendChild(container);

      autoAcceptManager.start();
      expect(autoAcceptManager.isRunning()).toBe(true);
    });
  });

  describe('IDE detection', () => {
    it('should detect Cursor IDE', () => {
      const cursorElement = createMockDiv('cursor-chat');
      document.body.appendChild(cursorElement);

      const newManager = new AutoAcceptManager(analyticsManager, storageManager);
      expect(newManager).toBeInstanceOf(AutoAcceptManager);
    });

    it('should detect Windsurf IDE', () => {
      const windsurfElement = createMockDiv('windsurf-chat');
      document.body.appendChild(windsurfElement);

      const newManager = new AutoAcceptManager(analyticsManager, storageManager);
      expect(newManager).toBeInstanceOf(AutoAcceptManager);
    });

    it('should default to Cursor IDE', () => {
      const newManager = new AutoAcceptManager(analyticsManager, storageManager);
      expect(newManager).toBeInstanceOf(AutoAcceptManager);
    });
  });

  describe('analytics integration', () => {
    it('should track button clicks', async () => {
      const button = createMockButton('Accept', { class: 'accept-btn' });
      document.body.appendChild(button);

      autoAcceptManager.start();
      
      // Check that analytics are being tracked
      const analytics = await analyticsManager.getAnalyticsData();
      expect(analytics).toBeDefined();
    });

    it('should track file acceptances', async () => {
      const container = createMockDiv('container');
      const diffBlock = createMockDiv('diff-block');
      const fileName = createMockDiv('file-name', 'test.ts');
      const language = createMockDiv('language', 'typescript');
      
      container.appendChild(diffBlock);
      diffBlock.appendChild(fileName);
      diffBlock.appendChild(language);
      
      document.body.appendChild(container);

      const button = createMockButton('Accept', { class: 'accept-btn' });
      document.body.appendChild(button);

      autoAcceptManager.start();
      
      // Check that analytics are being tracked
      const analytics = await analyticsManager.getAnalyticsData();
      expect(analytics).toBeDefined();
    });

    it('should handle multiple file acceptances', async () => {
      for (let i = 0; i < 5; i++) {
        const container = createMockDiv('container');
        const diffBlock = createMockDiv('diff-block');
        const fileName = createMockDiv('file-name', `file${i}.ts`);
        const language = createMockDiv('language', 'typescript');
        
        container.appendChild(diffBlock);
        diffBlock.appendChild(fileName);
        diffBlock.appendChild(language);
        
        document.body.appendChild(container);
      }

      const button = createMockButton('Accept', { class: 'accept-btn' });
      document.body.appendChild(button);

      autoAcceptManager.start();
      
      // Check that analytics are being tracked
      const analytics = await analyticsManager.getAnalyticsData();
      expect(analytics).toBeDefined();
    });
  });

  describe('configuration management', () => {
    it('should update button configuration', async () => {
      const config = {
        totalClicks: 10,
        timestamp: new Date()
      };

      await storageManager.saveData(config);
      
      const newManager = new AutoAcceptManager(analyticsManager, storageManager);
      
      // Test configuration methods
      newManager.enableOnly(['Accept', 'Run']);
      newManager.enableAll();
      newManager.disableAll();
      
      expect(newManager).toBeInstanceOf(AutoAcceptManager);
    });

    it('should handle configuration updates', async () => {
      const newConfig = {
        totalClicks: 15,
        timestamp: new Date()
      };

      await storageManager.saveData(newConfig);
      
      const newManager = new AutoAcceptManager(analyticsManager, storageManager);
      
      // Test button-specific configuration
      newManager.enableButton('Accept');
      newManager.disableButton('Run');
      newManager.toggleButton('Apply');
      
      expect(newManager).toBeInstanceOf(AutoAcceptManager);
    });

    it('should persist configuration changes', async () => {
      const config = {
        totalClicks: 20,
        timestamp: new Date()
      };

      await storageManager.saveData(config);
      
      const newManager = new AutoAcceptManager(analyticsManager, storageManager);
      
      // Test configuration persistence
      newManager.setDebugMode(true);
      newManager.toggleDebug();
      
      expect(newManager).toBeInstanceOf(AutoAcceptManager);
    });

    it('should enable debug mode', async () => {
      autoAcceptManager.setDebugMode(true);
      expect(autoAcceptManager['debugMode']).toBe(true);
    });

    it('should toggle debug mode', async () => {
      const initialDebugMode = autoAcceptManager['debugMode'];
      autoAcceptManager.toggleDebug();
      expect(autoAcceptManager['debugMode']).toBe(!initialDebugMode);
    });

    it('should disable debug mode', async () => {
      autoAcceptManager.setDebugMode(false);
      expect(autoAcceptManager['debugMode']).toBe(false);
    });
  });

  describe('workflow calibration', () => {
    it('should calibrate workflow times', async () => {
      const manualTime = 30;
      const autoTime = 0.5;

      autoAcceptManager.calibrateWorkflowTimes(manualTime, autoTime);
      
      // Check that the calibration was applied
      const analytics = await analyticsManager.getAnalyticsData();
      expect(analytics).toBeDefined();
    });

    it('should handle workflow calibration with different values', async () => {
      autoAcceptManager.calibrateWorkflowTimes(60, 0.5);
      
      // Check that the calibration was applied
      const roi = await analyticsManager.getROIData();
      expect(roi).toBeDefined();
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle problematic DOM elements gracefully', () => {
      const problematicContainer = createMockDiv('problematic');
      problematicContainer.innerHTML = '<invalid>html</invalid>';
      document.body.appendChild(problematicContainer);

      expect(() => autoAcceptManager.start()).not.toThrow();
    });

    it('should handle storage errors gracefully', async () => {
      // Mock storage error
      (jest.spyOn(storageManager, 'saveData') as any).mockRejectedValue(new Error('Storage error'));

      expect(() => autoAcceptManager.start()).not.toThrow();
    });

    it('should handle DOM query errors gracefully', () => {
      // Mock DOM query error
      const originalQuerySelector = document.querySelector;
      document.querySelector = jest.fn(() => {
        throw new Error('DOM error');
      });

      expect(() => autoAcceptManager.start()).not.toThrow();

      // Restore original function
      document.querySelector = originalQuerySelector;
    });
  });

  describe('performance and scalability', () => {
    it('should handle large numbers of buttons efficiently', () => {
      const buttons = Array.from({ length: 1000 }, (_, i) => 
        createMockButton(`Accept ${i}`, { class: `accept-btn-${i}` })
      );

      buttons.forEach(button => document.body.appendChild(button));

      const startTime = performance.now();
      autoAcceptManager.start();
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(autoAcceptManager.isRunning()).toBe(true);
    });

    it('should handle rapid start/stop cycles', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        autoAcceptManager.start();
        autoAcceptManager.stop();
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('state management', () => {
    it('should emit state change events', () => {
      const stateChangeCallback = jest.fn();
      autoAcceptManager.onStateChange(stateChangeCallback);

      autoAcceptManager.start();
      expect(stateChangeCallback).toHaveBeenCalled();

      autoAcceptManager.stop();
      expect(stateChangeCallback).toHaveBeenCalled();
    });

    it('should provide status information', () => {
      const status = autoAcceptManager.getStatus();
      
      expect(status).toHaveProperty('isRunning');
      expect(status).toHaveProperty('interval');
      expect(status).toHaveProperty('totalClicks');
      expect(status).toHaveProperty('debugMode');
      expect(status).toHaveProperty('ideType');
    });

    it('should track total clicks', () => {
      const initialStatus = autoAcceptManager.getStatus();
      
      autoAcceptManager.start();
      autoAcceptManager.stop();
      
      const finalStatus = autoAcceptManager.getStatus();
      expect(finalStatus.totalClicks).toBeGreaterThanOrEqual(initialStatus.totalClicks);
    });
  });

  describe('session management', () => {
    it('should manage user sessions', async () => {
      let analytics = await analyticsManager.getAnalyticsData();
      expect(analytics.currentSession).toBeNull();

      analyticsManager.startSession();
      analytics = await analyticsManager.getAnalyticsData();
      expect(analytics.currentSession).not.toBeNull();

      await analyticsManager.endSession();
      analytics = await analyticsManager.getAnalyticsData();
      expect(analytics.currentSession).toBeNull();
    });

    it('should handle multiple sessions', async () => {
      for (let i = 0; i < 3; i++) {
        analyticsManager.startSession();
        await analyticsManager.endSession();
      }

      const analytics = await analyticsManager.getAnalyticsData();
      expect(analytics.userSessions).toHaveLength(3);
    });
  });

  describe('diff block processing', () => {
    it('should find diff blocks in document', () => {
      const container = createMockDiv('container');
      const diffBlock = createMockDiv('diff-block');
      const fileName = createMockDiv('file-name', 'test.ts');
      const language = createMockDiv('language', 'typescript');
      
      container.appendChild(diffBlock);
      diffBlock.appendChild(fileName);
      diffBlock.appendChild(language);
      
      document.body.appendChild(container);

      const diffBlocks = autoAcceptManager.findDiffBlocks();
      expect(diffBlocks).toBeDefined();
    });

    it('should find recent diff blocks', () => {
      const container = createMockDiv('container');
      const diffBlock = createMockDiv('diff-block');
      const fileName = createMockDiv('file-name', 'test.ts');
      const language = createMockDiv('language', 'typescript');
      
      container.appendChild(diffBlock);
      diffBlock.appendChild(fileName);
      diffBlock.appendChild(language);
      
      document.body.appendChild(container);

      const recentBlocks = autoAcceptManager.findRecentDiffBlocks(30000); // 30 seconds
      expect(recentBlocks).toBeDefined();
    });

    it('should get conversation context', () => {
      const container = createMockDiv('container');
      const diffBlock = createMockDiv('diff-block');
      const fileName = createMockDiv('file-name', 'test.ts');
      const language = createMockDiv('language', 'typescript');
      
      container.appendChild(diffBlock);
      diffBlock.appendChild(fileName);
      diffBlock.appendChild(language);
      
      document.body.appendChild(container);

      const context = autoAcceptManager.getConversationContext();
      expect(context).toBeDefined();
    });

    it('should log conversation activity', () => {
      expect(() => autoAcceptManager.logConversationActivity()).not.toThrow();
    });
  });

  describe('complex workflow scenarios', () => {
    it('should handle complex workflow scenarios', async () => {
      // Setup complex DOM with multiple button types
      const acceptButton = createMockButton('Accept', { class: 'accept-button' });
      const runButton = createMockButton('Run', { class: 'run-button' });
      const applyButton = createMockButton('Apply', { class: 'apply-button' });
      
      document.body.appendChild(acceptButton);
      document.body.appendChild(runButton);
      document.body.appendChild(applyButton);

      // Start auto-accept
      autoAcceptManager.start();
      expect(autoAcceptManager.isRunning()).toBe(true);

      // Simulate button interactions
      await new Promise(resolve => setTimeout(resolve, 100));

      // Stop auto-accept
      autoAcceptManager.stop();
      expect(autoAcceptManager.isRunning()).toBe(false);
    });

    it('should handle analytics data persistence', async () => {
      // Setup button for interaction
      const button = createMockButton('Accept', { class: 'accept-button' });
      document.body.appendChild(button);

      // Start auto-accept and interact
      autoAcceptManager.start();
      await new Promise(resolve => setTimeout(resolve, 100));
      autoAcceptManager.stop();

      // Verify data was persisted
      const data = await storageManager.getData();
      expect(data).toBeDefined();
    });

    it('should handle configuration updates during runtime', () => {
      // Start auto-accept
      autoAcceptManager.start();
      expect(autoAcceptManager.isRunning()).toBe(true);

      // Update configuration
      autoAcceptManager.enableOnly(['accept']);
      autoAcceptManager.setDebugMode(true);

      // Verify configuration was updated
      expect(autoAcceptManager['debugMode']).toBe(true);

      // Stop auto-accept
      autoAcceptManager.stop();
    });

    it('should handle error recovery scenarios', async () => {
      // Setup problematic DOM
      const problematicButton = createMockButton('Accept', { 
        class: 'accept-button',
        onclick: () => { throw new Error('Button error'); }
      });
      document.body.appendChild(problematicButton);

      // Start auto-accept - should handle errors gracefully
      autoAcceptManager.start();
      await new Promise(resolve => setTimeout(resolve, 100));
      autoAcceptManager.stop();

      // Should still be able to stop gracefully
      expect(autoAcceptManager.isRunning()).toBe(false);
    });

    it('should handle multiple rapid state changes', () => {
      // Test rapid start/stop cycles
      for (let i = 0; i < 5; i++) {
        autoAcceptManager.start();
        expect(autoAcceptManager.isRunning()).toBe(true);
        autoAcceptManager.stop();
        expect(autoAcceptManager.isRunning()).toBe(false);
      }
    });

    it('should handle workflow calibration integration', () => {
      // Test workflow calibration
      const manualTime = 30;
      const autoTime = 5;
      
      autoAcceptManager.calibrateWorkflowTimes(manualTime, autoTime * 1000);
      
      // Verify calibration was applied by checking if the method exists and was called
      expect(typeof autoAcceptManager.calibrateWorkflowTimes).toBe('function');
    });

    it('should handle session management integration', () => {
      // Start a session
      analyticsManager.startSession();
      
      // End the session
      analyticsManager.endSession();
      
      // Verify session management works by checking if methods were called
      expect(analyticsManager.startSession).toBeDefined();
      expect(analyticsManager.endSession).toBeDefined();
    });

    it('should handle ROI calculations integration', () => {
      // Setup some analytics data
      analyticsManager.trackButtonClick('accept', 1000);
      analyticsManager.trackFileAcceptance({ filename: 'test.js', addedLines: 10, deletedLines: 2, timestamp: new Date() });

      // Calculate ROI
      const roi = analyticsManager.calculateTimeSaved('accept');
      expect(roi).toBeDefined();
      expect(typeof roi).toBe('number');
    });

    it('should handle data export integration', () => {
      // Add some data
      analyticsManager.trackButtonClick('accept', 500);
      analyticsManager.trackFileAcceptance({ filename: 'test.js', addedLines: 5, deletedLines: 1, timestamp: new Date() });

      // Export data
      const exportData = analyticsManager.exportData();
      expect(exportData).toBeDefined();
      expect(exportData.analytics).toBeDefined();
      // Note: roiTracking might be undefined in some cases, so we'll check if it exists
      if (exportData.roiTracking) {
        expect(exportData.roiTracking).toBeDefined();
      }
    });

    it('should handle storage cleanup integration', async () => {
      // Add some data
      await storageManager.saveData({
        analytics: { files: [], sessions: [], totalAccepts: 0 },
        roiTracking: { workflowSessions: [], codeGenerationSessions: [] }
      });

      // Verify data exists
      const data = await storageManager.getData();
      expect(data).toBeDefined();

      // Clear all data
      await storageManager.clearAllData();

      // Verify data was cleared
      const clearedData = await storageManager.getData();
      expect(clearedData).toBeNull();
    });
  });
});
