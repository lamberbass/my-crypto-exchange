import { ERC20MockInstance, FactoryInstance } from "../types/truffle-contracts";

const Factory = artifacts.require("Factory");
const ERC20Mock = artifacts.require("ERC20Mock");
const { constants, expectRevert } = require('@openzeppelin/test-helpers');

contract('Factory', (accounts: string[]) => {
  let factoryInstance: FactoryInstance;
  let token0: ERC20MockInstance;
  let token1: ERC20MockInstance;

  beforeEach(async () => {
    token0 = await ERC20Mock.new("Token 0", "T0");
    token1 = await ERC20Mock.new("Token 1", "T1");
    factoryInstance = await Factory.new();
  });

  describe('Create Pair', async () => {
    it('should create pair', async () => {    
      await factoryInstance.createPair(token0.address, token1.address);

      const pairAddress01: string = await factoryInstance.pairs(token0.address, token1.address);
      const pairAddress10: string = await factoryInstance.pairs(token1.address, token0.address);

      assert.notEqual(pairAddress01, constants.ZERO_ADDRESS);
      assert.notEqual(pairAddress10, constants.ZERO_ADDRESS);
      assert.equal(pairAddress01, pairAddress10);
    });

    it('should fail when tokens have the same address', async () => {    
      await expectRevert(
        factoryInstance.createPair(token0.address, token0.address), 
        'Tokens should have different addresses');
    });

    it('should fail when a token has zero address', async () => {    
      await expectRevert(
        factoryInstance.createPair(token0.address, constants.ZERO_ADDRESS), 
        'Tokens should have non-zero addresses');
    });

    it('should fail when pair already exists', async () => {    
      await factoryInstance.createPair(token0.address, token1.address);

      await expectRevert(
        factoryInstance.createPair(token1.address, token0.address), 
        'Pair already exists for these tokens');
    });
  });
});
