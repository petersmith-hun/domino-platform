/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  collectCoverage: true,
  collectCoverageFrom: [
    "src/lib/platform/**/*.ts",
  ],
  coverageReporters: ["text", "html"],
  coverageThreshold: {global: {lines: 90, branches: 80}},
  maxWorkers: 2,
  moduleNameMapper: {
    '@core-lib/platform/(.*)': '<rootDir>/src/lib/platform/$1',
    '@test/(.*)': '<rootDir>/tests/$1'
  },
};
