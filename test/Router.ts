import { ERC20MockInstance, FactoryInstance, PairInstance, RouterInstance } from "../types/truffle-contracts";
import { eth, wei } from "../utils/amount-helper";
import { AssertHelper } from "../utils/assert-helper";

const Pair = artifacts.require("Pair");
const Factory = artifacts.require("Factory");
const Router = artifacts.require("Router");
const ERC20Mock = artifacts.require("ERC20Mock");
const { constants, expectRevert } = require('@openzeppelin/test-helpers');

contract('Router', (accounts: string[]) => {
  let factoryInstance: FactoryInstance;
  let routerInstance: RouterInstance;
  let pairInstance: PairInstance;
  let token0: ERC20MockInstance;
  let token1: ERC20MockInstance;

  beforeEach(async () => {
    factoryInstance = await Factory.new();
    routerInstance = await Router.new(factoryInstance.address);

    token0 = await ERC20Mock.new("Token 0", "T0");
    token1 = await ERC20Mock.new("Token 1", "T1");

    await token0.mint(eth(20), accounts[0]);
    await token1.mint(eth(20), accounts[0]);

    await factoryInstance.createPair(token0.address, token1.address);
    const pairAddress: string = await factoryInstance.pairs(token0.address, token1.address);
    pairInstance = await Pair.at(pairAddress);
  });

  async function assertLpBalanceAndTotalSupply(account: string, expected: { balance: BN, totalSupply: BN }) {
    await AssertHelper.assertLpBalanceAndTotalSupply(pairInstance, account, expected);
  }

  async function assertReserves(expected: { reserve0: BN, reserve1: BN }) {
    await AssertHelper.assertReserves(pairInstance, expected);
  }

  const assertTokenBalances = async (account: string, expected: { balance0: BN, balance1: BN }) => {
    await AssertHelper.assertTokenBalances(token0, token1, account, expected);
  }

  describe('Add Liquidity', async () => {
    it('should create pair', async () => {
      const token2 = await ERC20Mock.new("Token 2", "T2");
      const token3 = await ERC20Mock.new("Token 3", "T3");

      await token2.mint(eth(1), accounts[0]);
      await token3.mint(eth(1), accounts[0]);

      await token2.approve(routerInstance.address, eth(1));
      await token3.approve(routerInstance.address, eth(1));

      await routerInstance.addLiquidity(
        token2.address,
        token3.address,
        eth(1),
        eth(1),
        eth(1),
        eth(1),
        accounts[0]
      );

      const pairAddress: string = await factoryInstance.pairs(token2.address, token3.address);
      assert.notEqual(pairAddress, constants.ZERO_ADDRESS);
    });

    it('should add liquidity when reserves are zero', async () => {
      await assertReserves({
        reserve0: eth(0),
        reserve1: eth(0)
      });

      await token0.approve(routerInstance.address, eth(1));
      await token1.approve(routerInstance.address, eth(1));

      await routerInstance.addLiquidity(
        token0.address,
        token1.address,
        eth(1),
        eth(1),
        eth(1),
        eth(1),
        accounts[0]
      );

      await assertTokenBalances(pairInstance.address, {
        balance0: eth(1),
        balance1: eth(1)
      });

      await assertLpBalanceAndTotalSupply(accounts[0], {
        balance: eth(1).sub(wei(1000)),
        totalSupply: eth(1)
      });

      await assertTokenBalances(accounts[0], {
        balance0: eth(19),
        balance1: eth(19)
      });
    });

    it('should add liquidity when amountBOptimal is ok', async () => {
      await token0.transfer(pairInstance.address, eth(1));
      await token1.transfer(pairInstance.address, eth(2));
      await pairInstance.mint(accounts[0]);

      await assertTokenBalances(pairInstance.address, {
        balance0: eth(1),
        balance1: eth(2)
      });

      await assertLpBalanceAndTotalSupply(accounts[0], {
        balance: wei('1414213562373094048'),
        totalSupply: wei('1414213562373094048').add(wei(1000))
      });

      await token0.approve(routerInstance.address, eth(1));
      await token1.approve(routerInstance.address, eth(2));

      await routerInstance.addLiquidity(
        token0.address,
        token1.address,
        eth(1),
        eth(2),
        eth(1),
        eth(1.9),
        accounts[0]
      );

      await assertTokenBalances(pairInstance.address, {
        balance0: eth(1).add(eth(1)),
        balance1: eth(2).add(eth(2))
      });

      await assertLpBalanceAndTotalSupply(accounts[0], {
        balance: wei('1414213562373094048').add(wei('1414213562373095048')),
        totalSupply: wei('1414213562373094048').add(wei(1000)).add(wei('1414213562373095048'))
      });
    });

    it('should fail when amountBOptimal is too low', async () => {
      await token0.transfer(pairInstance.address, eth(5));
      await token1.transfer(pairInstance.address, eth(10));
      await pairInstance.mint(accounts[0]);

      await token0.approve(routerInstance.address, eth(1));
      await token1.approve(routerInstance.address, eth(2));

      await expectRevert(routerInstance.addLiquidity(
        token0.address,
        token1.address,
        eth(1),
        eth(2),
        eth(1),
        eth(2),
        accounts[0]
      ), 'Insufficient B amount');
    });

    it('should fail when amountBOptimal is too high and amountAOptimal is too low', async () => {
      await token0.transfer(pairInstance.address, eth(10));
      await token1.transfer(pairInstance.address, eth(5));
      await pairInstance.mint(accounts[0]);

      await token0.approve(routerInstance.address, eth(2));
      await token1.approve(routerInstance.address, eth(1));

      await expectRevert(routerInstance.addLiquidity(
        token0.address,
        token1.address,
        eth(2),
        eth(0.9),
        eth(2),
        eth(1),
        accounts[0]
      ), 'Insufficient A amount');
    });

    it('should add liquidity when amountBOptimal is too high and amountAOptimal is ok', async () => {
      await token0.transfer(pairInstance.address, eth(10));
      await token1.transfer(pairInstance.address, eth(5));
      await pairInstance.mint(accounts[0]);

      await assertTokenBalances(pairInstance.address, {
        balance0: eth(10),
        balance1: eth(5)
      });

      await assertLpBalanceAndTotalSupply(accounts[0], {
        balance: wei('7071067811865474244'),
        totalSupply: wei('7071067811865474244').add(wei(1000))
      });

      await token0.approve(routerInstance.address, eth(2));
      await token1.approve(routerInstance.address, eth(1));

      await routerInstance.addLiquidity(
        token0.address,
        token1.address,
        eth(2),
        eth(0.9),
        eth(1.7),
        eth(1),
        accounts[0]
      );

      await assertTokenBalances(pairInstance.address, {
        balance0: eth(10).add(eth(1.8)),
        balance1: eth(5).add(eth(0.9))
      });

      await assertLpBalanceAndTotalSupply(accounts[0], {
        balance: wei('7071067811865474244').add(wei('1272792206135785543')),
        totalSupply: wei('7071067811865474244').add(wei(1000)).add(wei('1272792206135785543'))
      });
    });
  });
});
