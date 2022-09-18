import { ERC20MockInstance, FactoryInstance, LibraryInstance, PairInstance } from "../types/truffle-contracts";
import { eth, wei } from "../src/utils/amount-helper";

const Pair = artifacts.require("Pair");
const Factory = artifacts.require("Factory");
const Library = artifacts.require("Library");
const ERC20Mock = artifacts.require("ERC20Mock");
const { expectRevert } = require('@openzeppelin/test-helpers');

contract('Library', async (accounts: string[]) => {
  let factoryInstance: FactoryInstance;
  let pair01Instance: PairInstance;
  let pair12Instance: PairInstance;
  let pair23Instance: PairInstance;
  let libraryInstance: LibraryInstance = await Library.deployed();
  let token0: ERC20MockInstance;
  let token1: ERC20MockInstance;
  let token2: ERC20MockInstance;
  let token3: ERC20MockInstance;

  beforeEach(async () => {
    factoryInstance = await Factory.new();

    token0 = await ERC20Mock.new("Token 0", "T0");
    token1 = await ERC20Mock.new("Token 1", "T1");
    token2 = await ERC20Mock.new("Token 2", "T2");
    token3 = await ERC20Mock.new("Token 3", "T3");

    await token0.mint(eth(10), accounts[0]);
    await token1.mint(eth(10), accounts[0]);
    await token2.mint(eth(10), accounts[0]);
    await token3.mint(eth(10), accounts[0]);

    await factoryInstance.createPair(token0.address, token1.address);
    const pair01Address: string = await factoryInstance.pairs(token0.address, token1.address);
    pair01Instance = await Pair.at(pair01Address);

    await factoryInstance.createPair(token1.address, token2.address);
    const pair12Address: string = await factoryInstance.pairs(token1.address, token2.address);
    pair12Instance = await Pair.at(pair12Address);

    await factoryInstance.createPair(token2.address, token3.address);
    const pair23Address: string = await factoryInstance.pairs(token2.address, token3.address);
    pair23Instance = await Pair.at(pair23Address);
  });

  describe('Get reserves', async () => {
    it('should return reserves of pair of given tokens', async () => {
      await token0.transfer(pair01Instance.address, eth(1.1));
      await token1.transfer(pair01Instance.address, eth(0.8));

      await pair01Instance.mint(accounts[0]);

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

  describe('Quote before removing liquidity', async () => {
    it('should return amounts and liquidity', async () => {
      await token0.transfer(pair01Instance.address, eth(0.5));
      await token1.transfer(pair01Instance.address, eth(727));

      await pair01Instance.mint(accounts[0]);

      const response = await libraryInstance.quoteBeforeRemovingLiquidity(factoryInstance.address, token0.address, token1.address, 50);
      assert.equal(response[0].toString(), wei('249999999999999986').toString());
      assert.equal(response[1].toString(), wei('363499999999999980934').toString());
      assert.equal(response[2].toString(), wei('9532837982468808877').toString());
    });
  });

  describe('Get amount out', async () => {
    it('should return output amount with 0.3% fee applied', async () => {
      let amountOut: BN = await libraryInstance.getAmountOut(wei(1000), eth(1), eth(1.5));
      assert.equal(amountOut.toString(), wei(1495).toString());
    });

    it('should fail when given zero input amount', async () => {
      await expectRevert(
        libraryInstance.getAmountOut(eth(0), eth(1), eth(1.5)),
        'Insufficient amount'
      );
    });

    it('should fail when given zero input reserve', async () => {
      await expectRevert(
        libraryInstance.getAmountOut(wei(1000), eth(0), eth(1.5)),
        'Insufficient liquidity'
      );
    });

    it('should fail when given zero output reserve', async () => {
      await expectRevert(
        libraryInstance.getAmountOut(wei(1000), eth(1), eth(0)),
        'Insufficient liquidity'
      );
    });
  });

  describe('Get amounts out', async () => {
    it('should return output amounts of path', async () => {
      await token0.transfer(pair01Instance.address, eth(1));
      await token1.transfer(pair01Instance.address, eth(2));
      await pair01Instance.mint(accounts[0]);

      await token1.transfer(pair12Instance.address, eth(1));
      await token2.transfer(pair12Instance.address, eth(0.5));
      await pair12Instance.mint(accounts[0]);

      await token2.transfer(pair23Instance.address, eth(1));
      await token3.transfer(pair23Instance.address, eth(2));
      await pair23Instance.mint(accounts[0]);

      const path: string[] = [
        token0.address,
        token1.address,
        token2.address,
        token3.address
      ];

      const amountsOut: BN[] = await libraryInstance.getAmountsOut(
        factoryInstance.address, 
        eth(0.1),
        path);

      assert.equal(amountsOut.length, path.length);
      assert.equal(amountsOut[0].toString(), eth(0.1).toString());
      assert.equal(amountsOut[1].toString(), '181322178776029826');
      assert.equal(amountsOut[2].toString(), '76550452221167502');
      assert.equal(amountsOut[3].toString(), '141817942760565270');
    });

    it('should fail when given path with only one token', async () => {
      await expectRevert(
        libraryInstance.getAmountsOut(
          factoryInstance.address, 
          eth(0.1), 
          [token0.address]
        ),
        'Invalid path'
      );
    });
  });

  describe('Get amount in', async () => {
    it('should return input amount with 0.3% fee applied', async () => {
      let amountIn: BN = await libraryInstance.getAmountIn(wei(1495), eth(1), eth(1.5));
      assert.equal(amountIn.toString(), wei(1000).toString());
    });

    it('should fail when given zero output amount', async () => {
      await expectRevert(
        libraryInstance.getAmountIn(eth(0), eth(1), eth(1.5)),
        'Insufficient amount'
      );
    });

    it('should fail when given zero input reserve', async () => {
      await expectRevert(
        libraryInstance.getAmountIn(wei(1000), eth(0), eth(1.5)),
        'Insufficient liquidity'
      );
    });

    it('should fail when given zero output reserve', async () => {
      await expectRevert(
        libraryInstance.getAmountIn(wei(1000), eth(1), eth(0)),
        'Insufficient liquidity'
      );
    });
  });

  describe('Get amounts in', async () => {
    it('should return input amounts of path', async () => {
      await token0.transfer(pair01Instance.address, eth(1));
      await token1.transfer(pair01Instance.address, eth(2));
      await pair01Instance.mint(accounts[0]);

      await token1.transfer(pair12Instance.address, eth(1));
      await token2.transfer(pair12Instance.address, eth(0.5));
      await pair12Instance.mint(accounts[0]);

      await token2.transfer(pair23Instance.address, eth(1));
      await token3.transfer(pair23Instance.address, eth(2));
      await pair23Instance.mint(accounts[0]);

      const path: string[] = [
        token0.address,
        token1.address,
        token2.address,
        token3.address
      ];

      const amountsOut: BN[] = await libraryInstance.getAmountsIn(
        factoryInstance.address, 
        eth(0.1),
        path);

      assert.equal(amountsOut.length, path.length);
      assert.equal(amountsOut[0].toString(), '63113405152841847');
      assert.equal(amountsOut[1].toString(), '118398043685444580');
      assert.equal(amountsOut[2].toString(), '52789948793749671');
      assert.equal(amountsOut[3].toString(), eth(0.1).toString());
    });

    it('should fail when given path with only one token', async () => {
      await expectRevert(
        libraryInstance.getAmountsIn(
          factoryInstance.address, 
          eth(0.1), 
          [token0.address]
        ),
        'Invalid path'
      );
    });
  });
});
