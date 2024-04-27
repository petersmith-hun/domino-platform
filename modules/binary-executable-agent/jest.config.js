/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  collectCoverage: true,
  collectCoverageFrom: [
    "src/agent/**/*.ts",
  ],
  coverageReporters: ["text", "html"],
  coverageThreshold: {global: {lines: 90, branches: 80}},
  maxWorkers: 2,
  moduleNameMapper: {
    '@bin-exec-agent/(.*)': '<rootDir>/src/agent/$1',
    '@bin-exec-agent-package': '<rootDir>/package.json',
    '@bin-exec-agent-build-time': '<rootDir>/build-time.json',
    '@core-lib/platform/(.*)': '<rootDir>/../platform-core/src/lib/platform/$1',
    '@core-lib/agent/(.*)': '<rootDir>/../agent-core/src/lib/agent/$1',
    '@testdata': '<rootDir>/tests/agent/testdata'
  },
};
