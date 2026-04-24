if (typeof global.fetch !== 'function') {
  global.fetch = jest.fn();
}
