// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Pair is ERC20 {
  uint256 constant MINIMUM_LIQUIDITY = 1000;

  address public token0;
  address public token1;

  uint256 public reserve0;
  uint256 public reserve1;

  event Mint(address indexed sender, uint256 amount0, uint256 amount1, uint256 minted);
  event Burn(address indexed sender, uint256 amount0, uint256 amount1, uint256 burned);

  constructor() ERC20("Liquidity Provider Token", "LPT") {}

  function initialize(address _token0, address _token1) public {
    if (token0 != address(0) || token1 != address(0)) {
      revert("Pair already initialized");
    }

    token0 = _token0;
    token1 = _token1;
  }
  
  function mint(address to) public returns (uint256 mintedLP) {
    uint256 balance0 = ERC20(token0).balanceOf(address(this));
    uint256 balance1 = ERC20(token1).balanceOf(address(this));
    
    uint256 amount0 = balance0 - reserve0;
    uint256 amount1 = balance1 - reserve1;

    if (totalSupply() == 0) {
      mintedLP = Math.sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY;
      _mint(address(this), MINIMUM_LIQUIDITY);
    } else {
      mintedLP = Math.min(
        (amount0 * totalSupply()) / reserve0, 
        (amount1 * totalSupply()) / reserve1
      );
    }

    if (mintedLP <= 0) {
      revert('Insufficient liquidity tokens minted!');
    }

    _mint(to, mintedLP);

    reserve0 = balance0;
    reserve1 = balance1;

    emit Mint(to, amount0, amount1, mintedLP);
  }

  function burn(address to) public returns (uint256 amount0, uint256 amount1) {
    uint256 lpTokens = balanceOf(to);

    amount0 = (lpTokens * reserve0) / totalSupply();
    amount1 = (lpTokens * reserve1) / totalSupply();

    if (amount0 == 0 || amount1 == 0) {
      revert('Insufficient liquidity tokens burned!');
    }

    _burn(to, lpTokens);

    ERC20(token0).transfer(to, amount0);
    ERC20(token1).transfer(to, amount1);

    uint256 balance0 = ERC20(token0).balanceOf(address(this));
    uint256 balance1 = ERC20(token1).balanceOf(address(this));

    reserve0 = balance0;
    reserve1 = balance1;

    emit Burn(to, amount0, amount1, lpTokens);
  }
}
