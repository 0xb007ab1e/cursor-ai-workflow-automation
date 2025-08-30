// Jest setup file to fix matchers object issue
const { expect } = require('@jest/globals');

// Ensure expect is properly initialized
global.expect = expect;

// Ensure Jest matchers object is available
if (typeof expect !== 'undefined') {
  expect.extend({
    // Add any custom matchers if needed
  });
}

// Mock global objects that might interfere
global.globalThis = global.globalThis || global;
global.global = global.global || global;
global.window = global.window || global;

// Ensure proper module loading
process.env.NODE_ENV = 'test';

