#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class ExtensionAutomation {
    constructor() {
        this.projectRoot = process.cwd();
        this.scriptsDir = path.join(this.projectRoot, 'scripts');
        this.outDir = path.join(this.projectRoot, 'out');
        this.nodeModulesDir = path.join(this.projectRoot, 'node_modules');
        this.packageJsonPath = path.join(this.projectRoot, 'package.json');
        this.extensionPath = path.join(this.projectRoot, 'out', 'extension.js');
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    async runCommand(command, options = {}) {
        try {
            this.log(`Running: ${command}`);
            const result = execSync(command, {
                cwd: this.projectRoot,
                stdio: options.silent ? 'pipe' : 'inherit',
                encoding: 'utf8',
                ...options
            });
            if (options.silent) {
                this.log(`Command completed successfully`);
            }
            return result;
        } catch (error) {
            this.log(`Command failed: ${command}`, 'error');
            this.log(`Error: ${error.message}`, 'error');
            if (!options.continueOnError) {
                throw error;
            }
        }
    }

    async checkPrerequisites() {
        this.log('Checking prerequisites...');
        
        // Check Node.js version
        try {
            const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
            const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
            if (majorVersion < 16) {
                throw new Error(`Node.js 16+ required, found ${nodeVersion}`);
            }
            this.log(`Node.js version: ${nodeVersion}`, 'success');
        } catch (error) {
            this.log(`Node.js check failed: ${error.message}`, 'error');
            return false;
        }

        // Check npm
        try {
            const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
            this.log(`npm version: ${npmVersion}`, 'success');
        } catch (error) {
            this.log(`npm check failed: ${error.message}`, 'error');
            return false;
        }

        // Check Cursor IDE (if available)
        try {
            const cursorPath = this.findCursorPath();
            if (cursorPath) {
                this.log(`Cursor IDE found at: ${cursorPath}`, 'success');
            } else {
                this.log('Cursor IDE not found in common locations', 'warning');
            }
        } catch (error) {
            this.log(`Cursor IDE check failed: ${error.message}`, 'warning');
        }

        return true;
    }

    findCursorPath() {
        const possiblePaths = [
            // Windows
            path.join(process.env.APPDATA || '', 'Cursor', 'Cursor.exe'),
            path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Cursor', 'Cursor.exe'),
            
            // macOS
            '/Applications/Cursor.app/Contents/MacOS/Cursor',
            
            // Linux
            '/usr/bin/cursor',
            '/usr/local/bin/cursor',
            path.join(process.env.HOME || '', '.local', 'bin', 'cursor')
        ];

        for (const cursorPath of possiblePaths) {
            if (fs.existsSync(cursorPath)) {
                return cursorPath;
            }
        }
        return null;
    }

    async installDependencies() {
        this.log('Installing dependencies...');
        
        if (fs.existsSync(this.nodeModulesDir)) {
            this.log('node_modules already exists, skipping installation');
            return true;
        }

        try {
            await this.runCommand('npm install');
            this.log('Dependencies installed successfully', 'success');
            return true;
        } catch (error) {
            this.log('Failed to install dependencies', 'error');
            return false;
        }
    }

    async buildExtension() {
        this.log('Building extension...');
        
        try {
            // Clean output directory
            if (fs.existsSync(this.outDir)) {
                fs.rmSync(this.outDir, { recursive: true, force: true });
            }

            // Compile TypeScript
            await this.runCommand('npm run compile');
            
            // Verify build output
            if (fs.existsSync(this.extensionPath)) {
                this.log('Extension built successfully', 'success');
                return true;
            } else {
                throw new Error('Extension file not found after build');
            }
        } catch (error) {
            this.log('Build failed', 'error');
            return false;
        }
    }

    async runTests() {
        this.log('Running tests...');
        
        try {
            // Run linting
            this.log('Running ESLint...');
            await this.runCommand('npm run lint', { silent: true });
            this.log('Linting passed', 'success');

            // Run tests if available
            if (fs.existsSync(path.join(this.projectRoot, 'test'))) {
                this.log('Running tests...');
                await this.runCommand('npm run test', { silent: true });
                this.log('Tests passed', 'success');
            } else {
                this.log('No test directory found, skipping tests', 'warning');
            }

            return true;
        } catch (error) {
            this.log('Tests failed', 'error');
            return false;
        }
    }

    async validateExtension() {
        this.log('Validating extension...');
        
        try {
            // Check package.json
            if (!fs.existsSync(this.packageJsonPath)) {
                throw new Error('package.json not found');
            }

            const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
            
            // Validate required fields
            const requiredFields = ['name', 'displayName', 'description', 'version', 'main', 'engines'];
            for (const field of requiredFields) {
                if (!packageJson[field]) {
                    throw new Error(`Missing required field: ${field}`);
                }
            }

            // Check main entry point
            if (!fs.existsSync(path.join(this.projectRoot, packageJson.main))) {
                throw new Error(`Main entry point not found: ${packageJson.main}`);
            }

            // Check activation events
            if (!packageJson.activationEvents || packageJson.activationEvents.length === 0) {
                this.log('No activation events defined', 'warning');
            }

            // Check commands
            if (!packageJson.contributes || !packageJson.contributes.commands) {
                this.log('No commands defined', 'warning');
            }

            this.log('Extension validation passed', 'success');
            return true;
        } catch (error) {
            this.log(`Extension validation failed: ${error.message}`, 'error');
            return false;
        }
    }

    async createVSIX() {
        this.log('Creating VSIX package...');
        
        try {
            // Check if vsce is available
            try {
                execSync('vsce --version', { stdio: 'pipe' });
            } catch (error) {
                this.log('Installing vsce globally...');
                await this.runCommand('npm install -g vsce');
            }

            // Create VSIX package
            await this.runCommand('vsce package');
            
            // Check for VSIX file
            const vsixFiles = fs.readdirSync(this.projectRoot).filter(file => file.endsWith('.vsix'));
            if (vsixFiles.length > 0) {
                this.log(`VSIX package created: ${vsixFiles[0]}`, 'success');
                return vsixFiles[0];
            } else {
                throw new Error('VSIX file not found after packaging');
            }
        } catch (error) {
            this.log(`VSIX creation failed: ${error.message}`, 'error');
            return null;
        }
    }

    async installExtension(vsixPath) {
        this.log('Installing extension...');
        
        try {
            const cursorPath = this.findCursorPath();
            if (!cursorPath) {
                this.log('Cursor IDE not found, cannot install extension automatically', 'warning');
                this.log('Please install manually using the VSIX file', 'info');
                return false;
            }

            // For now, just provide instructions
            this.log('To install the extension:', 'info');
            this.log('1. Open Cursor IDE', 'info');
            this.log('2. Press Ctrl+Shift+P (or Cmd+Shift+P on macOS)', 'info');
            this.log('3. Type "Extensions: Install from VSIX"', 'info');
            this.log('4. Select the VSIX file: ' + vsixPath, 'info');
            
            return true;
        } catch (error) {
            this.log(`Extension installation failed: ${error.message}`, 'error');
            return false;
        }
    }

    async runAutomatedTests() {
        this.log('Running automated tests...');
        
        try {
            // Test file structure
            const requiredFiles = [
                'package.json',
                'tsconfig.json',
                'src/extension.ts',
                'src/autoAccept.ts',
                'src/buttonDetector.ts',
                'src/analytics.ts',
                'src/storage.ts',
                'src/controlPanel.ts',
                'README.md',
                'LICENSE'
            ];

            for (const file of requiredFiles) {
                const filePath = path.join(this.projectRoot, file);
                if (!fs.existsSync(filePath)) {
                    throw new Error(`Required file missing: ${file}`);
                }
            }
            this.log('File structure validation passed', 'success');

            // Test TypeScript compilation
            this.log('Testing TypeScript compilation...');
            await this.runCommand('npx tsc --noEmit', { silent: true });
            this.log('TypeScript compilation test passed', 'success');

            // Test package.json syntax
            this.log('Testing package.json syntax...');
            JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
            this.log('package.json syntax test passed', 'success');

            return true;
        } catch (error) {
            this.log(`Automated tests failed: ${error.message}`, 'error');
            return false;
        }
    }

    async generateReport() {
        this.log('Generating automation report...');
        
        const report = {
            timestamp: new Date().toISOString(),
            project: path.basename(this.projectRoot),
            results: {
                prerequisites: false,
                dependencies: false,
                build: false,
                tests: false,
                validation: false,
                vsix: false,
                automatedTests: false
            },
            summary: '',
            nextSteps: []
        };

        // Run all checks
        try {
            report.results.prerequisites = await this.checkPrerequisites();
            if (report.results.prerequisites) {
                report.results.dependencies = await this.installDependencies();
                if (report.results.dependencies) {
                    report.results.build = await this.buildExtension();
                    if (report.results.build) {
                        report.results.tests = await this.runTests();
                        report.results.validation = await this.validateExtension();
                        report.results.automatedTests = await this.runAutomatedTests();
                        
                        if (report.results.validation) {
                            const vsixPath = await this.createVSIX();
                            report.results.vsix = !!vsixPath;
                        }
                    }
                }
            }
        } catch (error) {
            this.log(`Automation failed: ${error.message}`, 'error');
        }

        // Generate summary
        const passed = Object.values(report.results).filter(Boolean).length;
        const total = Object.keys(report.results).length;
        report.summary = `${passed}/${total} checks passed`;

        // Generate next steps
        if (!report.results.prerequisites) {
            report.nextSteps.push('Install Node.js 16+ and npm');
        }
        if (!report.results.dependencies) {
            report.nextSteps.push('Fix dependency installation issues');
        }
        if (!report.results.build) {
            report.nextSteps.push('Fix TypeScript compilation errors');
        }
        if (!report.results.validation) {
            report.nextSteps.push('Fix extension configuration issues');
        }
        if (!report.results.vsix) {
            report.nextSteps.push('Fix VSIX packaging issues');
        }
        if (report.results.vsix && !report.results.install) {
            report.nextSteps.push('Install extension in Cursor IDE');
        }

        // Save report
        const reportPath = path.join(this.projectRoot, 'automation-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        this.log(`Report saved to: ${reportPath}`, 'success');
        this.log(`Summary: ${report.summary}`, 'info');
        
        if (report.nextSteps.length > 0) {
            this.log('Next steps:', 'info');
            report.nextSteps.forEach((step, index) => {
                this.log(`  ${index + 1}. ${step}`, 'info');
            });
        }

        return report;
    }

    async runFullAutomation() {
        this.log('🚀 Starting Cursor Auto Accept Extension Automation');
        this.log('==================================================');
        
        try {
            const report = await this.generateReport();
            
            if (Object.values(report.results).every(Boolean)) {
                this.log('🎉 All automation steps completed successfully!', 'success');
                this.log('Your extension is ready to use in Cursor IDE', 'success');
            } else {
                this.log('⚠️ Some automation steps failed', 'warning');
                this.log('Check the report and next steps above', 'info');
            }
            
            return report;
        } catch (error) {
            this.log(`Automation failed: ${error.message}`, 'error');
            throw error;
        }
    }
}

// CLI interface
if (require.main === module) {
    const automation = new ExtensionAutomation();
    
    const command = process.argv[2] || 'full';
    
    switch (command) {
        case 'check':
            automation.checkPrerequisites();
            break;
        case 'install':
            automation.installDependencies();
            break;
        case 'build':
            automation.buildExtension();
            break;
        case 'test':
            automation.runTests();
            break;
        case 'validate':
            automation.validateExtension();
            break;
        case 'package':
            automation.createVSIX();
            break;
        case 'full':
        default:
            automation.runFullAutomation();
            break;
    }
}

module.exports = ExtensionAutomation;
