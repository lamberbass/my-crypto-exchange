const Library = artifacts.require('Library');
const Router = artifacts.require('Router');

const migration: Truffle.Migration = async function (deployer: Truffle.Deployer) {
  deployer.link(Library, Router);
}

module.exports = migration;
export {}