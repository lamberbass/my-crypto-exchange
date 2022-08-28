const Factory = artifacts.require('Factory');

const migration: Truffle.Migration = function (deployer) {
  deployer.deploy(Factory);
}

module.exports = migration;
export {}