// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "./Pair.sol";

contract Factory {
  event PairCreated(address indexed token0, address indexed token1, address pair);
  
  mapping(address => mapping(address => address)) public pairs;

  function createPair(address token0, address token1) public returns (address pairAddress) {
    if (token0 == token1) {
      revert('Tokens should have different addresses');
    }

    if (token0 == address(0) || token1 == address(0)) {
      revert('Tokens should have non-zero addresses');
    }
    
    if (pairs[token0][token1] != address(0) || pairs[token1][token0] != address(0)) {
      revert('Pair already exists for these tokens');
    }

    Pair pair = new Pair();

    pairAddress = address(pair);
    pairs[token0][token1] = pairAddress;
    pairs[token1][token0] = pairAddress;

    emit PairCreated(token0, token1, pairAddress);

    pair.initialize(token0, token1);
  }
}