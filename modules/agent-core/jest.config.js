/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  collectCoverage: true,
  collectCoverageFrom: [
      "src/lib/agent/**/*.ts",
  ],
  coverageReporters: ["text", "html"],
  coverageThreshold: {global: {lines: 90, branches: 80}},
  maxWorkers: 2,
  moduleNameMapper: {
    '@core-lib/agent/(.*)': '<rootDir>/src/lib/agent/$1',
    '@core-lib/platform/(.*)': '<rootDir>/../platform-core/src/lib/platform/$1',
    '@mockserver': '<rootDir>/tests/lib/agent/mockserver',
    '@testdata': '<rootDir>/tests/lib/agent/testdata',
  },
};
