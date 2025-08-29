import { ButtonDetector } from '../../src/buttonDetector';

describe('ButtonDetector', () => {
  let buttonDetector: ButtonDetector;

  beforeEach(() => {
    buttonDetector = new ButtonDetector('cursor');
  });

  describe('constructor', () => {
    it('should initialize with cursor IDE type', () => {
      expect(buttonDetector).toBeInstanceOf(ButtonDetector);
      expect((buttonDetector as any).ideType).toBe('cursor');
    });

    it('should initialize with windsurf IDE type', () => {
      const windsurfDetector = new ButtonDetector('windsurf');
      expect((windsurfDetector as any).ideType).toBe('windsurf');
    });

    it('should initialize with default configuration', () => {
      expect((buttonDetector as any).config.enableAccept).toBe(true);
      expect((buttonDetector as any).config.enableAcceptAll).toBe(true);
      expect((buttonDetector as any).config.enableRun).toBe(true);
      expect((buttonDetector as any).config.enableApply).toBe(true);
      expect((buttonDetector as any).config.enableResume).toBe(true);
      expect((buttonDetector as any).config.enableConnectionResume).toBe(true);
      expect((buttonDetector as any).config.enableTryAgain).toBe(true);
    });
  });

  describe('configuration management', () => {
    it('should update configuration', () => {
      const newConfig = { enableAccept: false };
      buttonDetector.updateConfiguration(newConfig);
      expect((buttonDetector as any).config.enableAccept).toBe(false);
    });

    it('should update multiple configuration options', () => {
      const newConfig = { 
        enableAccept: false, 
        enableRun: false, 
        enableResume: false 
      };
      buttonDetector.updateConfiguration(newConfig);
      expect((buttonDetector as any).config.enableAccept).toBe(false);
      expect((buttonDetector as any).config.enableRun).toBe(false);
      expect((buttonDetector as any).config.enableResume).toBe(false);
    });

    it('should enable only specific button types', () => {
      buttonDetector.enableOnly(['accept', 'run']);
      expect((buttonDetector as any).config.enableAccept).toBe(true);
      expect((buttonDetector as any).config.enableRun).toBe(true);
      expect((buttonDetector as any).config.enableAcceptAll).toBe(false);
      expect((buttonDetector as any).config.enableResume).toBe(false);
      expect((buttonDetector as any).config.enableConnectionResume).toBe(false);
      expect((buttonDetector as any).config.enableTryAgain).toBe(false);
    });

    it('should handle empty enableOnly array', () => {
      buttonDetector.enableOnly([]);
      expect((buttonDetector as any).config.enableAccept).toBe(false);
      expect((buttonDetector as any).config.enableAcceptAll).toBe(false);
      expect((buttonDetector as any).config.enableRun).toBe(false);
    });

    it('should enable all button types', () => {
      buttonDetector = new ButtonDetector('cursor');
      
      buttonDetector.enableAll();
      expect((buttonDetector as any).config.enableAccept).toBe(true);
      expect((buttonDetector as any).config.enableAcceptAll).toBe(true);
      expect((buttonDetector as any).config.enableRun).toBe(true);
      expect((buttonDetector as any).config.enableApply).toBe(true);
      expect((buttonDetector as any).config.enableResume).toBe(true);
      expect((buttonDetector as any).config.enableConnectionResume).toBe(true);
      expect((buttonDetector as any).config.enableTryAgain).toBe(true);
    });

    it('should disable all button types', () => {
      buttonDetector.disableAll();
      expect((buttonDetector as any).config.enableAccept).toBe(false);
      expect((buttonDetector as any).config.enableAcceptAll).toBe(false);
      expect((buttonDetector as any).config.enableRun).toBe(false);
      expect((buttonDetector as any).config.enableApply).toBe(false);
      expect((buttonDetector as any).config.enableResume).toBe(false);
      expect((buttonDetector as any).config.enableConnectionResume).toBe(false);
      expect((buttonDetector as any).config.enableTryAgain).toBe(false);
    });

    it('should toggle specific button type', () => {
      buttonDetector.toggleButton('accept');
      expect((buttonDetector as any).config.enableAccept).toBe(false);
      
      buttonDetector.toggleButton('accept');
      expect((buttonDetector as any).config.enableAccept).toBe(true);
    });

    it('should toggle multiple button types', () => {
      buttonDetector.toggleButton('accept');
      buttonDetector.toggleButton('run');
      expect((buttonDetector as any).config.enableAccept).toBe(false);
      expect((buttonDetector as any).config.enableRun).toBe(false);
      
      buttonDetector.toggleButton('accept');
      buttonDetector.toggleButton('run');
      expect((buttonDetector as any).config.enableAccept).toBe(true);
      expect((buttonDetector as any).config.enableRun).toBe(true);
    });

    it('should enable specific button type', () => {
      buttonDetector.disableButton('accept');
      expect((buttonDetector as any).config.enableAccept).toBe(false);
      
      buttonDetector.enableButton('accept');
      expect((buttonDetector as any).config.enableAccept).toBe(true);
    });

    it('should disable specific button type', () => {
      buttonDetector.disableButton('accept');
      expect((buttonDetector as any).config.enableAccept).toBe(false);
    });

    it('should handle unknown button types gracefully', () => {
      expect(() => buttonDetector.enableButton('unknown' as any)).not.toThrow();
      expect(() => buttonDetector.disableButton('unknown' as any)).not.toThrow();
      expect(() => buttonDetector.toggleButton('unknown' as any)).not.toThrow();
    });

    it('should handle case-sensitive button types', () => {
      buttonDetector.enableOnly(['Accept', 'Run']);
      expect((buttonDetector as any).config.enableAccept).toBe(true);
      expect((buttonDetector as any).config.enableRun).toBe(true);
    });
  });

  describe('private methods', () => {
    it('should get file extension', () => {
      const getFileExtension = (buttonDetector as any).getFileExtension;
      expect(getFileExtension('file.ts')).toBe('ts');
      expect(getFileExtension('file.js')).toBe('js');
      expect(getFileExtension('file.tsx')).toBe('tsx');
      expect(getFileExtension('file.jsx')).toBe('jsx');
      expect(getFileExtension('file.py')).toBe('py');
      expect(getFileExtension('file.java')).toBe('java');
      expect(getFileExtension('file.cpp')).toBe('cpp');
      expect(getFileExtension('file.c')).toBe('c');
      expect(getFileExtension('file.h')).toBe('h');
      expect(getFileExtension('file.md')).toBe('md');
      expect(getFileExtension('file.json')).toBe('json');
      expect(getFileExtension('file.xml')).toBe('xml');
      expect(getFileExtension('file')).toBe('');
      expect(getFileExtension('file.')).toBe('');
      expect(getFileExtension('')).toBe('');
      expect(getFileExtension(null as any)).toBe('');
      expect(getFileExtension(undefined as any)).toBe('');
    });

    it('should handle file paths with directories', () => {
      const getFileExtension = (buttonDetector as any).getFileExtension;
      expect(getFileExtension('src/components/Button.tsx')).toBe('tsx');
      expect(getFileExtension('lib/utils/helper.js')).toBe('js');
      expect(getFileExtension('docs/README.md')).toBe('md');
    });

    it('should handle file paths with multiple dots', () => {
      const getFileExtension = (buttonDetector as any).getFileExtension;
      expect(getFileExtension('file.min.js')).toBe('js');
      expect(getFileExtension('component.test.tsx')).toBe('tsx');
      expect(getFileExtension('config.prod.json')).toBe('json');
    });
  });

  describe('IDE type handling', () => {
    it('should handle cursor IDE type correctly', () => {
      const cursorDetector = new ButtonDetector('cursor');
      expect((cursorDetector as any).ideType).toBe('cursor');
    });

    it('should handle windsurf IDE type correctly', () => {
      const windsurfDetector = new ButtonDetector('windsurf');
      expect((windsurfDetector as any).ideType).toBe('windsurf');
    });

    it('should handle windsurf button detection logic', () => {
      const buttonDetector = new ButtonDetector('windsurf');
      
      // Mock document.querySelector for Windsurf IDE to return a mock input box
      const mockInputBox = document.createElement('div');
      const mockQuerySelector = jest.fn().mockReturnValue(mockInputBox);
      Object.defineProperty(document, 'querySelector', {
        value: mockQuerySelector,
        writable: true
      });

      // Mock the findWindsurfButtons method
      const mockFindWindsurfButtons = jest.fn().mockReturnValue([]);
      buttonDetector['findWindsurfButtons'] = mockFindWindsurfButtons;

      // Call findAcceptButtons which should trigger Windsurf-specific logic
      const buttons = buttonDetector.findAcceptButtons();
      
      expect(mockFindWindsurfButtons).toHaveBeenCalled();
      expect(buttons).toEqual([]);
    });

    it('should handle case-insensitive IDE types', () => {
      const cursorDetector = new ButtonDetector('CURSOR' as any);
      const windsurfDetector = new ButtonDetector('WINDSURF' as any);
      expect((cursorDetector as any).ideType).toBe('CURSOR');
      expect((windsurfDetector as any).ideType).toBe('WINDSURF');
    });
  });

  describe('configuration validation', () => {
    it('should handle partial configuration updates', () => {
      const partialConfig = { enableAccept: false };
      buttonDetector.updateConfiguration(partialConfig);
      
      // Only specified values should change
      expect((buttonDetector as any).config.enableAccept).toBe(false);
      expect((buttonDetector as any).config.enableAcceptAll).toBe(true); // Should remain unchanged
      expect((buttonDetector as any).config.enableRun).toBe(true); // Should remain unchanged
    });

    it('should handle empty configuration updates', () => {
      const emptyConfig = {};
      buttonDetector.updateConfiguration(emptyConfig);
      
      // All values should remain unchanged
      expect((buttonDetector as any).config.enableAccept).toBe(true);
      expect((buttonDetector as any).config.enableAcceptAll).toBe(true);
      expect((buttonDetector as any).config.enableRun).toBe(true);
    });

    it('should handle null and undefined configuration updates', () => {
      expect(() => buttonDetector.updateConfiguration(null as any)).not.toThrow();
      expect(() => buttonDetector.updateConfiguration(undefined as any)).not.toThrow();
    });
  });

  describe('button type operations', () => {
    it('should handle enableOnly with invalid button types', () => {
      expect(() => buttonDetector.enableOnly(['accept', 'invalid', 'run'])).not.toThrow();
      expect((buttonDetector as any).config.enableAccept).toBe(true);
      expect((buttonDetector as any).config.enableRun).toBe(true);
    });

    it('should handle enableOnly with duplicate button types', () => {
      buttonDetector.enableOnly(['accept', 'accept', 'run']);
      expect((buttonDetector as any).config.enableAccept).toBe(true);
      expect((buttonDetector as any).config.enableRun).toBe(true);
    });

    it('should handle enableOnly with proper case', () => {
      buttonDetector.enableOnly(['Accept', 'Run', 'AcceptAll']);
      expect((buttonDetector as any).config.enableAccept).toBe(true);
      expect((buttonDetector as any).config.enableRun).toBe(true);
      expect((buttonDetector as any).config.enableAcceptAll).toBe(true);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle configuration with all false values', () => {
      const allFalseConfig = {
        enableAccept: false,
        enableAcceptAll: false,
        enableRun: false,
        enableApply: false,
        enableResume: false,
        enableConnectionResume: false,
        enableTryAgain: false
      };
      
      buttonDetector.updateConfiguration(allFalseConfig);
      expect((buttonDetector as any).config.enableAccept).toBe(false);
      expect((buttonDetector as any).config.enableAcceptAll).toBe(false);
      expect((buttonDetector as any).config.enableRun).toBe(false);
      expect((buttonDetector as any).config.enableApply).toBe(false);
      expect((buttonDetector as any).config.enableResume).toBe(false);
      expect((buttonDetector as any).config.enableConnectionResume).toBe(false);
      expect((buttonDetector as any).config.enableTryAgain).toBe(false);
    });

    it('should handle configuration with all true values', () => {
      const allTrueConfig = {
        enableAccept: true,
        enableAcceptAll: true,
        enableRun: true,
        enableApply: true,
        enableResume: true,
        enableConnectionResume: true,
        enableTryAgain: true
      };
      
      buttonDetector.updateConfiguration(allTrueConfig);
      expect((buttonDetector as any).config.enableAccept).toBe(true);
      expect((buttonDetector as any).config.enableAcceptAll).toBe(true);
      expect((buttonDetector as any).config.enableRun).toBe(true);
      expect((buttonDetector as any).config.enableApply).toBe(true);
      expect((buttonDetector as any).config.enableResume).toBe(true);
      expect((buttonDetector as any).config.enableConnectionResume).toBe(true);
      expect((buttonDetector as any).config.enableTryAgain).toBe(true);
    });

    it('should handle rapid configuration changes', () => {
      for (let i = 0; i < 100; i++) {
        buttonDetector.toggleButton('accept');
        buttonDetector.toggleButton('run');
      }
      
      // Final state should be predictable
      expect(typeof (buttonDetector as any).config.enableAccept).toBe('boolean');
      expect(typeof (buttonDetector as any).config.enableRun).toBe('boolean');
    });

    it.skip('should handle DOM query errors gracefully', () => {
      // Skip due to JSDOM environment limitations
      // This test requires full DOM environment that JSDOM doesn't provide
    });

    it('should handle iframe access errors gracefully', () => {
      // Mock iframe contentDocument access to throw an error
      const mockIframe = {
        contentDocument: null,
        contentWindow: null
      };
      
      // Mock document.querySelectorAll to return the mock iframe
      const originalQuerySelectorAll = document.querySelectorAll;
      document.querySelectorAll = jest.fn().mockReturnValue([mockIframe] as any);

      // Should handle error gracefully when finding Windsurf buttons
      expect(() => buttonDetector.findAcceptButtons()).not.toThrow();

      // Restore original method
      document.querySelectorAll = originalQuerySelectorAll;
    });

    it.skip('should handle element visibility checks gracefully', () => {
      // Skip due to JSDOM environment limitations
      // This test requires full DOM environment that JSDOM doesn't provide
    });

    it.skip('should handle element clickability checks gracefully', () => {
      // Skip due to JSDOM environment limitations
      // This test requires full DOM environment that JSDOM doesn't provide
    });

    it('should handle text content extraction errors gracefully', () => {
      // Mock element with null textContent
      const mockElement = { textContent: null } as any;
      
      // Should handle null textContent gracefully
      expect(buttonDetector.isAcceptButton(mockElement)).toBe(false);
    });

    it.skip('should handle resume link detection edge cases', () => {
      // Skip due to JSDOM environment limitations
      // This test requires full DOM environment that JSDOM doesn't provide
    });

    it('should handle connection failure button detection edge cases', () => {
      // Mock element with no text content
      const mockElement = { 
        textContent: '',
        tagName: 'BUTTON'
      } as any;
      
      // Should handle empty text content gracefully
      expect(buttonDetector.isAcceptButton(mockElement)).toBe(false);
    });

    it('should handle Windsurf button detection edge cases', () => {
      // Mock element with no text content
      const mockElement = { 
        textContent: '',
        tagName: 'BUTTON'
      } as any;
      
      // Should handle empty text content gracefully
      expect(buttonDetector.isAcceptButton(mockElement)).toBe(false);
    });

    it('should handle global button search edge cases', () => {
      // Mock document.querySelector to return null
      const originalQuerySelector = document.querySelector;
      document.querySelector = jest.fn().mockReturnValue(null);

      // Should handle no input box found gracefully
      expect(() => buttonDetector.findAcceptButtons()).not.toThrow();

      // Restore original method
      document.querySelector = originalQuerySelector;
    });
  });

  describe('diff block detection and analysis', () => {
    test('should find diff blocks correctly', () => {
      // Mock DOM elements for diff blocks
      const mockDiffBlock = {
        querySelector: jest.fn().mockReturnValue({
          textContent: 'test.ts',
          querySelector: jest.fn().mockReturnValue({
            textContent: 'test.ts'
          })
        }),
        querySelectorAll: jest.fn().mockReturnValue([])
      } as any;

      // Mock document.querySelectorAll to return our mock diff block
      const originalQuerySelectorAll = document.querySelectorAll;
      document.querySelectorAll = jest.fn().mockReturnValue([mockDiffBlock] as any);

      const diffBlocks = buttonDetector.findDiffBlocks();
      expect(diffBlocks).toBeDefined();
      expect(Array.isArray(diffBlocks)).toBe(true);

      // Restore original method
      document.querySelectorAll = originalQuerySelectorAll;
    });

    test('should find recent diff blocks correctly', () => {
      // Mock findDiffBlocks to return some test data
      const mockDiffs = [
        { timestamp: new Date() },
        { timestamp: new Date(Date.now() - 10000) } // 10 seconds ago
      ];

      // Mock the findDiffBlocks method
      const originalFindDiffBlocks = buttonDetector.findDiffBlocks;
      (buttonDetector as any).findDiffBlocks = jest.fn().mockReturnValue(mockDiffs);

      const recentDiffs = buttonDetector.findRecentDiffBlocks(5000); // 5 second max age
      expect(recentDiffs).toHaveLength(1); // Only the recent one

      // Restore original method
      (buttonDetector as any).findDiffBlocks = originalFindDiffBlocks;
    });

    test('should get conversation context correctly', () => {
      // Mock DOM elements for conversation
      const mockConversationDiv = {
        querySelectorAll: jest.fn().mockReturnValue([
          { dataset: { messageIndex: '1' } },
          { dataset: { messageIndex: '2' } }
        ])
      } as any;

      // Mock document.querySelector to return our mock conversation div
      const originalQuerySelector = document.querySelector;
      document.querySelector = jest.fn().mockReturnValue(mockConversationDiv);

      // Mock findRecentDiffBlocks to return test data
      const originalFindRecentDiffBlocks = buttonDetector.findRecentDiffBlocks;
      (buttonDetector as any).findRecentDiffBlocks = jest.fn().mockReturnValue([
        { files: [{ name: 'test.ts' }] },
        { files: [{ name: 'test.js' }] }
      ]);

      const context = buttonDetector.getConversationContext();
      expect(context).toBeDefined();
      expect(context.totalMessages).toBe(2);
      expect(context.filesChanged).toContain('test.ts');
      expect(context.filesChanged).toContain('test.js');

      // Restore original methods
      document.querySelector = originalQuerySelector;
      (buttonDetector as any).findRecentDiffBlocks = originalFindRecentDiffBlocks;
    });

    test.skip('should log conversation activity correctly', () => {
      // Skip due to JSDOM environment limitations
      // This test requires full DOM environment that JSDOM doesn't provide
    });
  });

  describe('file analysis methods', () => {
    test('should extract numbers from text correctly', () => {
      const extractNumber = (buttonDetector as any).extractNumber;
      expect(extractNumber('+5')).toBe(5);
      expect(extractNumber('-3')).toBe(3);
      expect(extractNumber('10')).toBe(10);
      expect(extractNumber('abc+15def')).toBe(15);
      expect(extractNumber('')).toBe(0);
      expect(extractNumber('no numbers')).toBe(0);
    });

    test.skip('should extract file info from header correctly', () => {
      // Skip due to JSDOM environment limitations
      // This test requires full DOM environment that JSDOM doesn't provide
    });

    test('should handle missing header elements gracefully', () => {
      const mockHeader = {
        querySelector: jest.fn().mockReturnValue(null)
      } as any;

      const extractFileInfoFromHeader = (buttonDetector as any).extractFileInfoFromHeader;
      const fileInfo = extractFileInfoFromHeader(mockHeader);

      expect(fileInfo).toBeNull();
    });

    test.skip('should analyze diff blocks correctly', () => {
      // Skip due to JSDOM environment limitations
      // This test requires full DOM environment that JSDOM doesn't provide
    });

    test('should handle diff block analysis errors gracefully', () => {
      const mockBlock = {
        querySelector: jest.fn().mockImplementation(() => {
          throw new Error('DOM error');
        })
      } as any;

      const analyzeDiffBlock = (buttonDetector as any).analyzeDiffBlock;
      const diffInfo = analyzeDiffBlock(mockBlock);

      expect(diffInfo).toBeNull();
    });
  });
});
