import { jest } from '@jest/globals';

// Ensure Jest matchers are properly initialized
expect.extend({
  // Add any custom matchers if needed
});

// Mock VS Code API
const mockVscode = {
    window: {
        createStatusBarItem: jest.fn(() => ({
            text: '',
            tooltip: '',
            command: '',
            show: jest.fn(),
            hide: jest.fn(),
            dispose: jest.fn()
        })),
        showInformationMessage: jest.fn(),
        showErrorMessage: jest.fn(),
        showWarningMessage: jest.fn(),
        registerWebviewViewProvider: jest.fn()
    },
    workspace: {
        getConfiguration: jest.fn(() => ({
            get: jest.fn((key: string, defaultValue: any) => defaultValue)
        }))
    },
    StatusBarAlignment: {
        Left: 1,
        Right: 2
    },
    ThemeColor: jest.fn(),
    Uri: {
        file: jest.fn((path: string) => ({ fsPath: path }))
    },
    commands: {
        registerCommand: jest.fn(),
        executeCommand: jest.fn()
    },
    ExtensionContext: jest.fn(),
    EventEmitter: jest.fn(() => ({
        on: jest.fn(),
        emit: jest.fn(),
        dispose: jest.fn()
    }))
};

// Set up global mocks
(global as any).vscode = mockVscode;



// Mock console
(global as any).console = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
};

// Mock localStorage
(global as any).localStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn()
};

// Mock fetch
(global as any).fetch = jest.fn();

// Mock performance
(global as any).performance = {
    now: jest.fn(() => Date.now())
};

// Mock process
(global as any).process = {
    env: {},
    platform: 'linux',
    arch: 'x64'
};

// Mock globalThis
(global as any).globalThis = global;

// Setup and teardown
beforeEach(() => {
    jest.clearAllMocks();
});

afterEach(() => {
    jest.restoreAllMocks();
});

// Export for use in tests
export { mockVscode };
