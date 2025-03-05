module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  maxWorkers: '50%',
  testTimeout: 30000,
  maxConcurrency: 5,
  // Performance optimizations
  cache: true,
  watchAll: false,
  bail: 0,
  verbose: false,
  // For faster startup
  transform: {
      '^.+\\.tsx?$': ['ts-jest', {
          isolatedModules: true  // Speeds up TypeScript compilation
      }]
  }
};