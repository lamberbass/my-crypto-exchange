import Web3 from 'web3';
import RouterCompiled from '../artifacts/Router.json';
import ERC20MockCompiled from '../artifacts/ERC20Mock.json';
import Tokens from '../artifacts/deployed-tokens.json';
import { ERC20Mock, Router } from '../../types/web3-v1-contracts';
import { AbiItem } from "web3-utils";

let web3: Web3;
let currentAccount: string;
let routerContract: Router;
let routerAddress: string;

type TokenAddresses = { [token: string]: string };
export type TokenBalances = { [token: string]: string };
export type AddLiquidityResponse = { amountA: string, amountB: string, liquidity: string };
export type RemoveLiquidityResponse = { amountA: string, amountB: string };

export async function getCurrentAccount(): Promise<string> {
  if (!window.ethereum || !window.ethereum.request) {
    throw new Error('Could not get connected accounts. Please install MetaMask.');
  }

  web3 = new Web3(window.ethereum);
  window.web3 = web3;

  const accounts: string[] = await window.ethereum.request({
    method: 'eth_requestAccounts',
  });

  currentAccount = accounts[0];
  return currentAccount;
};

export async function addLiquidity(
  tokenA: string,
  tokenB: string,
  amountA: number | string | BN,
  amountB: number | string | BN,
  minAmountA: number | string | BN,
  minAmountB: number | string | BN
): Promise<AddLiquidityResponse> {
  if (!routerContract) {
    await initRouterContract();
  }

  const contractTokenA: ERC20Mock = getContractOfToken(tokenA);
  const contractTokenB: ERC20Mock = getContractOfToken(tokenB);

  await contractTokenA.methods.approve(routerAddress, amountA).send({ from: currentAccount });
  await contractTokenB.methods.approve(routerAddress, amountB).send({ from: currentAccount });

  const contractMethod = routerContract.methods.addLiquidity(
    tokenA,
    tokenB,
    amountA,
    amountB,
    minAmountA,
    minAmountB,
    currentAccount
  );

  const response: AddLiquidityResponse = await contractMethod.call({ from: currentAccount });
  console.log('addLiquidity response', response);

  const receipt: TransactionReceipt = await contractMethod.send({ from: currentAccount });
  console.log('addLiquidity receipt', receipt);

  return response;
}

export async function removeLiquidity(
  tokenA: string,
  tokenB: string,
  liquidity: number | string | BN,
  minAmountA: number | string | BN,
  minAmountB: number | string | BN
): Promise<RemoveLiquidityResponse> {
  if (!routerContract) {
    await initRouterContract();
  }

  const contractMethod = routerContract.methods.removeLiquidity(
    tokenA,
    tokenB,
    liquidity,
    minAmountA,
    minAmountB,
    currentAccount
  );

  const response: RemoveLiquidityResponse = await contractMethod.call({ from: currentAccount });
  console.log('removeLiquidity response', response);

  const receipt: TransactionReceipt = await contractMethod.send({ from: currentAccount });
  console.log('removeLiquidity receipt', receipt);

  return response;
}

export async function swapExactTokensForTokens(
  tokenA: string,
  tokenB: string,
  amountA: number | string | BN,
  minAmountB: number | string | BN
): Promise<string[]> {
  if (!routerContract) {
    await initRouterContract();
  }

  const contractTokenA: ERC20Mock = getContractOfToken(tokenA);
  await contractTokenA.methods.approve(routerAddress, amountA).send({ from: currentAccount });

  const contractMethod = routerContract.methods.swapExactTokensForTokens(
    amountA,
    minAmountB,
    [tokenA, tokenB],
    currentAccount
  );

  const response: string[] = await contractMethod.call({ from: currentAccount });
  console.log('swapExactTokensForTokens response', response);

  const receipt: TransactionReceipt = await contractMethod.send({ from: currentAccount });
  console.log('swapExactTokensForTokens receipt', receipt);

  return response;
}

export async function swapTokensForExactTokens(
  tokenA: string,
  tokenB: string,
  amountB: number | string | BN,
  maxAmountA: number | string | BN
): Promise<string[]> {
  if (!routerContract) {
    await initRouterContract();
  }

  const contractTokenA: ERC20Mock = getContractOfToken(tokenA);
  await contractTokenA.methods.approve(routerAddress, maxAmountA).send({ from: currentAccount });

  const contractMethod = routerContract.methods.swapTokensForExactTokens(
    amountB,
    maxAmountA,
    [tokenA, tokenB],
    currentAccount
  );

  const response: string[] = await contractMethod.call({ from: currentAccount });
  console.log('swapTokensForExactTokens response', response);

  const receipt: TransactionReceipt = await contractMethod.send({ from: currentAccount });
  console.log('swapTokensForExactTokens receipt', receipt);

  return response;
}

export async function mintTokensWithZeroBalance(): Promise<void> {
  let balances: TokenBalances = await getTokenBalances();
  console.log('balances before minting', balances);

  const amountToMint: string = web3.utils.toWei('1000', 'ether');
  const tokenAddresses: TokenAddresses = Tokens;

  const addressesToMint: string[] = Object.keys(tokenAddresses)
    .filter((token: string) => web3.utils.toBN(balances[token]).isZero())
    .map((token: string) => tokenAddresses[token]);

  if (addressesToMint.length === 0) {
    return;
  }

  await mintTokens(amountToMint, addressesToMint);

  balances = await getTokenBalances();
  console.log('balances after minting', balances);
}

export async function getTokenBalances(): Promise<TokenBalances> {
  const tokenAddresses: TokenAddresses = Tokens;
  const tokens: string[] = Object.keys(tokenAddresses);

  const promises: Array<Promise<string>> = tokens.map((token: string) => {
    const contract: ERC20Mock = getContractOfToken(tokenAddresses[token]);
    return contract.methods.balanceOf(currentAccount).call({ from: currentAccount });
  });

  const balancesArray: string[] = await Promise.all(promises);

  return balancesArray.reduce(
    (result, balance, index) => {
      const token: string = tokens[index];
      return { ...result, [token]: balance }
    },
    {} as TokenAddresses
  );
}

async function initRouterContract(): Promise<void> {
  const networkId: number = await web3.eth.net.getId();
  const deployedNetwork: any = (RouterCompiled.networks as any)[networkId];
  if (!deployedNetwork) {
    throw new Error('Router contract not deployed to detected network.');
  }

  routerAddress = deployedNetwork.address;
  routerContract = new web3.eth.Contract(
    RouterCompiled.abi as AbiItem[],
    routerAddress
  ) as unknown as Router;
}

async function mintTokens(amountToMint: string, tokenAddresses: string[]): Promise<void> {
  const promises: Array<PromiEvent<TransactionReceipt>> = tokenAddresses.map((address: string) => {
    const contract: ERC20Mock = getContractOfToken(address);
    return contract.methods.mint(amountToMint, currentAccount).send({ from: currentAccount })
  });

  await Promise.all(promises);
}

function getContractOfToken(tokenAddress: string): ERC20Mock {
  return new web3.eth.Contract(ERC20MockCompiled.abi as AbiItem[], tokenAddress) as unknown as ERC20Mock;
}