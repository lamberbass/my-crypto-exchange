import FactoryCompiled from '../artifacts/Factory.json';
import { ERC20Mock } from '../../types/web3-v1-contracts';
import { getContractOfToken, tokenAddresses } from './tokens.service';
import { eth } from '../utils/amount-helper';
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
export type GetReservesResponse = { reserveA: string, reserveB: string };

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

export async function getPrice(
  tokenA: string,
  tokenB: string,
): Promise<string> {
  if (!libraryContract) {
    await initLibraryContract();
  }

  const reserves: GetReservesResponse = await getReserves(tokenA, tokenB);

  console.log('quote request', { tokenA, tokenB });

  const response = await libraryContract.methods.quote(
    eth(1),
    reserves.reserveB,
    reserves.reserveA
  ).call({ from: currentAccount });

  console.log('quote response', response);

  return response;
}

export async function getReserves(
  tokenA: string,
  tokenB: string,
): Promise<GetReservesResponse> {
  if (!libraryContract) {
    await initLibraryContract();
  }

  const factoryAddress: string = await getContractAddress(FactoryCompiled);

  console.log('getReserves request', { tokenA, tokenB });

  const response: GetReservesResponse = await libraryContract.methods.getReserves(
    factoryAddress,
    tokenAddresses[tokenA],
    tokenAddresses[tokenB]
  ).call({ from: currentAccount });

  console.log('getReserves response', response);
  return response;
}