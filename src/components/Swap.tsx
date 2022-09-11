import { useState } from 'react';
import { getInputAmount, getOutputAmount, swapExactTokensForTokens, swapTokensForExactTokens } from '../services/swap.service';
import { eth } from '../utils/amount-helper';
import Pair from './Pair';

function Swap() {
  const [tokenA, setTokenA] = useState('ETH');
  const [tokenB, setTokenB] = useState('USDC');
  const [amountA, setAmountA] = useState('1');
  const [amountB, setAmountB] = useState('1');
  const [slippage, setSlippage] = useState(50);

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

  const swapExact = async () => {
    await swapExactTokensForTokens(
      tokenA,
      tokenB,
      eth(amountA).toString(),
      eth(amountA).mul(eth(0.5)).toString()
    );
  };

  const swapForExact = async () => {
    await swapTokensForExactTokens(
      tokenA,
      tokenB,
      eth(amountB).toString(),
      eth(amountB).mul(eth(2)).toString()
    );
  };

  return (
    <div>
      <Pair
        tokenA={tokenA}
        setTokenA={setTokenA}
        tokenB={tokenB}
        setTokenB={setTokenB}
        amountA={amountA}
        setAmountA={setAmountA}
        amountB={amountB}
        setAmountB={setAmountB}
        slippage={slippage}
        setSlippage={setSlippage}
      />

      <div className="App-buttons">
        <div>
          <button type="button" onClick={amountOut}>Get output amount</button>
          <button type="button" onClick={swapExact}>Swap exact tokens for tokens</button>
        </div>
        <div>
          <button type="button" onClick={amountIn}>Get input amount</button>
          <button type="button" onClick={swapForExact}>Swap tokens for exact tokens</button>
        </div>
      </div>
    </div>
  );
}

export default Swap;
