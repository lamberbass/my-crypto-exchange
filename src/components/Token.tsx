import { useState } from 'react';
import { getTokenBalance } from '../services/tokens.service';
import { ethString } from '../utils/amount-helper';
import { useDebouncedEffect } from '../utils/debounce';
import './Token.css';

export type TokenProps = {
  tokens: string[],
  token: string,
  setToken: (token: string) => void,
  amount: string,
  setAmount: (amount: string) => void
}

function Token(props: TokenProps) {
  const [balance, setBalance] = useState('0');

  const getBalance = async () => {
    const balance: string = await getTokenBalance(props.token);
    setBalance(ethString(balance));
  }

  useDebouncedEffect(getBalance, [props.token], 500);

  return (
    <div className="form-container flex flex-col">
      <div className="flex items-center justify-between">
        <input className="form-input text-3xl h-10 w-9/12" type="text" value={props.amount} onChange={e => props.setAmount(e.target.value)}></input>

        <select className="form-select ml-4" name="tokens" id="tokens" value={props.token} onChange={e => props.setToken(e.target.value)}>
          {props.tokens.map(token => <option key={token} value={token}>{token}</option>)}
        </select>
      </div>
      <div className="my-1">Balance: {balance}</div>
    </div>
  );
}

export default Token;
