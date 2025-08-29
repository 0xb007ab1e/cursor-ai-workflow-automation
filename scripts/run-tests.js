#!/usr/bin/env node

/**
 * Comprehensive Test Runner for Cursor Auto Accept Extension
 * 
 * This script runs all test suites with full coverage reporting
 * and generates detailed test reports.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
    constructor() {
        this.projectRoot = process.cwd();
        this.testResults = {
            unit: { passed: 0, failed: 0, total: 0, duration: 0 },
            integration: { passed: 0, failed: 0, total: 0, duration: 0 },
            e2e: { passed: 0, failed: 0, total: 0, duration: 0 },
            coverage: { statements: 0, branches: 0, functions: 0, lines: 0 }
        };
        this.startTime = Date.now();
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    async runCommand(command, description, options = {}) {
        try {
            this.log(`Running: ${description}`);
            const startTime = Date.now();
            
            const result = execSync(command, {
                cwd: this.projectRoot,
                stdio: options.silent ? 'pipe' : 'inherit',
                encoding: 'utf8',
                ...options
            });
            
            const duration = Date.now() - startTime;
            this.log(`${description} completed in ${duration}ms`, 'success');
            
            return { success: true, duration, output: result };
        } catch (error) {
            this.log(`${description} failed: ${error.message}`, 'error');
            return { success: false, duration: 0, output: error.message };
        }
    }

    async checkPrerequisites() {
        this.log('Checking test prerequisites...');
        
        // Check if tests directory exists
        if (!fs.existsSync(path.join(this.projectRoot, 'test'))) {
            this.log('Test directory not found. Creating test structure...', 'warning');
            this.createTestStructure();
        }

        // Check if Jest is installed
        try {
            execSync('npx jest --version', { stdio: 'pipe' });
            this.log('Jest is available', 'success');
        } catch (error) {
            this.log('Installing Jest and test dependencies...', 'info');
            await this.runCommand('npm install --save-dev jest @types/jest ts-jest jest-environment-jsdom jest-extended', 'Installing Jest');
        }

        // Check if TypeScript is compiled
        if (!fs.existsSync(path.join(this.projectRoot, 'out'))) {
            this.log('TypeScript not compiled. Building project...', 'info');
            await this.runCommand('npm run compile', 'Building TypeScript');
        }

        return true;
    }

    createTestStructure() {
        const testDirs = ['unit', 'integration', 'e2e'];
        testDirs.forEach(dir => {
            const testPath = path.join(this.projectRoot, 'test', dir);
            if (!fs.existsSync(testPath)) {
                fs.mkdirSync(testPath, { recursive: true });
                this.log(`Created test directory: ${dir}`, 'success');
            }
        });
    }

    async runUnitTests() {
        this.log('Running unit tests...');
        
        const result = await this.runCommand(
            'npm run test:unit',
            'Unit tests',
            { silent: true }
        );

        if (result.success) {
            this.testResults.unit.passed = this.extractTestCount(result.output, 'passed');
            this.testResults.unit.failed = this.extractTestCount(result.output, 'failed');
            this.testResults.unit.total = this.testResults.unit.passed + this.testResults.unit.failed;
            this.testResults.unit.duration = result.duration;
            
            this.log(`Unit tests: ${this.testResults.unit.passed}/${this.testResults.unit.total} passed`, 'success');
        } else {
            this.testResults.unit.failed = 1;
            this.testResults.unit.total = 1;
        }

        return result.success;
    }

    async runIntegrationTests() {
        this.log('Running integration tests...');
        
        const result = await this.runCommand(
            'npm run test:integration',
            'Integration tests',
            { silent: true }
        );

        if (result.success) {
            this.testResults.integration.passed = this.extractTestCount(result.output, 'passed');
            this.testResults.integration.failed = this.extractTestCount(result.output, 'failed');
            this.testResults.integration.total = this.testResults.integration.passed + this.testResults.integration.failed;
            this.testResults.integration.duration = result.duration;
            
            this.log(`Integration tests: ${this.testResults.integration.passed}/${this.testResults.integration.total} passed`, 'success');
        } else {
            this.testResults.integration.failed = 1;
            this.testResults.integration.total = 1;
        }

        return result.success;
    }

    async runE2ETests() {
        this.log('Running end-to-end tests...');
        
        const result = await this.runCommand(
            'npm run test:e2e',
            'E2E tests',
            { silent: true }
        );

        if (result.success) {
            this.testResults.e2e.passed = this.extractTestCount(result.output, 'passed');
            this.testResults.e2e.failed = this.extractTestCount(result.output, 'failed');
            this.testResults.e2e.total = this.testResults.e2e.passed + this.testResults.e2e.failed;
            this.testResults.e2e.duration = result.duration;
            
            this.log(`E2E tests: ${this.testResults.e2e.passed}/${this.testResults.e2e.total} passed`, 'success');
        } else {
            this.testResults.e2e.failed = 1;
            this.testResults.e2e.total = 1;
        }

        return result.success;
    }

    async runCoverageTests() {
        this.log('Running coverage tests...');
        
        const result = await this.runCommand(
            'npm run test:coverage',
            'Coverage tests',
            { silent: true }
        );

        if (result.success) {
            this.testResults.coverage = this.extractCoverageData(result.output);
            this.log(`Coverage: ${this.testResults.coverage.statements}% statements, ${this.testResults.coverage.branches}% branches, ${this.testResults.coverage.functions}% functions, ${this.testResults.coverage.lines}% lines`, 'success');
        }

        return result.success;
    }

    extractTestCount(output, type) {
        const regex = new RegExp(`(\\d+) tests? ${type}`, 'i');
        const match = output.match(regex);
        return match ? parseInt(match[1]) : 0;
    }

    extractCoverageData(output) {
        const coverage = {
            statements: 0,
            branches: 0,
            functions: 0,
            lines: 0
        };

        // Extract coverage percentages
        const statementsMatch = output.match(/Statements\s*:\s*(\d+(?:\.\d+)?)%/);
        const branchesMatch = output.match(/Branches\s*:\s*(\d+(?:\.\d+)?)%/);
        const functionsMatch = output.match(/Functions\s*:\s*(\d+(?:\.\d+)?)%/);
        const linesMatch = output.match(/Lines\s*:\s*(\d+(?:\.\d+)?)%/);

        if (statementsMatch) coverage.statements = parseFloat(statementsMatch[1]);
        if (branchesMatch) coverage.branches = parseFloat(branchesMatch[1]);
        if (functionsMatch) coverage.functions = parseFloat(functionsMatch[1]);
        if (linesMatch) coverage.lines = parseFloat(linesMatch[1]);

        return coverage;
    }

    async runAllTests() {
        this.log('🧪 Starting comprehensive test suite...');
        this.log('==================================================');

        // Check prerequisites
        await this.checkPrerequisites();

        // Run all test suites
        const unitSuccess = await this.runUnitTests();
        const integrationSuccess = await this.runIntegrationTests();
        const e2eSuccess = await this.runE2ETests();
        const coverageSuccess = await this.runCoverageTests();

        // Calculate overall results
        const totalTests = this.testResults.unit.total + this.testResults.integration.total + this.testResults.e2e.total;
        const totalPassed = this.testResults.unit.passed + this.testResults.integration.passed + this.testResults.e2e.passed;
        const totalFailed = this.testResults.unit.failed + this.testResults.integration.failed + this.testResults.e2e.failed;

        // Generate test report
        this.generateTestReport({
            unitSuccess,
            integrationSuccess,
            e2eSuccess,
            coverageSuccess,
            totalTests,
            totalPassed,
            totalFailed
        });

        // Check coverage thresholds
        this.checkCoverageThresholds();

        // Summary
        const totalDuration = Date.now() - this.startTime;
        this.log(`==================================================`);
        this.log(`🎯 Test Summary:`);
        this.log(`   Total Tests: ${totalTests}`);
        this.log(`   Passed: ${totalPassed}`);
        this.log(`   Failed: ${totalFailed}`);
        this.log(`   Coverage: ${this.testResults.coverage.lines}%`);
        this.log(`   Duration: ${totalDuration}ms`);
        this.log(`==================================================`);

        if (totalFailed > 0) {
            this.log('⚠️  Some tests failed. Check the report above for details.', 'warning');
            process.exit(1);
        } else {
            this.log('🎉 All tests passed successfully!', 'success');
        }
    }

    generateTestReport(results) {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalTests: results.totalTests,
                totalPassed: results.totalPassed,
                totalFailed: results.totalFailed,
                success: results.totalFailed === 0
            },
            testSuites: {
                unit: this.testResults.unit,
                integration: this.testResults.integration,
                e2e: this.testResults.e2e
            },
            coverage: this.testResults.coverage,
            results: {
                unit: results.unitSuccess,
                integration: results.integrationSuccess,
                e2e: results.e2eSuccess,
                coverage: results.coverageSuccess
            }
        };

        // Save detailed report
        const reportPath = path.join(this.projectRoot, 'test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        this.log(`Detailed test report saved to: ${reportPath}`, 'success');

        // Generate HTML coverage report if available
        const coveragePath = path.join(this.projectRoot, 'coverage', 'lcov-report', 'index.html');
        if (fs.existsSync(coveragePath)) {
            this.log(`Coverage report available at: ${coveragePath}`, 'info');
        }
    }

    checkCoverageThresholds() {
        const thresholds = {
            statements: 100,
            branches: 100,
            functions: 100,
            lines: 100
        };

        const coverage = this.testResults.coverage;
        let allThresholdsMet = true;

        Object.entries(thresholds).forEach(([metric, threshold]) => {
            const actual = coverage[metric];
            if (actual < threshold) {
                this.log(`Coverage threshold not met: ${metric} ${actual}% < ${threshold}%`, 'error');
                allThresholdsMet = false;
            }
        });

        if (allThresholdsMet) {
            this.log('🎯 All coverage thresholds met!', 'success');
        } else {
            this.log('⚠️  Coverage thresholds not met. Consider adding more tests.', 'warning');
        }
    }

    async runSpecificTests(testType) {
        this.log(`Running ${testType} tests...`);
        
        switch (testType.toLowerCase()) {
            case 'unit':
                return await this.runUnitTests();
            case 'integration':
                return await this.runIntegrationTests();
            case 'e2e':
                return await this.runE2ETests();
            case 'coverage':
                return await this.runCoverageTests();
            default:
                this.log(`Unknown test type: ${testType}`, 'error');
                return false;
        }
    }

    async runPerformanceTests() {
        this.log('Running performance tests...');
        
        // Run tests multiple times to measure performance
        const iterations = 5;
        const durations = [];

        for (let i = 0; i < iterations; i++) {
            this.log(`Performance test iteration ${i + 1}/${iterations}...`);
            
            const startTime = Date.now();
            await this.runCommand('npm run test:unit', 'Performance test iteration', { silent: true });
            const duration = Date.now() - startTime;
            durations.push(duration);
        }

        const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
        const maxDuration = Math.max(...durations);
        const minDuration = Math.min(...durations);

        this.log(`Performance Results:`, 'info');
        this.log(`  Average: ${avgDuration.toFixed(2)}ms`, 'info');
        this.log(`  Maximum: ${maxDuration}ms`, 'info');
        this.log(`  Minimum: ${minDuration}ms`, 'info');

        // Performance should be consistent
        const variance = durations.reduce((acc, val) => acc + Math.pow(val - avgDuration, 2), 0) / durations.length;
        const standardDeviation = Math.sqrt(variance);
        const coefficientOfVariation = (standardDeviation / avgDuration) * 100;

        this.log(`  Standard Deviation: ${standardDeviation.toFixed(2)}ms`, 'info');
        this.log(`  Coefficient of Variation: ${coefficientOfVariation.toFixed(2)}%`, 'info');

        if (coefficientOfVariation < 20) {
            this.log('✅ Performance is consistent', 'success');
        } else {
            this.log('⚠️  Performance shows high variability', 'warning');
        }

        return true;
    }
}

// CLI interface
if (require.main === module) {
    const runner = new TestRunner();
    
    const command = process.argv[2] || 'all';
    
    switch (command) {
        case 'unit':
            runner.runSpecificTests('unit');
            break;
        case 'integration':
            runner.runSpecificTests('integration');
            break;
        case 'e2e':
            runner.runSpecificTests('e2e');
            break;
        case 'coverage':
            runner.runSpecificTests('coverage');
            break;
        case 'performance':
            runner.runPerformanceTests();
            break;
        case 'all':
        default:
            runner.runAllTests();
            break;
    }
}

module.exports = TestRunner;
