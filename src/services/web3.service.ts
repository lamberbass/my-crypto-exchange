import Web3 from 'web3';
import { currentAccount, setCurrentAccount } from './cache.service';

export async function getCurrentAccount(): Promise<string> {
  if (!window.ethereum || !window.ethereum.request) {
    throw new Error('Could not get connected accounts. Please install MetaMask.');
  }

  window.web3 = new Web3(window.ethereum);

  const accounts: string[] = await window.ethereum.request({
    method: 'eth_requestAccounts',
  });

  setCurrentAccount(accounts[0]);
  return currentAccount;
};

export async function getContract<T>(contractJson: any): Promise<T> {
  const address: string = await getContractAddress(contractJson);
  return new web3.eth.Contract(contractJson.abi as AbiItem[], address) as unknown as T;
}

export async function getContractAddress(contractJson: any): Promise<string> {
  const networkId: number = await web3.eth.net.getId();
  const deployedNetwork: any = contractJson.networks[networkId];
  if (!deployedNetwork) {
    throw new Error(`Contract ${contractJson.contractName} not deployed to detected network.`);
  }

  return deployedNetwork.address;
}
