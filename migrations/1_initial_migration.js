"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Migrations = artifacts.require('Migrations');
const migration = function (deployer) {
    deployer.deploy(Migrations);
};
module.exports = migration;
