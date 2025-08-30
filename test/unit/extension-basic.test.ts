// Basic extension test that only tests file structure and metadata
import * as fs from 'fs';
import * as path from 'path';

describe('Extension Basic', () => {
  describe('file structure', () => {
    it('should have required source files', () => {
      const srcDir = path.join(__dirname, '../../src');
      expect(fs.existsSync(srcDir)).toBe(true);
      
      const extensionFile = path.join(srcDir, 'extension.ts');
      expect(fs.existsSync(extensionFile)).toBe(true);
      
      const autoAcceptFile = path.join(srcDir, 'autoAccept.ts');
      expect(fs.existsSync(autoAcceptFile)).toBe(true);
      
      const analyticsFile = path.join(srcDir, 'analytics.ts');
      expect(fs.existsSync(analyticsFile)).toBe(true);
      
      const storageFile = path.join(srcDir, 'storage.ts');
      expect(fs.existsSync(storageFile)).toBe(true);
      
      const controlPanelFile = path.join(srcDir, 'controlPanel.ts');
      expect(fs.existsSync(controlPanelFile)).toBe(true);
      
      const buttonDetectorFile = path.join(srcDir, 'buttonDetector.ts');
      expect(fs.existsSync(buttonDetectorFile)).toBe(true);
    });

    it('should have compiled output files', () => {
      const outDir = path.join(__dirname, '../../out');
      expect(fs.existsSync(outDir)).toBe(true);
      
      const extensionJs = path.join(outDir, 'extension.js');
      expect(fs.existsSync(extensionJs)).toBe(true);
      
      const autoAcceptJs = path.join(outDir, 'autoAccept.js');
      expect(fs.existsSync(autoAcceptJs)).toBe(true);
      
      const analyticsJs = path.join(outDir, 'analytics.js');
      expect(fs.existsSync(analyticsJs)).toBe(true);
      
      const storageJs = path.join(outDir, 'storage.js');
      expect(fs.existsSync(storageJs)).toBe(true);
      
      const controlPanelJs = path.join(outDir, 'controlPanel.js');
      expect(fs.existsSync(controlPanelJs)).toBe(true);
      
      const buttonDetectorJs = path.join(outDir, 'buttonDetector.js');
      expect(fs.existsSync(buttonDetectorJs)).toBe(true);
    });
  });

  describe('package.json metadata', () => {
    let packageJson: any;

    beforeAll(() => {
      const packagePath = path.join(__dirname, '../../package.json');
      const packageContent = fs.readFileSync(packagePath, 'utf8');
      packageJson = JSON.parse(packageContent);
    });

    it('should have correct basic metadata', () => {
      expect(packageJson.name).toBe('cursor-ai-workflow-automation');
      expect(packageJson.displayName).toBe('Cursor AI Workflow Automation');
      expect(packageJson.description).toContain('Intelligent AI workflow automation');
      expect(packageJson.version).toBeDefined();
      expect(packageJson.main).toBe('./out/extension.js');
    });

    it('should have correct author information', () => {
      expect(packageJson.author).toBeDefined();
      expect(packageJson.author.name).toBe('0xb007ab1e');
      expect(packageJson.author.email).toBe('0+b007ab1e@users.noreply.github.com');
      expect(packageJson.author.url).toBe('https://github.com/0xb007ab1e');
      
      expect(packageJson.originalAuthor).toBeDefined();
      expect(packageJson.originalAuthor.name).toBe('Valsaraj R (@ivalsaraj)');
      expect(packageJson.originalAuthor.email).toBe('ivan@ivalsaraj.com');
      expect(packageJson.originalAuthor.url).toBe('https://linkedin.com/in/ivalsaraj');
    });

    it('should have correct repository information', () => {
      expect(packageJson.repository).toBeDefined();
      expect(packageJson.repository.url).toBe('https://github.com/0xb007ab1e/cursor-ai-workflow-automation.git');
      
      expect(packageJson.bugs).toBeDefined();
      expect(packageJson.bugs.url).toBe('https://github.com/0xb007ab1e/cursor-ai-workflow-automation/issues');
      
      expect(packageJson.homepage).toBeDefined();
      expect(packageJson.homepage).toBe('https://github.com/0xb007ab1e/cursor-ai-workflow-automation#readme');
    });

    it('should have required VS Code extension properties', () => {
      expect(packageJson.publisher).toBeDefined();
      expect(packageJson.engines).toBeDefined();
      expect(packageJson.engines.vscode).toBeDefined();
      expect(packageJson.activationEvents).toBeDefined();
      expect(packageJson.contributes).toBeDefined();
    });

    it('should have all required commands', () => {
      const commands = packageJson.contributes.commands;
      expect(commands).toBeDefined();
      expect(commands.length).toBeGreaterThan(0);
      
      const commandNames = commands.map((cmd: any) => cmd.command);
      expect(commandNames).toContain('cursor-auto-accept.start');
      expect(commandNames).toContain('cursor-auto-accept.stop');
      expect(commandNames).toContain('cursor-auto-accept.showPanel');
      expect(commandNames).toContain('cursor-auto-accept.exportAnalytics');
      expect(commandNames).toContain('cursor-auto-accept.clearData');
      expect(commandNames).toContain('cursor-auto-accept.toggleDebug');
      expect(commandNames).toContain('cursor-auto-accept.calibrateWorkflow');
    });

    it('should have proper configuration', () => {
      const configuration = packageJson.contributes.configuration;
      expect(configuration).toBeDefined();
      expect(configuration.title).toBe('Cursor Auto Accept');
      
      const properties = configuration.properties;
      expect(properties).toBeDefined();
      expect(properties['cursorAutoAccept.enabled']).toBeDefined();
      expect(properties['cursorAutoAccept.interval']).toBeDefined();
      expect(properties['cursorAutoAccept.enableAcceptAll']).toBeDefined();
      expect(properties['cursorAutoAccept.enableAccept']).toBeDefined();
      expect(properties['cursorAutoAccept.enableRun']).toBeDefined();
      expect(properties['cursorAutoAccept.enableApply']).toBeDefined();
    });
  });

  describe('compiled output validation', () => {
    it('should have valid JavaScript syntax in compiled files', () => {
      const outDir = path.join(__dirname, '../../out');
      const extensionJs = path.join(outDir, 'extension.js');
      
      const content = fs.readFileSync(extensionJs, 'utf8');
      expect(content).toContain('exports.activate');
      expect(content).toContain('exports.deactivate');
      expect(content).toContain('cursorAutoAccept');
    });

    it('should have proper file sizes', () => {
      const outDir = path.join(__dirname, '../../out');
      const extensionJs = path.join(outDir, 'extension.js');
      
      const stats = fs.statSync(extensionJs);
      expect(stats.size).toBeGreaterThan(0);
      expect(stats.isFile()).toBe(true);
    });
  });
});

