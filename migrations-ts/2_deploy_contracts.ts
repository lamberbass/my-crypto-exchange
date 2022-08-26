const Pair = artifacts.require('Pair');

const migration: Truffle.Migration = function (deployer) {
  deployer.deploy(Pair);
}

module.exports = migration;
export {}