"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Factory = artifacts.require('Factory');
const migration = function (deployer) {
    deployer.deploy(Factory);
};
module.exports = migration;
