// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Pair is ERC20 {
  uint256 constant MINIMUM_LIQUIDITY = 1000;

  address public token0;
  address public token1;

  uint256 public reserve0;
  uint256 public reserve1;

  event Mint(address indexed sender, uint256 amount0, uint256 amount1, uint256 minted, address indexed to);
  event Burn(address indexed sender, uint256 amount0, uint256 amount1, uint256 burned, address indexed to);
  event Swap(address indexed sender, uint256 amount0, uint256 amount1, address indexed to);

  constructor() ERC20("Liquidity Provider Token", "LPT") {}

  function initialize(address tokenA, address tokenB) external {
    require(tokenA != address(0) && tokenB != address(0), "Token addresses cannot be the zero address.");

    if (token0 != address(0) || token1 != address(0)) {
      revert("Pair already initialized");
    }

    token0 = tokenA;
    token1 = tokenB;
  }
  
  function mint(address to) external returns (uint256 lpTokens) {
    uint256 balance0 = ERC20(token0).balanceOf(address(this));
    uint256 balance1 = ERC20(token1).balanceOf(address(this));
    
    uint256 amount0 = balance0 - reserve0;
    uint256 amount1 = balance1 - reserve1;

    if (totalSupply() > 0) {
      lpTokens = Math.min(
        (amount0 * totalSupply()) / reserve0, 
        (amount1 * totalSupply()) / reserve1
      );
    } else {
      lpTokens = Math.sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY;
      _mint(address(this), MINIMUM_LIQUIDITY);
    }

    if (lpTokens <= 0) {
      revert('Insufficient liquidity tokens minted!');
    }

    _mint(to, lpTokens);

    reserve0 = balance0;
    reserve1 = balance1;

    emit Mint(msg.sender, amount0, amount1, lpTokens, to);
  }

  function burn(address to, uint256 lpTokens) external returns (uint256 amount0, uint256 amount1) {
    uint256 balance0 = ERC20(token0).balanceOf(address(this));
    uint256 balance1 = ERC20(token1).balanceOf(address(this));

    amount0 = (lpTokens * balance0) / totalSupply();
    amount1 = (lpTokens * balance1) / totalSupply();

    require(amount0 > 0 && amount1 > 0, 'Insufficient liquidity tokens burned!');

    _burn(to, lpTokens);

    // expected reserves after transfers
    reserve0 = balance0 - amount0;
    reserve1 = balance1 - amount1;

    emit Burn(msg.sender, amount0, amount1, lpTokens, to);

    SafeERC20.safeTransfer(IERC20(token0), to, amount0);
    SafeERC20.safeTransfer(IERC20(token1), to, amount1);
  }

  function swap(uint256 amount0Out, uint256 amount1Out, address to) external {
    if (amount0Out == 0 && amount1Out == 0) {
      revert('Zero output amounts');
    }

    if (amount0Out > reserve0 || amount1Out > reserve1) {
      revert('Output amount is greater than reserve');
    }

    // expected balances after transfers
    uint256 balance0 = ERC20(token0).balanceOf(address(this)) - amount0Out;
    uint256 balance1 = ERC20(token1).balanceOf(address(this)) - amount1Out;

    uint256 amount0In = balance0 - (reserve0 - amount0Out);
    uint256 amount1In = balance1 - (reserve1 - amount1Out);

    require(amount0In > 0 || amount1In > 0, 'Zero input amounts');

    // apply 0.3% fee
    uint256 balance0AfterFee = (balance0 * 1000) - (amount0In * 3);
    uint256 balance1AfterFee = (balance1 * 1000) - (amount1In * 3);

    if (balance0AfterFee * balance1AfterFee < reserve0 * reserve1 * (1000**2)) {
      revert('New product of reserves is less than previous');
    }

    reserve0 = balance0;
    reserve1 = balance1;

    emit Swap(msg.sender, amount0Out, amount1Out, to);
    
    if (amount0Out > 0) {
      SafeERC20.safeTransfer(IERC20(token0), to, amount0Out);
    }

    if (amount1Out > 0) {
      SafeERC20.safeTransfer(IERC20(token1), to, amount1Out);
    }
  }
}
