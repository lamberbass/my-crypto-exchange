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

  function quoteBeforeRemovingLiquidity(
    address factoryAddress,
    address tokenA,
    address tokenB,
    uint8 percentageToRemove
  ) public view returns (
    uint256 amountA, 
    uint256 amountB,
    uint256 lpTokensToRemove
  ) {
    address pairAddress = pairFor(factoryAddress, tokenA, tokenB);
    Pair pair = Pair(pairAddress);
    
    uint256 liquidity = pair.balanceOf(msg.sender);
    lpTokensToRemove = percentageToRemove * liquidity / 100;

    (uint256 reserveA, uint256 reserveB) = getReserves(factoryAddress, tokenA, tokenB);

    amountA = (lpTokensToRemove * reserveA) / pair.totalSupply();
    amountB = (lpTokensToRemove * reserveB) / pair.totalSupply();
  }

  function getAmountOut(
    uint256 amountIn,
    uint256 reserveIn,
    uint256 reserveOut
  ) public pure returns (uint256) {
    if (amountIn == 0) {
      revert('Insufficient amount');
    }

    if (reserveIn == 0 || reserveOut == 0) {
      revert('Insufficient liquidity');
    }

    // apply 0.3% fee
    uint256 amountInWithFee = amountIn * 997;
    uint256 numerator = amountInWithFee * reserveOut;
    uint256 denominator = (reserveIn * 1000) + amountInWithFee;

    return numerator / denominator;
  }

  function getAmountsOut(
    address factory,
    uint256 amountIn,
    address[] memory path
  ) public view returns (uint256[] memory) {
    if (path.length < 2) {
      revert('Invalid path');
    }

    uint256[] memory amountsOut = new uint256[](path.length);
    amountsOut[0] = amountIn;

    for (uint256 i; i < path.length - 1; i++) {
      (uint256 reserve0, uint256 reserve1) = getReserves(
        factory,
        path[i],
        path[i + 1]
      );
    
      amountsOut[i + 1] = getAmountOut(amountsOut[i], reserve0, reserve1);
    }

    return amountsOut;
  }

  function getAmountIn(
    uint256 amountOut,
    uint256 reserveIn,
    uint256 reserveOut
  ) public pure returns (uint256) {
    if (amountOut == 0) {
      revert('Insufficient amount');
    }

    if (reserveIn == 0 || reserveOut == 0) {
      revert('Insufficient liquidity');
    }

    // apply 0.3% fee
    uint256 numerator = reserveIn * amountOut * 1000;
    uint256 denominator = (reserveOut - amountOut) * 997;

    // add 1 to handle truncated result
    return (numerator / denominator) + 1;
  }

  function getAmountsIn(
    address factory,
    uint256 amountOut,
    address[] memory path
  ) public view returns (uint256[] memory) {
    if (path.length < 2) {
      revert('Invalid path');
    }

    uint256[] memory amountsIn = new uint256[](path.length);
    amountsIn[amountsIn.length - 1] = amountOut;

    for (uint256 i = path.length - 1; i > 0; i--) {
      (uint256 reserve0, uint256 reserve1) = getReserves(
        factory,
        path[i - 1],
        path[i]
      );
    
      amountsIn[i - 1] = getAmountIn(amountsIn[i], reserve0, reserve1);
    }

    return amountsIn;
  }

  function pairFor(
    address factoryAddress,
    address tokenA,
    address tokenB
  ) internal view returns (address pairAddress) {
    pairAddress = Factory(factoryAddress).pairs(tokenA, tokenB);
  }
}
