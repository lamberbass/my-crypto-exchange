// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Mock is ERC20 {
  constructor(string memory tokenName, string memory tokenSymbol) ERC20(tokenName, tokenSymbol) {}

  function mint(uint256 amount, address to) external {
    _mint(to, amount);
  }
}
