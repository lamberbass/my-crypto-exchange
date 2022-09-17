import { useState } from 'react';
import { addLiquidity, removeLiquidity } from '../services/liquidity.service';
import { eth, wei } from '../utils/amount-helper';
import Pair from './Pair';

function Liquidity() {
  const [tokenA, setTokenA] = useState('ETH');
  const [tokenB, setTokenB] = useState('USDC');
  const [amountA, setAmountA] = useState('100');
  const [amountB, setAmountB] = useState('100');
  const [slippage, setSlippage] = useState('50');

  const getMinAmount = (amount: number): number => amount * (100 - +slippage) / 100;

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

      <div className="flex flex-col mt-5">
        <div className="flex justify-center items-center">
          <button type="button" className="btn-default m-2.5" onClick={addLiq}>Add liquidity</button>
          <button type="button" className="btn-default m-2.5" onClick={removeLiq}>Remove liquidity</button>
        </div>
      </div>
    </div>
  );
}

export default Liquidity;
