import './App.css';
import { useEffect, useState } from 'react';
import {
  addLiquidity,
  getCurrentAccount,
  getTokenBalances,
  mintTokensWithZeroBalance,
  removeLiquidity,
  swapExactTokensForTokens,
  swapTokensForExactTokens
} from './services/web3.service';
import Tokens from './artifacts/deployed-tokens.json';
import { eth } from './utils/amount-helper';

function App() {
  const [currentAccount, setCurrentAccount] = useState('');

  const slippageTolerance: number = 50;
  const getMinAmount = (amount: number): number => amount * (100 - slippageTolerance) / 100;

  const connectWallet = async () => {
    const account: string = await getCurrentAccount();
    setCurrentAccount(account);
  };

  useEffect(() => { connectWallet(); }, []);

  const addLiq = async () => {
    const tokenA: string = Tokens.ETH;
    const tokenB: string = Tokens.USDC;

    const amountA: number = 100;
    const amountB: number = 100;

    await addLiquidity(
      tokenA,
      tokenB,
      eth(amountA),
      eth(amountB),
      eth(getMinAmount(amountA)),
      eth(getMinAmount(amountB))
    );
  };

  const removeLiq = async () => {
    const tokenA: string = Tokens.ETH;
    const tokenB: string = Tokens.USDC;

    const liquidity: number = 100;
    const minAmountA: number = 10;
    const minAmountB: number = 10;

    await removeLiquidity(
      tokenA,
      tokenB,
      eth(liquidity),
      eth(minAmountA),
      eth(minAmountB)
    );
  };

  const swap = async () => {
    const tokenA: string = Tokens.ETH;
    const tokenB: string = Tokens.USDC;

    const amountA: number = 100;
    const minAmountB: number = 50;

    await swapExactTokensForTokens(
      tokenA,
      tokenB,
      eth(amountA),
      eth(minAmountB)
    );
  };

  const reverseSwap = async () => {
    const tokenA: string = Tokens.ETH;
    const tokenB: string = Tokens.USDC;

    const amountB: number = 50;
    const maxAmountA: number = 150;

    await swapTokensForExactTokens(
      tokenA,
      tokenB,
      eth(amountB),
      eth(maxAmountA)
    );
  };

  const getBalances = async () => {
    console.log('balances', await getTokenBalances());
  };

  const mint = async () => {
    await mintTokensWithZeroBalance();
  };

  return (
    <div>
      <header className="App-header">
        <h1>Welcome to My Crypto Exchange!</h1>

        {!currentAccount
          ? <div>Connecting to Metamask wallet...</div>
          : <div>Selected Account: <span>{currentAccount}</span></div>
        }

        <div className="App-buttons">
          <button type="button" onClick={getBalances}>Get balances</button>
          <button type="button" onClick={mint}>Mint tokens with zero balance</button>
          <button type="button" onClick={addLiq}>Add liquidity</button>
          <button type="button" onClick={removeLiq}>Remove liquidity</button>
          <button type="button" onClick={swap}>Swap exact tokens for tokens</button>
          <button type="button" onClick={reverseSwap}>Swap tokens for exact tokens</button>
        </div>

        <img src="mule.svg" className="App-logo" alt="logo" />
      </header>
    </div>
  );
}

export default App;
