# 🧪 Comprehensive Testing Guide

## **Overview**

This document provides comprehensive testing instructions for the Cursor Auto Accept Extension, ensuring **100% code coverage** across all test suites.

## **Test Structure**

```
test/
├── setup.ts                 # Global test configuration and mocks
├── unit/                    # Unit tests for individual classes
│   ├── storage.test.ts     # StorageManager tests
│   ├── analytics.test.ts   # AnalyticsManager tests
│   └── buttonDetector.test.ts # ButtonDetector tests
├── integration/             # Integration tests for component interaction
│   └── autoAccept.test.ts  # AutoAcceptManager integration tests
└── e2e/                    # End-to-end tests for full extension
    └── extension.test.ts   # Complete extension workflow tests
```

## **Test Suites**

### **1. Unit Tests**
- **Purpose**: Test individual classes and methods in isolation
- **Coverage**: 100% of class methods, properties, and edge cases
- **Mocking**: Full VS Code API and DOM mocking
- **Files**: `test/unit/*.test.ts`

### **2. Integration Tests**
- **Purpose**: Test component interactions and data flow
- **Coverage**: Component communication, state management, error handling
- **Mocking**: Partial mocking with real component interaction
- **Files**: `test/integration/*.test.ts`

### **3. End-to-End Tests**
- **Purpose**: Test complete extension workflows
- **Coverage**: Full extension lifecycle, user interactions, real-world scenarios
- **Mocking**: Minimal mocking, realistic test scenarios
- **Files**: `test/e2e/*.test.ts`

## **Running Tests**

### **Quick Start**
```bash
# Run all tests with coverage
npm run test:runner:all

# Run specific test suite
npm run test:runner:unit
npm run test:runner:integration
npm run test:runner:e2e
npm run test:runner:coverage
npm run test:runner:performance
```

### **Standard Jest Commands**
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test patterns
npm run test:unit
npm run test:integration
npm run test:e2e

# Run tests with debugging
npm run test:debug

# Generate coverage report
npm run test:report
```

### **Direct Script Execution**
```bash
# Run test runner directly
node scripts/run-tests.js

# Run specific test types
node scripts/run-tests.js unit
node scripts/run-tests.js integration
node scripts/run-tests.js e2e
node scripts/run-tests.js coverage
node scripts/run-tests.js performance
```

## **Coverage Requirements**

### **Coverage Thresholds**
- **Statements**: 100%
- **Branches**: 100%
- **Functions**: 100%
- **Lines**: 100%

### **Coverage Reports**
- **Text Report**: Console output with coverage percentages
- **HTML Report**: `coverage/lcov-report/index.html`
- **JSON Report**: `coverage/coverage-final.json`
- **LCOV Report**: `coverage/lcov.info`

## **Test Configuration**

### **Jest Configuration**
```json
{
  "preset": "ts-jest",
  "testEnvironment": "jsdom",
  "coverageThreshold": {
    "global": {
      "branches": 100,
      "functions": 100,
      "lines": 100,
      "statements": 100
    }
  }
}
```

### **Test Environment Setup**
- **JSDOM**: DOM simulation for browser-like testing
- **TypeScript**: Full TypeScript support with ts-jest
- **Mocking**: Comprehensive VS Code API mocking
- **Utilities**: Global test helpers and mock factories

## **Test Categories**

### **Storage Tests**
- Data persistence and retrieval
- Serialization/deserialization
- Error handling and recovery
- Data validation and cleanup
- Performance with large datasets

### **Analytics Tests**
- Session management
- File acceptance tracking
- Button click tracking
- ROI calculations
- Data export/import
- Statistics generation

### **Button Detection Tests**
- DOM element detection
- Button type identification
- IDE-specific detection
- Configuration handling
- Performance optimization

### **Integration Tests**
- Component communication
- State synchronization
- Error propagation
- Configuration updates
- Session management

### **E2E Tests**
- Extension activation
- Command registration
- Webview communication
- Global function exposure
- Cross-platform compatibility

## **Mocking Strategy**

### **VS Code API Mocking**
```typescript
const mockVscode = {
  ExtensionContext: jest.fn(),
  commands: { registerCommand: jest.fn() },
  window: { createStatusBarItem: jest.fn() },
  workspace: { getConfiguration: jest.fn() }
};
```

### **DOM Mocking**
```typescript
// Global test helpers
global.createMockElement = (tag, attributes) => { /* ... */ };
global.createMockButton = (text, attributes) => { /* ... */ };
global.simulateEvent = (element, eventType) => { /* ... */ };
```

### **Storage Mocking**
```typescript
const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
```

## **Performance Testing**

### **Performance Metrics**
- **Test Execution Time**: Individual test performance
- **Memory Usage**: Memory consumption during tests
- **Scalability**: Performance with large datasets
- **Consistency**: Performance variation across runs

### **Performance Tests**
```bash
# Run performance tests
npm run test:runner:performance

# Performance analysis
node scripts/run-tests.js performance
```

## **Continuous Integration**

### **CI Configuration**
```yaml
# .github/workflows/test.yml
- name: Run Tests
  run: npm run test:ci

- name: Check Coverage
  run: npm run test:coverage
```

### **Pre-commit Hooks**
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:unit",
      "pre-push": "npm run test:runner:all"
    }
  }
}
```

## **Debugging Tests**

### **Debug Mode**
```bash
# Run tests with debugging
npm run test:debug

# Debug specific test file
node --inspect-brk node_modules/.bin/jest --runInBand test/unit/storage.test.ts
```

### **Verbose Output**
```bash
# Verbose test output
npm test -- --verbose

# Show test names
npm test -- --verbose --testNamePattern="StorageManager"
```

### **Coverage Debugging**
```bash
# Generate detailed coverage
npm run test:coverage -- --coverageReporters=text --coverageReporters=html

# Check specific file coverage
npm test -- --collectCoverageFrom="src/storage.ts"
```

## **Test Data Management**

### **Test Fixtures**
```typescript
// Create test data
const testData = {
  analytics: { sessions: [], fileAcceptances: [] },
  roi: { manualWorkflowTime: 30, autoWorkflowTime: 0.1 }
};
```

### **Test Cleanup**
```typescript
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
  document.body.innerHTML = '';
});
```

## **Writing New Tests**

### **Test Template**
```typescript
describe('ClassName', () => {
  let instance: ClassName;
  let mockDependency: any;

  beforeEach(() => {
    mockDependency = createMockDependency();
    instance = new ClassName(mockDependency);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = instance.methodName(input);
      
      // Assert
      expect(result).toBe('expected');
    });

    it('should handle edge cases', () => {
      // Test edge cases
    });

    it('should handle errors gracefully', () => {
      // Test error handling
    });
  });
});
```

### **Coverage Checklist**
- [ ] All public methods tested
- [ ] All private methods tested (via public interface)
- [ ] All branches covered (if/else, switch cases)
- [ ] All error conditions tested
- [ ] Edge cases covered
- [ ] Performance scenarios tested

## **Test Maintenance**

### **Regular Tasks**
- **Weekly**: Run full test suite
- **Monthly**: Review coverage reports
- **Quarterly**: Update test dependencies
- **Annually**: Refactor test structure

### **Coverage Monitoring**
```bash
# Check current coverage
npm run test:coverage

# Compare with previous runs
npm run test:report
```

## **Troubleshooting**

### **Common Issues**

#### **Tests Failing**
```bash
# Clear Jest cache
npx jest --clearCache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### **Coverage Not 100%**
```bash
# Check specific file coverage
npm test -- --collectCoverageFrom="src/**/*.ts" --coverageReporters=text

# Find uncovered lines
npm run test:coverage -- --coverageReporters=text
```

#### **Performance Issues**
```bash
# Run performance tests
npm run test:runner:performance

# Profile test execution
npm test -- --runInBand --verbose
```

### **Debug Commands**
```bash
# Run single test
npm test -- --testNamePattern="specific test name"

# Run tests in specific file
npm test -- test/unit/storage.test.ts

# Run tests with console output
npm test -- --verbose --no-coverage
```

## **Best Practices**

### **Test Design**
1. **Arrange-Act-Assert**: Clear test structure
2. **Single Responsibility**: One assertion per test
3. **Descriptive Names**: Clear test purpose
4. **Edge Case Coverage**: Test boundary conditions
5. **Error Scenarios**: Test failure modes

### **Mocking Guidelines**
1. **Minimal Mocking**: Mock only what's necessary
2. **Consistent Mocks**: Use consistent mock patterns
3. **Realistic Data**: Use realistic test data
4. **Cleanup**: Always clean up mocks

### **Performance Considerations**
1. **Fast Execution**: Tests should run quickly
2. **Efficient Setup**: Minimize test setup time
3. **Resource Management**: Clean up resources
4. **Parallel Execution**: Support parallel test runs

## **Resources**

### **Documentation**
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [ts-jest Documentation](https://kulshekhar.github.io/ts-jest/)
- [JSDOM Documentation](https://github.com/jsdom/jsdom)

### **Tools**
- **Jest**: Test runner and assertion library
- **ts-jest**: TypeScript support for Jest
- **JSDOM**: DOM simulation for Node.js
- **jest-extended**: Additional Jest matchers

### **Support**
- **GitHub Issues**: Report test-related issues
- **Community**: Join testing discussions
- **Documentation**: Keep this guide updated

---

**Remember**: 100% coverage is not just a number - it's a commitment to quality, reliability, and maintainability. Every line of code should be tested, every edge case should be covered, and every error condition should be handled gracefully.
