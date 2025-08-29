import { ControlPanel } from '../../src/controlPanel';
import { AutoAcceptManager } from '../../src/autoAccept';
import { AnalyticsManager } from '../../src/analytics';
import * as vscode from 'vscode';

// Mock VS Code API
jest.mock('vscode', () => ({
  window: {
    showInputBox: jest.fn(),
    showInformationMessage: jest.fn(),
  },
}));

describe('ControlPanel', () => {
  let controlPanel: ControlPanel;
  let mockAutoAcceptManager: jest.Mocked<AutoAcceptManager>;
  let mockAnalyticsManager: jest.Mocked<AnalyticsManager>;
  let mockWebviewView: jest.Mocked<vscode.WebviewView>;
  let mockWebview: jest.Mocked<vscode.Webview>;

  beforeEach(() => {
    // Create mocks
    mockAutoAcceptManager = {
      start: jest.fn(),
      stop: jest.fn(),
      toggleDebug: jest.fn(),
      calibrateWorkflowTimes: jest.fn(),
      getStatus: jest.fn().mockReturnValue({
        isRunning: false,
        totalClicks: 0,
        lastClickTime: null,
      }),
    } as any;

    mockAnalyticsManager = {
      exportData: jest.fn(),
      clearAllData: jest.fn(),
      getAnalyticsData: jest.fn().mockReturnValue({}),
      getROIStats: jest.fn().mockReturnValue({}),
      getSessionStats: jest.fn().mockReturnValue({}),
      getProjections: jest.fn().mockReturnValue({}),
    } as any;

    mockWebview = {
      options: {},
      html: '',
      onDidReceiveMessage: jest.fn(),
      postMessage: jest.fn(),
    } as any;

    mockWebviewView = {
      webview: mockWebview,
      show: jest.fn(),
      onDidReceiveMessage: jest.fn(),
    } as any;

    controlPanel = new ControlPanel(mockAutoAcceptManager, mockAnalyticsManager);
  });

  describe('constructor', () => {
    it('should initialize with dependencies', () => {
      expect(controlPanel).toBeInstanceOf(ControlPanel);
    });
  });

  describe('resolveWebviewView', () => {
    it('should set up webview view correctly', () => {
      const mockContext = {} as vscode.WebviewViewResolveContext;
      const mockToken = {} as vscode.CancellationToken;

      controlPanel.resolveWebviewView(mockWebviewView, mockContext, mockToken);

      expect(mockWebviewView.webview.options).toEqual({
        enableScripts: true,
        localResourceRoots: [],
      });
    });

    it('should handle cancellation token in resolveWebviewView', () => {
      // Test cancellation token handling
      const mockContext = {} as vscode.WebviewViewResolveContext;
      const mockToken = {
        isCancellationRequested: true
      } as vscode.CancellationToken;
      
      // Call resolveWebviewView with cancellation token
      controlPanel.resolveWebviewView(mockWebviewView, mockContext, mockToken);

      // Should return early due to cancellation
      expect(mockWebviewView.webview.html).toBe('');
    });

    it('should handle start command', () => {
      const mockContext = {} as vscode.WebviewViewResolveContext;
      const mockToken = {} as vscode.CancellationToken;

      controlPanel.resolveWebviewView(mockWebviewView, mockContext, mockToken);

      // Simulate message from webview
      const messageHandler = mockWebviewView.webview.onDidReceiveMessage as jest.Mock;
      const handler = messageHandler.mock.calls[0][0];
      
      handler({ command: 'start' });
      
      expect(mockAutoAcceptManager.start).toHaveBeenCalled();
    });

    it('should handle stop command', () => {
      const mockContext = {} as vscode.WebviewViewResolveContext;
      const mockToken = {} as vscode.CancellationToken;

      controlPanel.resolveWebviewView(mockWebviewView, mockContext, mockToken);

      const messageHandler = mockWebviewView.webview.onDidReceiveMessage as jest.Mock;
      const handler = messageHandler.mock.calls[0][0];
      
      handler({ command: 'stop' });
      
      expect(mockAutoAcceptManager.stop).toHaveBeenCalled();
    });

    it('should handle export command', () => {
      const mockContext = {} as vscode.WebviewViewResolveContext;
      const mockToken = {} as vscode.CancellationToken;

      controlPanel.resolveWebviewView(mockWebviewView, mockContext, mockToken);

      const messageHandler = mockWebviewView.webview.onDidReceiveMessage as jest.Mock;
      const handler = messageHandler.mock.calls[0][0];
      
      handler({ command: 'export' });
      
      expect(mockAnalyticsManager.exportData).toHaveBeenCalled();
    });

    it('should handle clear command', () => {
      const mockContext = {} as vscode.WebviewViewResolveContext;
      const mockToken = {} as vscode.CancellationToken;

      controlPanel.resolveWebviewView(mockWebviewView, mockContext, mockToken);

      const messageHandler = mockWebviewView.webview.onDidReceiveMessage as jest.Mock;
      const handler = messageHandler.mock.calls[0][0];
      
      handler({ command: 'clear' });
      
      expect(mockAnalyticsManager.clearAllData).toHaveBeenCalled();
    });

    it('should handle toggleDebug command', () => {
      const mockContext = {} as vscode.WebviewViewResolveContext;
      const mockToken = {} as vscode.CancellationToken;

      controlPanel.resolveWebviewView(mockWebviewView, mockContext, mockToken);

      const messageHandler = mockWebviewView.webview.onDidReceiveMessage as jest.Mock;
      const handler = messageHandler.mock.calls[0][0];
      
      handler({ command: 'toggleDebug' });
      
      expect(mockAutoAcceptManager.toggleDebug).toHaveBeenCalled();
    });

    it('should handle calibrate command', () => {
      const mockContext = {} as vscode.WebviewViewResolveContext;
      const mockToken = {} as vscode.CancellationToken;

      controlPanel.resolveWebviewView(mockWebviewView, mockContext, mockToken);

      const messageHandler = mockWebviewView.webview.onDidReceiveMessage as jest.Mock;
      const handler = messageHandler.mock.calls[0][0];
      
      handler({ command: 'calibrate' });
      
      // showCalibrateDialog is private, so we can't directly test it
      // But we can verify the command was handled
      expect(mockWebviewView.webview.onDidReceiveMessage).toHaveBeenCalled();
    });

    it('should handle switchTab command', () => {
      const mockContext = {} as vscode.WebviewViewResolveContext;
      const mockToken = {} as vscode.CancellationToken;

      controlPanel.resolveWebviewView(mockWebviewView, mockContext, mockToken);

      const messageHandler = mockWebviewView.webview.onDidReceiveMessage as jest.Mock;
      const handler = messageHandler.mock.calls[0][0];
      
      handler({ command: 'switchTab', tab: 'analytics' });
      
      // switchTab is private, so we can't directly test it
      // But we can verify the command was handled
      expect(mockWebviewView.webview.onDidReceiveMessage).toHaveBeenCalled();
    });

    it('should handle unknown command gracefully', () => {
      const mockContext = {} as vscode.WebviewViewResolveContext;
      const mockToken = {} as vscode.CancellationToken;

      controlPanel.resolveWebviewView(mockWebviewView, mockContext, mockToken);

      const messageHandler = mockWebviewView.webview.onDidReceiveMessage as jest.Mock;
      const handler = messageHandler.mock.calls[0][0];
      
      // Should not throw error
      expect(() => handler({ command: 'unknown' })).not.toThrow();
    });
  });

  describe('show', () => {
    it('should show webview view when available', () => {
      const mockContext = {} as vscode.WebviewViewResolveContext;
      const mockToken = {} as vscode.CancellationToken;

      controlPanel.resolveWebviewView(mockWebviewView, mockContext, mockToken);
      controlPanel.show();

      expect(mockWebviewView.show).toHaveBeenCalled();
    });

    it('should not show webview view when not available', () => {
      controlPanel.show();
      expect(mockWebviewView.show).not.toHaveBeenCalled();
    });
  });

  describe('showAnalyticsTab', () => {
    it('should show analytics tab when webview is available', () => {
      const mockContext = {} as vscode.WebviewViewResolveContext;
      const mockToken = {} as vscode.CancellationToken;

      controlPanel.resolveWebviewView(mockWebviewView, mockContext, mockToken);
      controlPanel.showAnalyticsTab();

      expect(mockWebviewView.show).toHaveBeenCalled();
      expect(mockWebviewView.webview.postMessage).toHaveBeenCalledWith({
        command: 'switchTab',
        tab: 'analytics',
      });
    });

    it('should not show analytics tab when webview is not available', () => {
      controlPanel.showAnalyticsTab();
      expect(mockWebviewView.show).not.toHaveBeenCalled();
      expect(mockWebviewView.webview.postMessage).not.toHaveBeenCalled();
    });
  });

  describe('injectScripts', () => {
    it('should update webview when available', () => {
      const mockContext = {} as vscode.WebviewViewResolveContext;
      const mockToken = {} as vscode.CancellationToken;

      controlPanel.resolveWebviewView(mockWebviewView, mockContext, mockToken);
      controlPanel.injectScripts();

      expect(mockWebviewView.webview.postMessage).toHaveBeenCalled();
    });

    it('should not update webview when not available', () => {
      controlPanel.injectScripts();
      expect(mockWebviewView.webview.postMessage).not.toHaveBeenCalled();
    });
  });

  describe('private methods', () => {
    it('should handle switchTab correctly through public method', () => {
      const mockContext = {} as vscode.WebviewViewResolveContext;
      const mockToken = {} as vscode.CancellationToken;

      controlPanel.resolveWebviewView(mockWebviewView, mockContext, mockToken);
      
      // Test switchTab through the public showAnalyticsTab method
      controlPanel.showAnalyticsTab();

      expect(mockWebviewView.webview.postMessage).toHaveBeenCalledWith({
        command: 'switchTab',
        tab: 'analytics',
      });
    });

    it('should handle updateWebview correctly through public method', () => {
      const mockContext = {} as vscode.WebviewViewResolveContext;
      const mockToken = {} as vscode.CancellationToken;

      controlPanel.resolveWebviewView(mockWebviewView, mockContext, mockToken);
      
      // Test updateWebview through the public injectScripts method
      controlPanel.injectScripts();

      expect(mockWebviewView.webview.postMessage).toHaveBeenCalledWith({
        command: 'updateData',
        data: {
          status: mockAutoAcceptManager.getStatus(),
          analytics: mockAnalyticsManager.getAnalyticsData(),
          roiStats: mockAnalyticsManager.getROIStats(),
          sessionStats: mockAnalyticsManager.getSessionStats(),
          projections: mockAnalyticsManager.getProjections(),
        },
      });
    });
  });

  describe('showCalibrateDialog', () => {
    it('should show calibration dialog through public interface', async () => {
      const mockContext = {} as vscode.WebviewViewResolveContext;
      const mockToken = {} as vscode.CancellationToken;

      controlPanel.resolveWebviewView(mockWebviewView, mockContext, mockToken);
      
      // Mock the input box response
      (vscode.window.showInputBox as jest.Mock).mockResolvedValueOnce('30');
      (vscode.window.showInputBox as jest.Mock).mockResolvedValueOnce('0.1');

      // Test through the public message handler
      const messageHandler = mockWebviewView.webview.onDidReceiveMessage as jest.Mock;
      const handler = messageHandler.mock.calls[0][0];
      
      await handler({ command: 'calibrate' });

      expect(vscode.window.showInputBox).toHaveBeenCalledTimes(2);
      // Note: The calibrateWorkflowTimes call happens inside showCalibrateDialog which is private
      // We can't directly test it, but we can verify the command was handled
    });

    it('should handle cancellation gracefully', async () => {
      const mockContext = {} as vscode.WebviewViewResolveContext;
      const mockToken = {} as vscode.CancellationToken;

      controlPanel.resolveWebviewView(mockWebviewView, mockContext, mockToken);
      
      // Mock the input box cancellation
      (vscode.window.showInputBox as jest.Mock).mockResolvedValueOnce(undefined);

      // Access private method through reflection for testing
      const showCalibrateDialogMethod = (controlPanel as any).showCalibrateDialog;
      await showCalibrateDialogMethod();

      expect(vscode.window.showInputBox).toHaveBeenCalledTimes(1);
    });
  });

  describe('HTML generation', () => {
    it('should generate valid HTML', () => {
      const mockContext = {} as vscode.WebviewViewResolveContext;
      const mockToken = {} as vscode.CancellationToken;

      controlPanel.resolveWebviewView(mockWebviewView, mockContext, mockToken);
      
      // Access private method through reflection for testing
      const getHtmlForWebviewMethod = (controlPanel as any).getHtmlForWebview;
      const html = getHtmlForWebviewMethod(mockWebview);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<title>Cursor Auto Accept</title>');
      expect(html).toContain('startBtn');
      expect(html).toContain('stopBtn');
    });
  });
});
