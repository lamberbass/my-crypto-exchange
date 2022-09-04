import './App.css';
import { useEffect, useState } from 'react';
import { addLiquidity, getCurrentAccount, getTokenBalances, mintTokensWithZeroBalance, swapExactTokensForTokens } from './services/web3.service';
import Tokens from './artifacts/deployed-tokens.json';

function App() {
  const [currentAccount, setCurrentAccount] = useState('');

  const connectWallet = async () => {
    const account: string = await getCurrentAccount();
    setCurrentAccount(account);
  };

  useEffect(() => { connectWallet(); }, []);

  const addLiq = async () => {
    const tokenA: string = Tokens.LINK;
    const tokenB: string = Tokens.SHIB;

    const amountTokenA: string = web3.utils.toWei('100', 'ether');
    const amountTokenB: string = web3.utils.toWei('100', 'ether');
    const minAmountTokenA: string = web3.utils.toWei('1', 'ether');
    const minAmountTokenB: string = web3.utils.toWei('1', 'ether');

    await addLiquidity(
      tokenA,
      tokenB,
      amountTokenA,
      amountTokenB,
      minAmountTokenA,
      minAmountTokenB
    );
  };

  const swap = async () => {
    const tokenA: string = Tokens.LINK;
    const tokenB: string = Tokens.SHIB;

    const amountTokenA: string = web3.utils.toWei('10', 'ether');
    const minAmountTokenB: string = web3.utils.toWei('1', 'ether');

    await swapExactTokensForTokens(
      tokenA,
      tokenB,
      amountTokenA,
      minAmountTokenB
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
          <button type="button" onClick={swap}>Swap exact tokens for tokens</button>
        </div>

        <img src="mule.svg" className="App-logo" alt="logo" />
      </header>
    </div>
  );
}

export default App;
