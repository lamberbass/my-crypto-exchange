import './App.css';
import { useEffect, useState } from 'react';
import { getCurrentAccount } from './services/web3.service';
import { getTokenBalances, mintTokensWithZeroBalance } from './services/tokens.service';
import Swap from './components/Swap';
import Liquidity from './components/Liquidity';

function App() {
  const [currentAccount, setCurrentAccount] = useState('');
  const [showSwap, setShowSwap] = useState<boolean | undefined>(undefined);

  const connectWallet = async () => {
    const account: string = await getCurrentAccount();
    setCurrentAccount(account);
  };

  useEffect(() => {
    connectWallet();
    setShowSwap(true);
  }, []);

  const getBalances = async () => {
    console.log('balances', await getTokenBalances());
  };

  const mint = async () => {
    await mintTokensWithZeroBalance();
  };

  return (
    <div>
      <div className="App-header">
        <h1 className="text-4xl font-bold mb-3 mt-6">Welcome to My Crypto Exchange!</h1>
        {
          !currentAccount
            ? <div>Connecting to Metamask wallet...</div>
            : <div>Selected Account: <span>{currentAccount}</span></div>
        }
      </div>

      <div className="App-buttons">
        <div>
          <button type="button" className="btn-default hidden" onClick={getBalances}>Get balances</button>
          <button type="button" className="btn-default hidden" onClick={mint}>Mint tokens with zero balance</button>
        </div>

        <div>
          <ul className="grid gap-6 w-6/12 md:grid-cols-2">
            <li>
              <input type="radio" name="mode" id="swap" value="swap" className="hidden peer"
                checked={showSwap === true} onChange={() => setShowSwap(true)} />
              <label htmlFor="swap" className="radio">
                <div className="w-full text-lg font-semibold">Swap</div>
              </label>
            </li>
            <li>
              <input type="radio" name="mode" id="liquidity" value="liquidity" className="hidden peer"
                checked={showSwap === false} onChange={() => setShowSwap(false)} />
              <label htmlFor="liquidity" className="radio">
                <div className="w-full text-lg font-semibold">Liquidity</div>
              </label>
            </li>
          </ul>
        </div>

      </div>

      {
        showSwap === true
          ? <Swap></Swap>
          : showSwap === false
            ? <Liquidity></Liquidity>
            : <img src="mule.svg" className="App-logo" alt="logo" />
      }
    </div>
  );
}

export default App;
