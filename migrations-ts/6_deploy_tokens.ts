const ERC20Mock = artifacts.require('ERC20Mock');

const migration: Truffle.Migration = async function (deployer) {
  const tokens: { [symbol: string]: string } = {
    'ETH': 'Ether Token',
    'USDC': 'USD Coin',
    'SHIB': 'SHIBA INU',
    'LINK': 'ChainLink Token'
  };

  for (const key in tokens) {
    const instance = await ERC20Mock.new(tokens[key], key);
    console.log(`Created new instance of token ${tokens[key]} (${key}) at address ${instance.address}`);
  }
}

module.exports = migration;
export { }