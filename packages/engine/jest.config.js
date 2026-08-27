/**
 * The engine is pure TypeScript with no React Native surface, so it runs on a
 * plain node environment with babel-jest rather than the jest-expo preset the
 * app uses. Same runner (Jest) either way — no second test framework.
 */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/__tests__/**'],
};
