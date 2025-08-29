// Mock VS Code API for testing
export const window = {
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
  registerWebviewViewProvider: jest.fn(),
  activeTextEditor: null
};

export const workspace = {
  getConfiguration: jest.fn(() => ({
    get: jest.fn((key: string, defaultValue: any) => defaultValue),
    update: jest.fn(),
    has: jest.fn(),
    inspect: jest.fn()
  })),
  onDidChangeConfiguration: jest.fn()
};

export const StatusBarAlignment = {
  Left: 1,
  Right: 2
};

export const ThemeColor = jest.fn();

export const Uri = {
  file: jest.fn((path: string) => ({ fsPath: path }))
};

export const commands = {
  registerCommand: jest.fn(),
  executeCommand: jest.fn()
};

export class ExtensionContext {
  globalState: any;
  subscriptions: any[];

  constructor() {
    this.globalState = {
      get: jest.fn(),
      update: jest.fn(),
      keys: jest.fn()
    };
    this.subscriptions = [];
  }
}

export class EventEmitter {
  on: jest.Mock;
  emit: jest.Mock;
  dispose: jest.Mock;

  constructor() {
    this.on = jest.fn();
    this.emit = jest.fn();
    this.dispose = jest.fn();
  }
}

export default {
  window,
  workspace,
  StatusBarAlignment,
  ThemeColor,
  Uri,
  commands,
  ExtensionContext,
  EventEmitter
};
