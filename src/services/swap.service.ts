import FactoryCompiled from '../artifacts/Factory.json';
import { ERC20Mock } from '../../types/web3-v1-contracts';
import { getContractOfToken, tokenAddresses } from './tokens.service';
import { getContractAddress } from './web3.service';
import {
  routerContract,
  initRouterContract,
  routerAddress,
  libraryContract,
  initLibraryContract,
  currentAccount
} from './cache.service';

export type AddLiquidityResponse = { amountA: string, amountB: string, liquidity: string };
export type RemoveLiquidityResponse = { amountA: string, amountB: string };

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