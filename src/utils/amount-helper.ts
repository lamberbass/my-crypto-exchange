export function eth(amount: number | string): BN {
  if (typeof (amount) === 'number') {
    amount = amount.toString();
  }
  return web3.utils.toBN(web3.utils.toWei(amount, 'ether'));
}

export function wei(amount: number | string): BN {
  if (typeof (amount) === 'number') {
    amount = amount.toString();
  }

  return web3.utils.toBN(web3.utils.toWei(amount, 'wei'));
}