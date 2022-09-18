import { useState } from 'react';
import { removeLiquidity, quoteBeforeRemovingLiquidity } from '../services/liquidity.service';
import { eth, ethString } from '../utils/amount-helper';
import Tokens from '../artifacts/deployed-tokens.json';
import { useDebouncedEffect } from '../utils/debounce';
import { toast } from 'react-toastify';

function RemoveLiquidity() {
  const [tokenA, setTokenA] = useState('ETH');
  const [tokenB, setTokenB] = useState('USDC');
  const [percentage, setPercentage] = useState('50');
  const [outAmountA, setOutAmountA] = useState('0');
  const [outAmountB, setOutAmountB] = useState('0');
  const [liquidity, setLiquidity] = useState('0');
  const [inProgress, setInProgress] = useState(false);

  const tokens: string[] = Object.keys(Tokens);
  const canRemoveLiq = () => +outAmountA !== 0 || +outAmountB !== 0 || +percentage !== 0;

  const removeLiq = async () => {
    setInProgress(true);

    try {
      await removeLiquidity(
        tokenA,
        tokenB,
        liquidity,
        outAmountA,
        outAmountB
      );

      toast.success(`Successfully removed ${percentage}% of liquidity!`);
    } catch {
      toast.error('Remove liquidity failed!');
    }

    setInProgress(false);
  };

  const quote = async () => {
    const response = await quoteBeforeRemovingLiquidity(
      tokenA,
      tokenB,
      percentage
    );

    setOutAmountA(response.amountA);
    setOutAmountB(response.amountB);
    setLiquidity(response.lpTokensToRemove);
  };

  useDebouncedEffect(quote, [percentage, tokenA, tokenB], 500);

  return (
    <div className="dark-container">
      <div className="flex justify-between">
        <h1 className="text-2xl">Remove Liquidity</h1>

        <div className="flex justify-end text-lg">
          <select className="form-select ml-4" name="tokens" id="tokens" value={tokenA} onChange={e => setTokenA(e.target.value)}>
            {tokens.filter(token => token !== tokenB).map(token => <option key={token} value={token}>{token}</option>)}
          </select>
          <select className="form-select ml-4" name="tokens" id="tokens" value={tokenB} onChange={e => setTokenB(e.target.value)}>
            {tokens.filter(token => token !== tokenA).map(token => <option key={token} value={token}>{token}</option>)}
          </select>
        </div>
      </div>

      <div className="gray-container p-3 mt-4">
        <div className="block mb-4 text-2xl text-center text-gray-200">Amount</div>
        <label htmlFor="amount" className="block mb-4 text-6xl text-center text-gray-200">{percentage}%</label>

        <input
          id="amount"
          type="range"
          min="0"
          max="100"
          value={percentage}
          onChange={e => setPercentage(e.target.value)}
          className="w-full h-1 mb-5 bg-gray-200 rounded-lg appearance-none cursor-pointer range-sm"
        />
      </div>

      <div className="p-3 mt-3 text-md">
        <div className="flex justify-between">
          <div>Pooled {tokenA}:</div>
          <div>{ethString(outAmountA)}</div>
        </div>

        <div className="flex justify-between mt-1.5">
          <div>Pooled {tokenB}:</div>
          <div>{ethString(outAmountB)}</div>
        </div>
      </div>

      <div className="flex flex-col mt-2">
        <div className="flex justify-center items-center">
          <button
            type="button"
            className="btn-default w-full"
            onClick={removeLiq}
            disabled={!canRemoveLiq() || inProgress}
          >
            Remove liquidity
          </button>
        </div>
      </div>
    </div>
  );
}

export default RemoveLiquidity;
