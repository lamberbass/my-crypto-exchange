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
    address pairAddress = Library.pairFor(address(factory), tokenA, tokenB);

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

  function removeLiquidity(        
    address tokenA,
    address tokenB,
    uint256 liquidity,
    uint256 amountAMin,
    uint256 amountBMin,
    address to
  ) public returns (
    uint256 amountA,
    uint256 amountB
  ) {
    address pairAddress = Library.pairFor(address(factory), tokenA, tokenB);
        
    (amountA, amountB) = Pair(pairAddress).burn(to, liquidity);
    
    if (amountA < amountAMin) {
      revert('Insufficient A amount');
    }

    if (amountB < amountBMin) {
      revert('Insufficient B amount');
    }
  }

  function swapExactTokensForTokens(
    uint256 amountIn,
    uint256 amountOutMin,
    address[] calldata path,
    address to
  ) public returns (uint256[] memory amounts) {
    amounts = Library.getAmountsOut(
      address(factory),
      amountIn,
      path
    );
    
    if (amounts[amounts.length - 1] < amountOutMin) {
      revert('Insufficient output amount');
    }
            
    ERC20(path[0]).transferFrom(
      msg.sender,
      Library.pairFor(address(factory), path[0], path[1]),
      amounts[0]
    );
        
    swap(amounts, path, to);
  }

  function swapTokensForExactTokens(
    uint256 amountOut,
    uint256 amountInMax,
    address[] calldata path,
    address to
  ) public returns (uint256[] memory amounts) {
    amounts = Library.getAmountsIn(
      address(factory),
      amountOut,
      path
    );
    
    if (amounts[amounts.length - 1] > amountInMax) {
      revert('Excessive input amount');
    }
            
    ERC20(path[0]).transferFrom(
      msg.sender,
      Library.pairFor(address(factory), path[0], path[1]),
      amounts[0]
    );
        
    swap(amounts, path, to);
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

  function swap(
    uint256[] memory amounts,
    address[] memory path,
    address to
  ) internal {
    for (uint256 i; i < path.length - 1; i++) {
      (address input, address output) = (path[i], path[i + 1]);
      Pair pair = Pair(Library.pairFor(address(factory), input, output));
      
      (uint256 amount0Out, uint256 amount1Out) = input == pair.token0()
        ? (uint256(0), amounts[i + 1])
        : (amounts[i + 1], uint256(0));

      address _to = i < path.length - 2
        ? Library.pairFor(address(factory), output, path[i + 2])
        : to;
            
      pair.swap(amount0Out, amount1Out, _to);
    }
  }
}