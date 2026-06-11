/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  // Mirror the webpack DefinePlugin so components that render the build-time
  // version (PrivateFooter) resolve __APP_VERSION__ under jest.
  globals: { __APP_VERSION__: require('./package.json').version },
  setupFiles: ['<rootDir>/src/__tests__/polyfills.js'],
  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', { configFile: './babel.config.test.js' }]
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  moduleNameMapper: {
    '\\.(css|scss|sass|png|jpg|gif|svg|ttf|woff2?)$':
      '<rootDir>/src/__tests__/fileMock.js'
  },
  testMatch: ['<rootDir>/src/**/?(*.)+(spec|test).[jt]s?(x)'],
  moduleDirectories: ['node_modules', 'src']
};
