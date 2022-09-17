import { useCallback, useEffect, useState } from 'react';
import Tokens from '../artifacts/deployed-tokens.json';
import { getPrice } from '../services/liquidity.service';
import './Pair.css';

export type PairProps = {
  tokenA: string,
  setTokenA: (token: string) => void,
  tokenB: string,
  setTokenB: (token: string) => void,
  amountA: string,
  setAmountA: (amount: string) => void,
  amountB: string,
  setAmountB: (amount: string) => void,
  slippage: number,
  setSlippage: (slippage: number) => void
}

function Pair(props: PairProps) {
  const [tokenA, setTokenA] = [props.tokenA, props.setTokenA];
  const [tokenB, setTokenB] = [props.tokenB, props.setTokenB];
  const [amountA, setAmountA] = [props.amountA, props.setAmountA];
  const [amountB, setAmountB] = [props.amountB, props.setAmountB];
  const [slippage, setSlippage] = [props.slippage, props.setSlippage];

  const [price, setPrice] = useState('');

  const tokens: string[] = Object.keys(Tokens);

  const getRatio = useCallback(
    async () => {
      const price: string = await getPrice(tokenA, tokenB);
      setPrice(price);
    },
    [tokenA, tokenB]
  );

  useEffect(() => { getRatio() }, [tokenA, tokenB, getRatio]);

  return (
    <div className="Pair-content">
      <div className="Pair-token">
        <div>
          <label className="form-label">Amount A</label>
          <input className="form-input" type="text" value={amountA} onChange={e => setAmountA(e.target.value)}></input>
        </div>

        <div>
          <select className="form-input" name="tokens" id="tokens" defaultValue={tokenA} onChange={e => setTokenA(e.target.value)}>
            {tokens.filter(token => token !== tokenB).map(token => <option key={token} value={token}>{token}</option>)}
          </select>
          <label className="form-label">Token A</label>
        </div>
      </div>

      <div className="Pair-token">
        <div>
          <label className="form-label">Amount B</label>
          <input className="form-input" type="text" value={amountB} onChange={e => setAmountB(e.target.value)}></input>
        </div>

        <div>
          <select className="form-input" name="tokens" id="tokens" defaultValue={tokenB} onChange={e => setTokenB(e.target.value)}>
            {tokens.filter(token => token !== tokenA).map(token => <option key={token} value={token}>{token}</option>)}
          </select>
          <label className="form-label">Token B</label>
        </div>
      </div>

      <div className="Pair-price">
        1 {tokenB} = {price} {tokenA}
      </div>

      <div className="Pair-slip">
        <label className="form-label">Slippage Tolerance</label>
        <input className="form-input" type="text" value={slippage} onChange={e => setSlippage(+e.target.value)}></input>
        <span>%</span>
      </div>
    </div>
  );
}

export default Pair;
