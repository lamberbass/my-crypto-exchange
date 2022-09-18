import { useState } from 'react';
import { addLiquidity, getPrice } from '../services/liquidity.service';
import { eth, ethString } from '../utils/amount-helper';
import Token from './Token';
import Tokens from '../artifacts/deployed-tokens.json';
import { useDebouncedEffect } from '../utils/debounce';
import { toast } from 'react-toastify';

function AddLiquidity() {
  const [tokenA, setTokenA] = useState('ETH');
  const [tokenB, setTokenB] = useState('USDC');
  const [amountA, setAmountA] = useState('0.0');
  const [amountB, setAmountB] = useState('0.0');
  const [slippage, setSlippage] = useState('0.5');
  const [inProgress, setInProgress] = useState(false);

  const tokens: string[] = Object.keys(Tokens);
  const getMinAmount = (amount: number): number => amount * (100 - +slippage) / 100;
  const canAddLiq = () => +amountA !== 0 || +amountB !== 0;

  const [price, setPrice] = useState('');

  const getRatio = async () => {
    const price: string = await getPrice(tokenA, tokenB);
    setPrice(ethString(price));
  }

  useDebouncedEffect(getRatio, [tokenA, tokenB], 500);

  const addLiq = async () => {
    setInProgress(true);

    try {
      const response = await addLiquidity(
        tokenA,
        tokenB,
        eth(amountA).toString(),
        eth(amountB).toString(),
        eth(getMinAmount(+amountA)).toString(),
        eth(getMinAmount(+amountB)).toString()
      );

      toast.success(`Successfully added ${ethString(response.amountA)} ${tokenA} and ${ethString(response.amountB)} ${tokenB} to pool!`);
    } catch {
      toast.error('Add liquidity failed!');
    }

    setInProgress(false);
  };

  return (
    <div className="dark-container">
      <h1 className="mb-6 text-2xl">Add Liquidity</h1>

      <div className="relative flex flex-col w-full">
        <Token
          token={tokenA}
          setToken={setTokenA}
          amount={amountA}
          setAmount={setAmountA}
          tokens={tokens.filter(t => t !== tokenB)}
        />

        <div className="mt-1">
          <Token
            token={tokenB}
            setToken={setTokenB}
            amount={amountB}
            setAmount={setAmountB}
            tokens={tokens.filter(t => t !== tokenA)}
          />
        </div>

        <div className="mt-5">
          1 {tokenB} = {price} {tokenA}
        </div>

        <div className="mt-2 flex items-center">
          <label>Slippage Tolerance</label>
          <input
            className="mx-2 p-2 gray-container w-12 h-6 text-md"
            type="text"
            value={slippage}
            onChange={e => setSlippage(e.target.value)}
          />
          <span>%</span>
        </div>
      </div>

      <div className="flex flex-col mt-5">
        <div className="flex justify-center items-center">
          <button
            type="button"
            className="btn-default w-full"
            onClick={addLiq}
            disabled={!canAddLiq() || inProgress}
          >
          Add liquidity
        </button>
      </div>
    </div>
    </div >
  );
}

export default AddLiquidity;
