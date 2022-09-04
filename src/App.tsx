import './App.css';
import { useEffect, useState } from 'react';
import { getCurrentAccount } from './services/web3.service';

function App() {
  const [currentAccount, setCurrentAccount] = useState('');

  const connectWallet = async () => {
    const account: string = await getCurrentAccount();
    setCurrentAccount(account);
  };

  useEffect(() => { connectWallet(); }, []);

  return (
    <div>
      <header className="App-header">
        <h1>Welcome to My Crypto Exchange!</h1>

        {!currentAccount
          ? <div>Connecting to Metamask wallet...</div>
          : <div>Selected Account: <span>{currentAccount}</span></div>
        }

        <img src="mule.svg" className="App-logo" alt="logo" />
      </header>
    </div>
  );
}

export default App;
