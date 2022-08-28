const Factory = artifacts.require('Factory');
const Router = artifacts.require('Router');

const migration: Truffle.Migration = function (deployer: Truffle.Deployer) {
  deployer.deploy(Router, Factory.address);
}

module.exports = migration;
export {}