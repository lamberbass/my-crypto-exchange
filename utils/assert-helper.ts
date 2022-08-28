import { ERC20MockInstance, PairInstance } from "../types/truffle-contracts";

export class AssertHelper {
  public static async assertEqual(actual: Promise<BN>, expected: BN) {
    assert.equal((await actual).toString(), expected.toString());
  }

  public static async assertLpBalanceAndTotalSupply(
    pairInstance: PairInstance,
    account: string,
    expected: { balance: BN, totalSupply: BN }
  ) {
    await AssertHelper.assertEqual(pairInstance.balanceOf(account), expected.balance);
    await AssertHelper.assertEqual(pairInstance.totalSupply(), expected.totalSupply);
  }

  public static async assertReserves(
    pairInstance: PairInstance,
    expected: { reserve0: BN, reserve1: BN }
  ) {
    await AssertHelper.assertEqual(pairInstance.reserve0(), expected.reserve0);
    await AssertHelper.assertEqual(pairInstance.reserve1(), expected.reserve1);
  }

  public static async assertTokenBalances(
    token0: ERC20MockInstance,
    token1: ERC20MockInstance,
    account: string,
    expected: { balance0: BN, balance1: BN }
  ) {
    await AssertHelper.assertEqual(token0.balanceOf(account), expected.balance0);
    await AssertHelper.assertEqual(token1.balanceOf(account), expected.balance1);
  }
}

