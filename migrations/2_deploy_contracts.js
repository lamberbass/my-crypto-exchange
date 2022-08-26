"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Pair = artifacts.require('Pair');
const migration = function (deployer) {
    deployer.deploy(Pair);
};
module.exports = migration;
