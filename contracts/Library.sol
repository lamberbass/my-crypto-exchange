// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "./Factory.sol";

library Library {
  function getReserves(
    address factoryAddress,
    address tokenA,
    address tokenB
  ) public view returns (
    uint256 reserveA, 
    uint256 reserveB
  ) {
    address pairAddress = pairFor(factoryAddress, tokenA, tokenB);
    Pair pair = Pair(pairAddress);
    
    reserveA = pair.token0() == tokenA ? pair.reserve0() : pair.reserve1();
    reserveB = pair.token0() == tokenA ? pair.reserve1() : pair.reserve0();
  }

  function quote(
    uint256 amountIn,
    uint256 reserveIn,
    uint256 reserveOut
  ) public pure returns (uint256 amountOut) {
    if (amountIn == 0) {
      revert('Insufficient amount');
    }

    if (reserveIn == 0 || reserveOut == 0) {
      revert('Insufficient liquidity');
    }

    return (amountIn * reserveOut) / reserveIn;
  }

  function pairFor(
    address factoryAddress,
    address tokenA,
    address tokenB
  ) internal view returns (address pairAddress) {
    pairAddress = Factory(factoryAddress).pairs(tokenA, tokenB);
  }
}
