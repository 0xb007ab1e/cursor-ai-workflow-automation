module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    'prettier'
  ],
  env: {
    node: true,
    es6: true,
    browser: true
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  rules: {
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    'prettier/prettier': 'error',
    'no-undef': 'off', // TypeScript handles this
    'no-unused-vars': 'off', // Use TypeScript version
    '@typescript-eslint/no-unused-vars': 'warn'
  },
  ignorePatterns: [
    'out/',
    'node_modules/',
    'coverage/',
    '*.js',
    '*.js.map',
    '*.d.ts.map'
  ]
};
