import RouterCompiled from '../artifacts/Router.json';
import LibraryCompiled from '../artifacts/Library.json';
import { Router, Library } from "../../types/web3-v1-contracts";
import { getContractAddress, getContract } from "./web3.service";

export let currentAccount: string;
export let libraryContract: Library;
export let routerContract: Router;
export let routerAddress: string;

export function setCurrentAccount(account: string) {
  currentAccount = account;
}

export async function initRouterContract(): Promise<void> {
  routerAddress = await getContractAddress(RouterCompiled);
  routerContract = await getContract<Router>(RouterCompiled);
}

export async function initLibraryContract(): Promise<void> {
  libraryContract = await getContract<Library>(LibraryCompiled);
}
