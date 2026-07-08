import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',                              // ← NOT 'jest-environment-jsdom'
  
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/?(*.)+(spec|test).ts?(x)'],
  
  moduleDirectories: ['node_modules', 'src', 'test'],
  
  moduleNameMapper: {
    '^obsidian$': '<rootDir>/_mocks_/index.ts',         // ← With ^ and $
    '^src/(.*)$': '<rootDir>/src/$1',
    '^settings$': '<rootDir>/src/settings',
    '^_mocks_/(.*)$': '<rootDir>/_mocks_/$1',
  },
  
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],      // ← NOT 'setupFiles'
  
  transform: {                                            // ← CRITICAL for TypeScript
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
};

export default config;