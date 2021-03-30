module.exports = {
  verbose: true,
  testEnvironment: 'node',
  setupFiles: ['dotenv/config'],
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'json'
  ],
  transform: {
    '\\.ts$': 'ts-jest'
  },
  testRegex: '.*(\\.test|tests).*\\.(ts|js)$',
  // setupFiles: [
  //   "<rootDir>/tests/__helpers__/beforeEachSuite.ts"
  // ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/__helpers__/',
    '/build/'
  ],
  reporters: [
    'default',
    'jest-junit'
  ]
}
