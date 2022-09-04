import Web3 from 'web3';
import Router from '../artifacts/Router.json';
import ERC20Mock from '../artifacts/ERC20Mock.json';
import Tokens from '../artifacts/deployed-tokens.json';

let web3: Web3;
let currentAccount: string;
let routerContract: any;

type TokenAddresses = { [token: string]: string };
export type TokenBalances = { [token: string]: string };
export type AddLiquidityResponse = { amountA: string, amountB: string, liquidity: string };

export async function getCurrentAccount(): Promise<string> {
  const ethereum = (window as any).ethereum;

  if (!ethereum || !ethereum.request) {
    throw new Error('Could not get connected accounts. Please install MetaMask.');
  }

  web3 = new Web3(ethereum);
  (window as any).web3 = web3;

  const accounts: string[] = await ethereum.request({
    method: 'eth_requestAccounts',
  });

  currentAccount = accounts[0];
  return currentAccount;
};

export async function addLiquidity(
  tokenA: string,
  tokenB: string,
  amountTokenA: string,
  amountTokenB: string,
  minAmountTokenA: string,
  minAmountTokenB: string
): Promise<AddLiquidityResponse> {
  if (!routerContract) {
    await initRouterContract();
  }

  const contractTokenA = getContractOfToken(tokenA);
  const contractTokenB = getContractOfToken(tokenB);

  await contractTokenA.methods.approve(routerContract._address, amountTokenA).send({ from: currentAccount });
  await contractTokenB.methods.approve(routerContract._address, amountTokenB).send({ from: currentAccount });

  const contractMethod = routerContract.methods.addLiquidity(
    tokenA,
    tokenB,
    amountTokenA,
    amountTokenB,
    minAmountTokenA,
    minAmountTokenB,
    currentAccount
  );

  const response: AddLiquidityResponse = await contractMethod.call({ from: currentAccount });
  console.log('addLiquidity response', response);

  const receipt = await contractMethod.send({ from: currentAccount });
  console.log('addLiquidity receipt', receipt);

  return response;
}

export async function swapExactTokensForTokens(
  tokenA: string,
  tokenB: string,
  amountTokenA: string,
  minAmountTokenB: string
): Promise<string[]> {
  if (!routerContract) {
    await initRouterContract();
  }

  const contractTokenA = getContractOfToken(tokenA);
  await contractTokenA.methods.approve(routerContract._address, amountTokenA).send({ from: currentAccount });

  const contractMethod = routerContract.methods.swapExactTokensForTokens(
    amountTokenA,
    minAmountTokenB,
    [tokenA, tokenB],
    currentAccount
  );

  const response: string[] = await contractMethod.call({ from: currentAccount });
  console.log('swapExactTokensForTokens response', response);

  const receipt = await contractMethod.send({ from: currentAccount });
  console.log('swapExactTokensForTokens receipt', receipt);

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
    const contract = getContractOfToken(tokenAddresses[token]);
    return contract.methods.balanceOf(currentAccount).call({ from: currentAccount });
  });

  const balancesArray: string[] = await Promise.all(promises);

  return balancesArray.reduce(
    (result, balance, index) => {
      const token: string = tokens[index];
      return { ...result, [token]: balance }
    },
    {} as { [token: string]: string }
  );
}

async function initRouterContract(): Promise<void> {
  const networkId: number = await web3.eth.net.getId();
  const routerInstance = (Router as any).networks[networkId];
  if (!routerInstance) {
    throw new Error('Router contract not deployed to detected network.');
  }

  routerContract = new web3.eth.Contract((Router as any).abi, routerInstance.address);
}

async function mintTokens(amountToMint: string, tokenAddresses: string[]): Promise<void> {
  const promises: Array<Promise<string>> = tokenAddresses.map((address: string) => {
    const contract = getContractOfToken(address);
    return contract.methods.mint(amountToMint, currentAccount).send({ from: currentAccount })
  });

  await Promise.all(promises);
}

function getContractOfToken(tokenAddress: string) {
  return new web3.eth.Contract((ERC20Mock as any).abi, tokenAddress);
}