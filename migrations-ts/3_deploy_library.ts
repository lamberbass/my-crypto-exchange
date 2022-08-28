const Library = artifacts.require('Library');

const migration: Truffle.Migration = function (deployer) {
  deployer.deploy(Library);
}

module.exports = migration;
export {}