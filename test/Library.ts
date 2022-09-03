import { ERC20MockInstance, FactoryInstance, LibraryInstance, PairInstance } from "../types/truffle-contracts";
import { eth } from "../utils/amount-helper";

const Pair = artifacts.require("Pair");
const Factory = artifacts.require("Factory");
const Library = artifacts.require("Library");
const ERC20Mock = artifacts.require("ERC20Mock");

contract('Library', async (accounts: string[]) => {
  let factoryInstance: FactoryInstance;
  let pairInstance: PairInstance;
  let libraryInstance: LibraryInstance = await Library.deployed();
  let token0: ERC20MockInstance;
  let token1: ERC20MockInstance;

  beforeEach(async () => {
    factoryInstance = await Factory.new();

    token0 = await ERC20Mock.new("Token 0", "T0");
    token1 = await ERC20Mock.new("Token 1", "T1");

    await token0.mint(eth(10), accounts[0]);
    await token1.mint(eth(10), accounts[0]);

    await factoryInstance.createPair(token0.address, token1.address);
    const pairAddress: string = await factoryInstance.pairs(token0.address, token1.address);
    pairInstance = await Pair.at(pairAddress);
  });

  describe('Get reserves', async () => {
    it('should return reserves of pair of given tokens', async () => {
      await token0.transfer(pairInstance.address, eth(1.1));
      await token1.transfer(pairInstance.address, eth(0.8));

      await pairInstance.mint(accounts[0]);

      const reserves = await libraryInstance.getReserves(factoryInstance.address, token0.address, token1.address);
      assert.equal(reserves[0].toString(), eth(1.1).toString());
      assert.equal(reserves[1].toString(), eth(0.8).toString());
    });
  });

  describe('Quote', async () => {
    it('should return output amount', async () => {
      let amountOut: BN = await libraryInstance.quote(eth(1), eth(1), eth(1));
      assert.equal(amountOut.toString(), eth(1).toString());

      amountOut = await libraryInstance.quote(eth(1), eth(2), eth(1));
      assert.equal(amountOut.toString(), eth(0.5).toString());

      amountOut = await libraryInstance.quote(eth(1), eth(1), eth(2));
      assert.equal(amountOut.toString(), eth(2).toString());
    });
  });
});
