/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  collectCoverage: true,
  collectCoverageFrom: [
    "src/coordinator/**/*.ts",
  ],
  coverageReporters: ["text", "html"],
  coverageThreshold: {global: {lines: 90, branches: 80}},
  maxWorkers: 2,
  moduleNameMapper: {
    '@coordinator/(.*)': '<rootDir>/src/coordinator/$1',
    '@coordinator-package': '<rootDir>/package.json',
    '@coordinator-build-time': '<rootDir>/build-time.json',
    '@core-lib/platform/(.*)': '<rootDir>/../platform-core/src/lib/platform/$1',
    '@testdata/web': '<rootDir>/tests/coordinator/web/web.testdata'
  },
};
