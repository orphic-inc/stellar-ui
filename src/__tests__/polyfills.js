if (typeof global.fetch !== 'function') {
  global.fetch = jest.fn();
}

// webpack injects __APP_VERSION__ via DefinePlugin; mirror it for jsdom so
// components that reference it (PrivateFooter fallback) don't ReferenceError.
if (typeof global.__APP_VERSION__ === 'undefined') {
  global.__APP_VERSION__ = '0.0.0-test';
}

// react-router v7 reaches for TextEncoder/TextDecoder, which jsdom does not
// expose as globals even though Node has had them since v11. Bridge them from
// node:util rather than pulling in a polyfill package.
const { TextEncoder, TextDecoder } = require('node:util');
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}
