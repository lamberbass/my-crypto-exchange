import { useState } from 'react';
import { getPrice } from '../services/liquidity.service';
import Token from './Token';
import Tokens from '../artifacts/deployed-tokens.json';
import { ethString } from '../utils/amount-helper';
import { useDebouncedEffect } from '../utils/debounce';

export type PairProps = {
  tokenA: string,
  setTokenA: (token: string) => void,
  tokenB: string,
  setTokenB: (token: string) => void,
  amountA: string,
  setAmountA: (amount: string) => void,
  amountB: string,
  setAmountB: (amount: string) => void,
  slippage: string,
  setSlippage: (slippage: string) => void
}

function Pair(props: PairProps) {
  const tokens: string[] = Object.keys(Tokens);

  const [price, setPrice] = useState('');

  const getRatio = async () => {
    const price: string = await getPrice(props.tokenA, props.tokenB);
    setPrice(ethString(price));
  }

  useDebouncedEffect(getRatio, [props.tokenA, props.tokenB], 500);


  const swapPair = () => {
    const tokenA: string = props.tokenA;
    const amountA: string = props.amountA;

    props.setTokenA(props.tokenB);
    props.setTokenB(tokenA);
    props.setAmountB(amountA);
  }

  return (
    <div className="relative flex flex-col w-full">
      <Token
        token={props.tokenA}
        setToken={props.setTokenA}
        amount={props.amountA}
        setAmount={props.setAmountA}
        tokens={tokens.filter(t => t !== props.tokenB)}
      />

      <div
        className="absolute top-20 left-2/4 bg-gray-800 rounded-lg p-0.5 border border-4 border-dark-gray cursor-pointer"
        onClick={swapPair}>
        <img src="arrow.svg" alt="v" />
      </div>

      <div className="mt-1">
        <Token
          token={props.tokenB}
          setToken={props.setTokenB}
          amount={props.amountB}
          setAmount={props.setAmountB}
          tokens={tokens.filter(t => t !== props.tokenA)}
        />
      </div>

      <div className="mt-5">
        1 {props.tokenB} = {price} {props.tokenA}
      </div>

      <div className="mt-2 flex items-center">
        <label>Slippage Tolerance</label>
        <input
          className="mx-2 p-2 form-input w-12 h-6 text-md"
          type="text"
          value={props.slippage}
          onChange={e => props.setSlippage(e.target.value)}
        />
        <span>%</span>
      </div>
    </div>
  );
}

export default Pair;
