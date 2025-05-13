// backend/jest.config.js
module.exports = {
  testEnvironment: 'node',
  verbose: true,
  reporters: [
    'default', // Keep the default console output
    [
      'jest-html-reporters',
      {
        publicPath: './html-report',
        filename: `report-${new Date().toISOString()}.html`, // Name of the main report file
        expand: false, // Expand all test suites by default
        pageTitle: 'Phufa Cafe API Test Report', // Optional: Custom page title
      },
    ],
  ],
  // You might need to setup a global setup/teardown for your database if tests modify data
  // globalSetup: './tests/setup.js',
  // globalTeardown: './tests/teardown.js',
};
