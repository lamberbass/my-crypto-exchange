import { AbiItem } from 'web3-utils';
import ERC20MockCompiled from '../artifacts/ERC20Mock.json';
import Tokens from '../artifacts/deployed-tokens.json';
import { ERC20Mock } from '../../types/web3-v1-contracts';
import { eth } from '../utils/amount-helper';
import { currentAccount } from './cache.service';

export type TokenBalances = { [token: string]: string };
export type TokenAddresses = { [token: string]: string };
export const tokenAddresses: TokenAddresses = Tokens;

export async function getTokenBalances(): Promise<TokenBalances> {
  const tokens: string[] = Object.keys(tokenAddresses);

  const promises: Array<Promise<string>> = tokens.map((token: string) => getTokenBalance(token));

  const balancesArray: string[] = await Promise.all(promises);

  return balancesArray.reduce(
    (result, balance, index) => {
      const token: string = tokens[index];
      return { ...result, [token]: balance }
    },
    {} as TokenBalances
  );
}

export async function getTokenBalance(token: string): Promise<string> {
  const contract: ERC20Mock = getContractOfToken(tokenAddresses[token]);
  const balance: string = await contract.methods.balanceOf(currentAccount).call({ from: currentAccount });
  console.log(`Balance of token ${token}:`, balance);
  return balance

}

export async function mintTokensWithZeroBalance(): Promise<void> {
  let balances: TokenBalances = await getTokenBalances();
  console.log('balances before minting', balances);

  const amountToMint: BN = eth(1000);

  const addressesToMint: string[] = Object.keys(tokenAddresses)
    .filter((token: string) => !eth(balances[token]).isZero())
    .map((token: string) => tokenAddresses[token]);

  if (addressesToMint.length === 0) {
    return;
  }

  await mintTokens(amountToMint, addressesToMint);

  balances = await getTokenBalances();
  console.log('balances after minting', balances);
}

export function getContractOfToken(tokenAddress: string): ERC20Mock {
  return new web3.eth.Contract(ERC20MockCompiled.abi as AbiItem[], tokenAddress) as unknown as ERC20Mock;
}

async function mintTokens(amountToMint: number | string | BN, tokenAddresses: string[]): Promise<void> {
  const promises: Array<PromiEvent<TransactionReceipt>> = tokenAddresses.map((address: string) => {
    const contract: ERC20Mock = getContractOfToken(address);
    return contract.methods.mint(amountToMint, currentAccount).send({ from: currentAccount })
  });

  await Promise.all(promises);
}
