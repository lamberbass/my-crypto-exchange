// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./Factory.sol";
import "./Pair.sol";
import "./Library.sol";

contract Router {
  Factory factory;

  constructor(address factoryAddress) {
    factory = Factory(factoryAddress);
  }
  
  function addLiquidity(        
    address tokenA,
    address tokenB,
    uint256 amountADesired,
    uint256 amountBDesired,
    uint256 amountAMin,
    uint256 amountBMin,
    address to
  ) public returns (
    uint256 amountA,
    uint256 amountB,
    uint256 liquidity
  ) {
    address pairAddress = factory.pairs(tokenA, tokenB);

    if (pairAddress == address(0)) {
      pairAddress = factory.createPair(tokenA, tokenB);
    }

    (amountA, amountB) = calculateLiquidity(
      tokenA,
      tokenB,
      amountADesired,
      amountBDesired,
      amountAMin,
      amountBMin
    );
        
    ERC20(tokenA).transferFrom(msg.sender, pairAddress, amountA);
    ERC20(tokenB).transferFrom(msg.sender, pairAddress, amountB);
    liquidity = Pair(pairAddress).mint(to);
  }

  function calculateLiquidity(
    address tokenA,
    address tokenB,
    uint256 amountADesired,
    uint256 amountBDesired,
    uint256 amountAMin,
    uint256 amountBMin
  ) internal view returns (
    uint256 amountA, 
    uint256 amountB
  ) {
    (uint256 reserveA, uint256 reserveB) = Library.getReserves(address(factory), tokenA, tokenB);

    if (reserveA == 0 && reserveB == 0) {
      (amountA, amountB) = (amountADesired, amountBDesired);
    } else {
      uint256 amountBOptimal = Library.quote(amountADesired, reserveA, reserveB);

      if (amountBOptimal <= amountBDesired) {
        if (amountBOptimal <= amountBMin) {
          revert('Insufficient B amount');
        }

        (amountA, amountB) = (amountADesired, amountBOptimal);
      } else {
        uint256 amountAOptimal = Library.quote(amountBDesired, reserveB, reserveA);
        assert(amountAOptimal <= amountADesired);

        if (amountAOptimal <= amountAMin) {
          revert('Insufficient A amount');
        }
                
        (amountA, amountB) = (amountAOptimal, amountBDesired);
      }
    }
  }
}