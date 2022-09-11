import './App.css';
import { useEffect, useState } from 'react';
import {
  addLiquidity,
  getCurrentAccount,
  getInputAmount,
  getOutputAmount,
  getTokenBalances,
  mintTokensWithZeroBalance,
  removeLiquidity,
  swapExactTokensForTokens,
  swapTokensForExactTokens
} from './services/web3.service';
import Tokens from './artifacts/deployed-tokens.json';
import { eth, wei } from './utils/amount-helper';

function App() {
  const [currentAccount, setCurrentAccount] = useState('');
  const [tokenA, setTokenA] = useState('ETH');
  const [tokenB, setTokenB] = useState('USDC');
  const [amountA, setAmountA] = useState('1');
  const [amountB, setAmountB] = useState('1');
  const [slippage, setSlippage] = useState(50);

  const tokens: string[] = Object.keys(Tokens);

  const getMinAmount = (amount: number): number => amount * (100 - slippage) / 100;

  const connectWallet = async () => {
    const account: string = await getCurrentAccount();
    setCurrentAccount(account);
  };

  useEffect(() => { connectWallet(); }, []);

  const addLiq = async () => {
    await addLiquidity(
      tokenA,
      tokenB,
      eth(amountA).toString(),
      eth(amountB).toString(),
      eth(getMinAmount(+amountA)).toString(),
      eth(getMinAmount(+amountB)).toString()
    );
  };

  const removeLiq = async () => {
    await removeLiquidity(
      tokenA,
      tokenB,
      eth(100).sub(wei(1000)).toString(),
      eth(10).toString(),
      eth(10).toString()
    );
  };

  const swap = async () => {
    await swapExactTokensForTokens(
      tokenA,
      tokenB,
      eth(amountA).toString(),
      eth(amountA).mul(eth(0.5)).toString()
    );
  };

  const reverseSwap = async () => {
    await swapTokensForExactTokens(
      tokenA,
      tokenB,
      eth(amountB).toString(),
      eth(amountB).mul(eth(2)).toString()
    );
  };

  const getBalances = async () => {
    console.log('balances', await getTokenBalances());
  };

  const mint = async () => {
    await mintTokensWithZeroBalance();
  };

  const amountOut = async () => {
    await getOutputAmount(
      tokenA,
      tokenB,
      eth(amountA).toString()
    );
  };

  const amountIn = async () => {
    await getInputAmount(
      tokenA,
      tokenB,
      eth(amountB).toString()
    );
  };

  return (
    <div className="App-header">
      <h1 >Welcome to My Crypto Exchange!</h1>

      {!currentAccount
        ? <div>Connecting to Metamask wallet...</div>
        : <div>Selected Account: <span>{currentAccount}</span></div>
      }

      <div className="App-form">
        <div>
          <label>Token A</label>
          <select name="tokens" id="tokens" defaultValue={tokenA} onChange={e => setTokenA(e.target.value)}>
            {tokens.filter(token => token !== tokenB).map(token => <option key={token} value={token}>{token}</option>)}
          </select>
        </div>

        <div>
          <label>Token B</label>
          <select name="tokens" id="tokens" defaultValue={tokenB} onChange={e => setTokenB(e.target.value)}>
            {tokens.filter(token => token !== tokenA).map(token => <option key={token} value={token}>{token}</option>)}
          </select>
        </div>

        <div>
          <label>Amount A</label>
          <input type="text" value={amountA} onChange={e => setAmountA(e.target.value)}></input>
        </div>

        <div>
          <label>Amount B</label>
          <input type="text" value={amountB} onChange={e => setAmountB(e.target.value)}></input>
        </div>

        <div>
          <label>Slippage %</label>
          <input type="text" value={slippage} onChange={e => setSlippage(+e.target.value)}></input>
        </div>
      </div>

      <div className="App-buttons">
        <div>
          <button type="button" className="round-button" onClick={getBalances}>Get balances</button>
          <button type="button" className="round-button" onClick={mint}>Mint tokens with zero balance</button>
        </div>
        <div>
          <button type="button" className="round-button" onClick={addLiq}>Add liquidity</button>
          <button type="button" className="round-button" onClick={removeLiq}>Remove liquidity</button>
        </div>
        <div>
          <button type="button" className="round-button" onClick={amountOut}>Get output amount</button>
          <button type="button" className="round-button" onClick={swap}>Swap exact tokens for tokens</button>
        </div>
        <div>
          <button type="button" className="round-button" onClick={amountIn}>Get input amount</button>
          <button type="button" className="round-button" onClick={reverseSwap}>Swap tokens for exact tokens</button>
        </div>
      </div>

      <img src="mule.svg" className="App-logo" alt="logo" />
    </div>
  );
}

export default App;
