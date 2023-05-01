module.exports = {
  preset: 'ts-jest',
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1'
  }, testMatch: [
    '**/tests/**/*.test.ts'
  ]
}