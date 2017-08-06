const index = require('./index');

describe('e2e', () => {
  it('just works', () => {
    expect(index).toBeDefined();
    expect(index.Type).toBeInstanceOf(Function);
  });
});
