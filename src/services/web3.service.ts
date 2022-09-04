import Web3 from 'web3';

let web3: Web3;
let currentAccount: string;

export async function getCurrentAccount(): Promise<string> {
  const ethereum = (window as any).ethereum;

  if (!ethereum || !ethereum.request) {
    throw new Error('Could not get connected accounts. Please install MetaMask.');
  }

  web3 = new Web3(ethereum);
  (window as any).web3 = web3;

  const accounts: string[] = await ethereum.request({
    method: 'eth_requestAccounts',
  });

  currentAccount = accounts[0];
  return currentAccount;
};