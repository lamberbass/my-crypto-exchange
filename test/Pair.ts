const Pair = artifacts.require("Pair");

contract('Pair', (accounts: string[]) => {
  it('should be deployed', async () => {
    const pairInstance = await Pair.deployed();
    assert.isNotNull(pairInstance);
  });
});
