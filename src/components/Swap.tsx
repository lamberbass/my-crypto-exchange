import { useState } from 'react';
import { getInputAmount, getOutputAmount, swapExactTokensForTokens, swapTokensForExactTokens } from '../services/swap.service';
import { eth, ethString } from '../utils/amount-helper';
import { useDebouncedEffect } from '../utils/debounce';
import Pair from './Pair';
import './Swap.css';
import { toast } from 'react-toastify';

function Swap() {
  const [tokenA, setTokenA] = useState('ETH');
  const [tokenB, setTokenB] = useState('USDC');
  const [amountA, setAmountA] = useState('0.0');
  const [amountB, setAmountB] = useState('0.0');
  const [slippage, setSlippage] = useState('0.5');
  const [swapExactMode, setSwapExactMode] = useState(true);
  const [inProgress, setInProgress] = useState(false);

  const canSwap = () => (+amountA !== 0 || +amountB !== 0);

  const changedAmountA = (newAmountA: string) => {
    setSwapExactMode(true);
    setAmountA(newAmountA);
  }

  const changedAmountB = (newAmountB: string) => {
    setSwapExactMode(false);
    setAmountB(newAmountB);
  }

  const getMinAmount = (amount: string) => (100 - +slippage) / 100 * +amount;
  const getMaxAmount = (amount: string) => (100 + +slippage) / 100 * +amount;

  const amountOut = async () => {
    if (+amountA === 0 || !swapExactMode) {
      return;
    }

    const outAmount: string = await getOutputAmount(tokenA, tokenB, eth(amountA).toString());
    setAmountB(ethString(outAmount));
  };

  useDebouncedEffect(amountOut, [amountA, tokenA, tokenB], 500);

  const amountIn = async () => {
    if (+amountB === 0 || swapExactMode) {
      return;
    }

    const inAmount: string = await getInputAmount(tokenA, tokenB, eth(amountB).toString());
    setAmountA(ethString(inAmount));
  };

  useDebouncedEffect(amountIn, [amountB, tokenA, tokenB], 500);

  const swap = async () => {
    setInProgress(true);

    try {
      let amounts: string[];

      if (swapExactMode) {
        amounts = await swapExactTokensForTokens(
          tokenA,
          tokenB,
          eth(amountA).toString(),
          eth(getMinAmount(amountB)).toString()
        );
      } else {
        amounts = await swapTokensForExactTokens(
          tokenA,
          tokenB,
          eth(amountB).toString(),
          eth(getMaxAmount(amountA)).toString()
        );
      }

      toast.success(`Successfully swapped ${ethString(amounts[0])} ${tokenA} for ${ethString(amounts[1])} ${tokenB}!`);
    } catch {
      toast.error('Swap failed!');
    }

    setInProgress(false);
  }

  return (
    <div className="Swap-container mt-5 mx-auto p-4 rounded-lg bg-dark-gray">
      <h1 className="mb-4 text-2xl">Swap</h1>

      <Pair
        tokenA={tokenA}
        setTokenA={setTokenA}
        tokenB={tokenB}
        setTokenB={setTokenB}
        amountA={amountA}
        setAmountA={changedAmountA}
        amountB={amountB}
        setAmountB={changedAmountB}
        slippage={slippage}
        setSlippage={setSlippage}
      />

      {
        canSwap()
          ? <div className="mt-5 text-gray-400 italic">
            {
              swapExactMode
                ?
                <div className="flex justify-between items-end">
                  <div><div>Minimum received</div><div>after slippage {slippage}%</div></div>
                  <div>~{(getMinAmount(amountB).toString())} {tokenB}</div>
                </div>
                :
                <div className="flex justify-between items-end">
                  <div><div>Maximum sent</div><div>after slippage {slippage}%</div></div>
                  <div>~{(getMaxAmount(amountA).toString())} {tokenA}</div>
                </div>
            }
          </div>
          : ''
      }

      <button
        type="button"
        className="btn-default w-full mt-6"
        onClick={swap}
        disabled={!canSwap() || inProgress}
      >
        Swap
      </button>
    </div>
  );
}

export default Swap;
