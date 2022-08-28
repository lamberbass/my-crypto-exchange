import { ERC20MockInstance, FactoryInstance, PairInstance } from "../types/truffle-contracts";
import { eth, wei } from "../utils/amount-helper";
import { AssertHelper } from "../utils/assert-helper";

const Factory = artifacts.require("Factory");
const Pair = artifacts.require("Pair");
const ERC20Mock = artifacts.require("ERC20Mock");
const { expectRevert } = require('@openzeppelin/test-helpers');

contract('Pair', (accounts: string[]) => {
  let pairInstance: PairInstance;
  let token0: ERC20MockInstance;
  let token1: ERC20MockInstance;

  beforeEach(async () => {
    token0 = await ERC20Mock.new("Token 0", "T0");
    token1 = await ERC20Mock.new("Token 1", "T1");

    const factoryInstance: FactoryInstance = await Factory.new();
    await factoryInstance.createPair(token0.address, token1.address);

    const pairAddress: string = await factoryInstance.pairs(token0.address, token1.address);
    pairInstance = await Pair.at(pairAddress);

    await token0.mint(eth(10), accounts[0]);
    await token1.mint(eth(10), accounts[0]);

    await token0.mint(eth(10), accounts[1]);
    await token1.mint(eth(10), accounts[1]);
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

  describe('Mint', async () => {
    it('should mint when there\'s no liquidity', async () => {
      await token0.transfer(pairInstance.address, eth(1));
      await token1.transfer(pairInstance.address, eth(1));

      await pairInstance.mint(accounts[0]);

      await assertLpBalanceAndTotalSupply(accounts[0], {
        balance: eth(1).sub(wei(1000)),
        totalSupply: eth(1)
      });

      await assertReserves({
        reserve0: eth(1),
        reserve1: eth(1)
      });
    });

    it('should mint when there\'s liquidity', async () => {
      await token0.transfer(pairInstance.address, eth(1));
      await token1.transfer(pairInstance.address, eth(1));

      await pairInstance.mint(accounts[0]);

      await token0.transfer(pairInstance.address, eth(2));
      await token1.transfer(pairInstance.address, eth(2));

      await pairInstance.mint(accounts[0]);

      await assertLpBalanceAndTotalSupply(accounts[0], {
        balance: eth(3).sub(wei(1000)),
        totalSupply: eth(3)
      });

      await assertReserves({
        reserve0: eth(3),
        reserve1: eth(3)
      });
    });

    it('should mint with unbalanced token amounts', async () => {
      await token0.transfer(pairInstance.address, eth(1));
      await token1.transfer(pairInstance.address, eth(1));

      await pairInstance.mint(accounts[0]);

      await token0.transfer(pairInstance.address, eth(2));
      await token1.transfer(pairInstance.address, eth(1));

      await pairInstance.mint(accounts[0]);

      await assertLpBalanceAndTotalSupply(accounts[0], {
        balance: eth(2).sub(wei(1000)),
        totalSupply: eth(2)
      });

      await assertReserves({
        reserve0: eth(3),
        reserve1: eth(2)
      });
    });

    it('should fail when token amounts are zero', async () => {
      await expectRevert.unspecified(pairInstance.mint(accounts[0]));
    });

    it('should fail when minting zero LP tokens', async () => {
      await token0.transfer(pairInstance.address, wei(1000));
      await token1.transfer(pairInstance.address, wei(1000));

      await expectRevert(pairInstance.mint(accounts[0]), 'Insufficient liquidity tokens minted!');
    });
  });

  describe('Burn', async () => {
    it('should burn with balanced token amounts', async () => {
      await token0.transfer(pairInstance.address, eth(1));
      await token1.transfer(pairInstance.address, eth(1));

      await pairInstance.mint(accounts[0]);

      await pairInstance.burn(accounts[0], await pairInstance.balanceOf(accounts[0]));

      await assertLpBalanceAndTotalSupply(accounts[0], {
        balance: eth(0),
        totalSupply: wei(1000)
      });

      await assertReserves({
        reserve0: wei(1000),
        reserve1: wei(1000)
      });

      await assertTokenBalances(accounts[0], {
        balance0: eth(10).sub(wei(1000)),
        balance1: eth(10).sub(wei(1000))
      });
    });

    it('should burn with unbalanced token amounts', async () => {
      await token0.transfer(pairInstance.address, eth(1));
      await token1.transfer(pairInstance.address, eth(1));

      await pairInstance.mint(accounts[0]);

      await token0.transfer(pairInstance.address, eth(2));
      await token1.transfer(pairInstance.address, eth(1));

      await pairInstance.mint(accounts[0]);

      await pairInstance.burn(accounts[0], await pairInstance.balanceOf(accounts[0]));

      await assertLpBalanceAndTotalSupply(accounts[0], {
        balance: eth(0),
        totalSupply: wei(1000)
      });

      await assertReserves({
        reserve0: wei(1500),
        reserve1: wei(1000)
      });

      await assertTokenBalances(accounts[0], {
        balance0: eth(10).sub(wei(1500)),
        balance1: eth(10).sub(wei(1000))
      });
    });

    it('should burn with different users', async () => {
      await token0.transfer(pairInstance.address, eth(1), { from: accounts[1] });
      await token1.transfer(pairInstance.address, eth(1), { from: accounts[1] });

      await pairInstance.mint(accounts[1]);

      await token0.transfer(pairInstance.address, eth(2));
      await token1.transfer(pairInstance.address, eth(1));

      await pairInstance.mint(accounts[0]);

      await pairInstance.burn(accounts[0], await pairInstance.balanceOf(accounts[0]));

      await assertLpBalanceAndTotalSupply(accounts[0], {
        balance: eth(0),
        totalSupply: eth(1)
      });

      await assertReserves({
        reserve0: eth(1.5),
        reserve1: eth(1)
      });

      // accounts[0] lost 0.5 eth of token0 for providing unbalanced liquidity
      await assertTokenBalances(accounts[0], {
        balance0: eth(10).sub(eth(0.5)),
        balance1: eth(10)
      });

      await pairInstance.burn(accounts[1], await pairInstance.balanceOf(accounts[1]));

      await assertLpBalanceAndTotalSupply(accounts[0], {
        balance: eth(0),
        totalSupply: wei(1000)
      });

      await assertReserves({
        reserve0: wei(1500),
        reserve1: wei(1000)
      });

      // accounts[1] gained the 0.5 eth of token0 that accounts[0] lost
      await assertTokenBalances(accounts[1], {
        balance0: eth(10).add(eth(0.5)).sub(wei(1500)),
        balance1: eth(10).sub(wei(1000))
      });
    });

    it('should fail when total supply is zero', async () => {
      await expectRevert.unspecified(pairInstance.burn(accounts[0], await pairInstance.balanceOf(accounts[0])));
    });

    it('should fail when LP tokens are zero', async () => {
      await token0.transfer(pairInstance.address, eth(1));
      await token1.transfer(pairInstance.address, eth(1));

      await pairInstance.mint(accounts[0]);

      await expectRevert(pairInstance.burn(accounts[1], await pairInstance.balanceOf(accounts[1])), 'Insufficient liquidity tokens burned!');
    });
  });

  describe('Swap', async () => {
    it('should swap token0 for token1', async () => {
      await token0.transfer(pairInstance.address, eth(1));
      await token1.transfer(pairInstance.address, eth(2));
      await pairInstance.mint(accounts[0]);

      await token0.transfer(pairInstance.address, eth(0.1));
      await pairInstance.swap(eth(0), eth(0.18), accounts[0]);

      await assertTokenBalances(accounts[0], {
        balance0: eth(10).sub(eth(1)).sub(eth(0.1)),
        balance1: eth(10).sub(eth(2)).add(eth(0.18))
      });

      await assertReserves({
        reserve0: eth(1).add(eth(0.1)),
        reserve1: eth(2).sub(eth(0.18))
      });
    });

    it('should swap token1 for token0', async () => {
      await token0.transfer(pairInstance.address, eth(1));
      await token1.transfer(pairInstance.address, eth(2));
      await pairInstance.mint(accounts[0]);

      await token1.transfer(pairInstance.address, eth(0.2));
      await pairInstance.swap(eth(0.09), eth(0), accounts[0]);

      await assertTokenBalances(accounts[0], {
        balance0: eth(10).sub(eth(1)).add(eth(0.09)),
        balance1: eth(10).sub(eth(2)).sub(eth(0.2))
      });

      await assertReserves({
        reserve0: eth(1).sub(eth(0.09)),
        reserve1: eth(2).add(eth(0.2))
      });
    });

    it('should swap tokens bidirectional', async () => {
      await token0.transfer(pairInstance.address, eth(1));
      await token1.transfer(pairInstance.address, eth(2));
      await pairInstance.mint(accounts[0]);

      await token0.transfer(pairInstance.address, eth(0.1));
      await token1.transfer(pairInstance.address, eth(0.2));
      await pairInstance.swap(eth(0.09), eth(0.18), accounts[0]);

      await assertTokenBalances(accounts[0], {
        balance0: eth(10).sub(eth(1)).sub(eth(0.1)).add(eth(0.09)),
        balance1: eth(10).sub(eth(2)).sub(eth(0.2)).add(eth(0.18))
      });

      await assertReserves({
        reserve0: eth(1).add(eth(0.1)).sub(eth(0.09)),
        reserve1: eth(2).add(eth(0.2)).sub(eth(0.18))
      });
    });

    it('should fail when K is decreased', async () => {
      await token0.transfer(pairInstance.address, eth(1));
      await token1.transfer(pairInstance.address, eth(2));
      await pairInstance.mint(accounts[0]);

      await token0.transfer(pairInstance.address, eth(0.1));

      await expectRevert(pairInstance.swap(eth(0), eth(0.36), accounts[0]), 'New product of reserves is less than previous');

      await assertTokenBalances(accounts[0], {
        balance0: eth(10).sub(eth(1)).sub(eth(0.1)),
        balance1: eth(10).sub(eth(2))
      });

      await assertReserves({
        reserve0: eth(1),
        reserve1: eth(2)
      });
    });

    it('should fail when given amount is greater than reserve', async () => {
      await token0.transfer(pairInstance.address, eth(1));
      await token1.transfer(pairInstance.address, eth(2));
      await pairInstance.mint(accounts[0]);

      await expectRevert(pairInstance.swap(eth(0), eth(2.1), accounts[0]), 'Output amount is greater than reserve');
      await expectRevert(pairInstance.swap(eth(1.1), eth(0), accounts[0]), 'Output amount is greater than reserve');
    });

    it('should fail when given amounts are zero', async () => {
      await token0.transfer(pairInstance.address, eth(1));
      await token1.transfer(pairInstance.address, eth(2));
      await pairInstance.mint(accounts[0]);

      await expectRevert(pairInstance.swap(eth(0), eth(0), accounts[0]), 'Zero output amounts');
    });
  });
});
