# 🚀 Phase 1 Quick Start Guide

## ⚡ **Get Started in 30 Minutes**

This guide will get you through the critical Phase 1 tasks quickly and efficiently.

---

## 🎯 **Phase 1 Goals (Week 1-2)**

**Priority**: CRITICAL - Must complete before any other development
**Timeline**: 1-2 weeks
**Success Criteria**: ESLint working, 100% test coverage, all config files created

---

## 🚀 **Step 1: ESLint Configuration (15 minutes)**

### 1.1 Initialize ESLint
```bash
# Navigate to project root
cd /home/b007ab1e/_src/cursor-ide-extension

# Initialize ESLint configuration
npm init @eslint/config

# Choose these options when prompted:
# - How would you like to use ESLint? → "To check syntax, find problems, and enforce code style"
# - What type of modules does your project use? → "JavaScript modules (import/export)"
# - Which framework does your project use? → "None of these"
# - Does your project use TypeScript? → "Yes"
# - Where does your code run? → "Node"
# - What format do you want your config file to be in? → "JavaScript"
# - Would you like to install them now with npm? → "Yes"
```

### 1.2 Install Additional ESLint Plugins
```bash
# Install TypeScript-specific ESLint plugins
npm install --save-dev @typescript-eslint/eslint-plugin @typescript-eslint/parser

# Install VS Code extension specific rules
npm install --save-dev eslint-plugin-vscode

# Install import/export rules
npm install --save-dev eslint-plugin-import
```

### 1.3 Create Enhanced ESLint Config
Create `.eslintrc.js` with this content:

```javascript
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    'import',
    'vscode'
  ],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:import/typescript',
    'plugin:vscode/recommended'
  ],
  env: {
    node: true,
    es6: true
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    
    // Import rules
    'import/order': 'error',
    'import/no-unresolved': 'off', // VS Code handles this
    
    // General rules
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error'
  },
  ignorePatterns: [
    'out/',
    'node_modules/',
    'coverage/',
    '*.js'
  ]
};
```

### 1.4 Test ESLint
```bash
# Test ESLint configuration
npm run lint

# You should see linting errors (this is expected for now)
```

---

## 🎨 **Step 2: Prettier Configuration (10 minutes)**

### 2.1 Install Prettier
```bash
npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier
```

### 2.2 Create Prettier Config
Create `.prettierrc`:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

### 2.3 Create Prettier Ignore
Create `.prettierignore`:

```
out/
node_modules/
coverage/
*.js
*.js.map
*.d.ts.map
```

### 2.4 Update ESLint for Prettier
Update `.eslintrc.js` to include Prettier:

```javascript
module.exports = {
  // ... existing config ...
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:import/typescript',
    'plugin:vscode/recommended',
    'prettier' // Add this line
  ],
  plugins: [
    '@typescript-eslint',
    'import',
    'vscode',
    'prettier' // Add this line
  ],
  rules: {
    // ... existing rules ...
    'prettier/prettier': 'error' // Add this line
  }
};
```

---

## 🧪 **Step 3: Test Infrastructure Setup (5 minutes)**

### 3.1 Update Jest Configuration
Update `jest.config.js` to include coverage thresholds:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts']
};
```

### 3.2 Test Current Coverage
```bash
# Run tests with coverage
npm run test:coverage

# Note the current coverage levels (should be around 38%)
```

---

## ⚙️ **Step 4: Configuration Files (5 minutes)**

### 4.1 Create VS Code Settings
Create `.vscode/settings.json`:

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": ["typescript"],
  "typescript.suggest.autoImports": true
}
```

### 4.2 Create VS Code Extensions
Create `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### 4.3 Update Package.json Scripts
Add these scripts to `package.json`:

```json
{
  "scripts": {
    "lint": "eslint src --ext ts",
    "lint:fix": "eslint src --ext ts --fix",
    "format": "prettier --write src/**/*.ts",
    "format:check": "prettier --check src/**/*.ts",
    "quality": "npm run lint && npm run format:check && npm run test:coverage",
    "fix": "npm run lint:fix && npm run format"
  }
}
```

---

## ✅ **Step 5: Validation (5 minutes)**

### 5.1 Test All Commands
```bash
# Test linting
npm run lint

# Test formatting
npm run format:check

# Test quality checks
npm run quality

# Test auto-fix
npm run fix
```

### 5.2 Verify Configuration
- [ ] ESLint runs without configuration errors
- [ ] Prettier formats code correctly
- [ ] VS Code shows no configuration warnings
- [ ] All npm scripts execute successfully

---

## 🎯 **Next Steps After Phase 1**

### **Immediate Actions (Next 2-3 days)**
1. **Fix All Linting Errors**: Run `npm run lint` and fix each error
2. **Improve Test Coverage**: Start with `controlPanel.ts` and `extension.ts`
3. **Create Test Utilities**: Build mock systems for VS Code API

### **Phase 1 Completion Checklist**
- [ ] ESLint configuration working
- [ ] Prettier configuration working
- [ ] VS Code integration configured
- [ ] All configuration files created
- [ ] NPM scripts updated and working
- [ ] Test coverage improved (target: 100%)

---

## 🚨 **Common Issues & Solutions**

### **ESLint Configuration Errors**
```bash
# If you get module resolution errors
npm install --save-dev @types/node

# If you get TypeScript errors
npm run compile
```

### **Prettier Conflicts**
```bash
# If Prettier and ESLint conflict
npm run fix
npm run lint
```

### **Test Coverage Issues**
```bash
# If tests fail due to missing mocks
# Focus on one file at a time
npm run test -- --testPathPattern=controlPanel
```

---

## 📞 **Need Help?**

- **ESLint Issues**: Check [ESLint documentation](https://eslint.org/)
- **Prettier Issues**: Check [Prettier documentation](https://prettier.io/)
- **TypeScript Issues**: Check [TypeScript documentation](https://www.typescriptlang.org/)
- **Project Issues**: Create GitHub issue or contact ivan@ivalsaraj.com

---

## ⏱️ **Time Tracking**

| Task | Estimated Time | Actual Time | Status |
|------|----------------|-------------|---------|
| ESLint Setup | 15 min | _____ | ⏳ |
| Prettier Setup | 10 min | _____ | ⏳ |
| Test Config | 5 min | _____ | ⏳ |
| VS Code Config | 5 min | _____ | ⏳ |
| Validation | 5 min | _____ | ⏳ |
| **Total** | **40 min** | **_____** | **⏳** |

---

*Phase 1 Quick Start Guide - Version 1.0*
*Last Updated: ${new Date().toLocaleDateString()}*
