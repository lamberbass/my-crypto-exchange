// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Mock is ERC20 {
  constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

  function mint(uint256 amount, address to) public {
    _mint(to, amount);
  }
}
