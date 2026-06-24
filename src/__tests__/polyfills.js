if (typeof global.fetch !== 'function') {
  global.fetch = jest.fn();
}

// webpack injects __APP_VERSION__ via DefinePlugin; mirror it for jsdom so
// components that reference it (PrivateFooter fallback) don't ReferenceError.
if (typeof global.__APP_VERSION__ === 'undefined') {
  global.__APP_VERSION__ = '0.0.0-test';
}
