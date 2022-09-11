import Web3 from 'web3';
import RouterCompiled from '../artifacts/Router.json';
import ERC20MockCompiled from '../artifacts/ERC20Mock.json';
import LibraryCompiled from '../artifacts/Library.json';
import FactoryCompiled from '../artifacts/Factory.json';

import Tokens from '../artifacts/deployed-tokens.json';
import { ERC20Mock, Library, Router } from '../../types/web3-v1-contracts';
import { AbiItem } from "web3-utils";
import { eth } from '../utils/amount-helper';

export type TokenBalances = { [token: string]: string };
export type AddLiquidityResponse = { amountA: string, amountB: string, liquidity: string };
export type RemoveLiquidityResponse = { amountA: string, amountB: string };

type TokenAddresses = { [token: string]: string };
const tokenAddresses: TokenAddresses = Tokens;

let web3: Web3;
let currentAccount: string;

let libraryContract: Library;
let routerContract: Router;
let routerAddress: string;

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

  const contractTokenA: ERC20Mock = getContractOfToken(tokenAddresses[tokenA]);
  const contractTokenB: ERC20Mock = getContractOfToken(tokenAddresses[tokenB]);

  await contractTokenA.methods.approve(routerAddress, amountA).send({ from: currentAccount });
  await contractTokenB.methods.approve(routerAddress, amountB).send({ from: currentAccount });

  const contractMethod = routerContract.methods.addLiquidity(
    tokenAddresses[tokenA],
    tokenAddresses[tokenB],
    amountA,
    amountB,
    minAmountA,
    minAmountB,
    currentAccount
  );

  console.log('addLiquidity request', { tokenA, tokenB, amountA, amountB, minAmountA, minAmountB });
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
    tokenAddresses[tokenA],
    tokenAddresses[tokenB],
    liquidity,
    minAmountA,
    minAmountB,
    currentAccount
  );

  console.log('removeLiquidity request', { tokenA, tokenB, liquidity, minAmountA, minAmountB });
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

  const contractTokenA: ERC20Mock = getContractOfToken(tokenAddresses[tokenA]);
  await contractTokenA.methods.approve(routerAddress, amountA).send({ from: currentAccount });

  const contractMethod = routerContract.methods.swapExactTokensForTokens(
    amountA,
    minAmountB,
    [
      tokenAddresses[tokenA],
      tokenAddresses[tokenB]
    ],
    currentAccount
  );

  console.log('swapExactTokensForTokens request', { tokenA, tokenB, amountA, minAmountB });
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

  const contractTokenA: ERC20Mock = getContractOfToken(tokenAddresses[tokenA]);
  await contractTokenA.methods.approve(routerAddress, maxAmountA).send({ from: currentAccount });

  const contractMethod = routerContract.methods.swapTokensForExactTokens(
    amountB,
    maxAmountA,
    [
      tokenAddresses[tokenA],
      tokenAddresses[tokenB]
    ],
    currentAccount
  );

  console.log('swapTokensForExactTokens request', { tokenA, tokenB, amountB, maxAmountA });
  const response: string[] = await contractMethod.call({ from: currentAccount });
  console.log('swapTokensForExactTokens response', response);

  const receipt: TransactionReceipt = await contractMethod.send({ from: currentAccount });
  console.log('swapTokensForExactTokens receipt', receipt);

  return response;
}

export async function mintTokensWithZeroBalance(): Promise<void> {
  let balances: TokenBalances = await getTokenBalances();
  console.log('balances before minting', balances);

  const amountToMint: BN = eth(1000);

  const addressesToMint: string[] = Object.keys(tokenAddresses)
    .filter((token: string) => eth(balances[token]).isZero())
    .map((token: string) => tokenAddresses[token]);

  if (addressesToMint.length === 0) {
    return;
  }

  await mintTokens(amountToMint, addressesToMint);

  balances = await getTokenBalances();
  console.log('balances after minting', balances);
}

export async function getTokenBalances(): Promise<TokenBalances> {
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

export async function getOutputAmount(
  tokenA: string,
  tokenB: string,
  amountA: number | string | BN
): Promise<string> {
  if (!libraryContract) {
    await initLibraryContract();
  }

  const factoryAddress: string = await getContractAddress(FactoryCompiled);

  console.log('getOutputAmount request', { tokenA, tokenB, amountA });

  const response: string[] = await libraryContract.methods.getAmountsOut(
    factoryAddress,
    amountA,
    [
      tokenAddresses[tokenA],
      tokenAddresses[tokenB]
    ]
  ).call({ from: currentAccount });

  console.log('getOutputAmount response', response);
  return response[response.length - 1];
}

export async function getInputAmount(
  tokenA: string,
  tokenB: string,
  amountB: number | string | BN
): Promise<string> {
  if (!libraryContract) {
    await initLibraryContract();
  }

  const factoryAddress: string = await getContractAddress(FactoryCompiled);

  console.log('getInputAmount request', { tokenA, tokenB, amountB });

  const response: string[] = await libraryContract.methods.getAmountsIn(
    factoryAddress,
    amountB,
    [
      tokenAddresses[tokenA],
      tokenAddresses[tokenB]
    ]
  ).call({ from: currentAccount });

  console.log('getInputAmount response', response);
  return response[0];
}

async function initRouterContract(): Promise<void> {
  routerAddress = await getContractAddress(RouterCompiled);
  routerContract = await getContract<Router>(RouterCompiled);
}

async function initLibraryContract(): Promise<void> {
  libraryContract = await getContract<Library>(LibraryCompiled);
}

async function getContract<T>(contractJson: any): Promise<T> {
  const address: string = await getContractAddress(contractJson);
  return new web3.eth.Contract(contractJson.abi as AbiItem[], address) as unknown as T;
}

async function getContractAddress(contractJson: any): Promise<string> {
  const networkId: number = await web3.eth.net.getId();
  const deployedNetwork: any = contractJson.networks[networkId];
  if (!deployedNetwork) {
    throw new Error(`Contract ${contractJson.contractName} not deployed to detected network.`);
  }

  return deployedNetwork.address;
}

async function mintTokens(amountToMint: number | string | BN, tokenAddresses: string[]): Promise<void> {
  const promises: Array<PromiEvent<TransactionReceipt>> = tokenAddresses.map((address: string) => {
    const contract: ERC20Mock = getContractOfToken(address);
    return contract.methods.mint(amountToMint, currentAccount).send({ from: currentAccount })
  });

  await Promise.all(promises);
}

function getContractOfToken(tokenAddress: string): ERC20Mock {
  return new web3.eth.Contract(ERC20MockCompiled.abi as AbiItem[], tokenAddress) as unknown as ERC20Mock;
}
