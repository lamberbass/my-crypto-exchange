/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { ERC20Contract } from "./ERC20";
import { ERC20MockContract } from "./ERC20Mock";
import { FactoryContract } from "./Factory";
import { IERC20Contract } from "./IERC20";
import { IERC20MetadataContract } from "./IERC20Metadata";
import { MigrationsContract } from "./Migrations";
import { PairContract } from "./Pair";

declare global {
  namespace Truffle {
    interface Artifacts {
      require(name: "ERC20"): ERC20Contract;
      require(name: "ERC20Mock"): ERC20MockContract;
      require(name: "Factory"): FactoryContract;
      require(name: "IERC20"): IERC20Contract;
      require(name: "IERC20Metadata"): IERC20MetadataContract;
      require(name: "Migrations"): MigrationsContract;
      require(name: "Pair"): PairContract;
    }
  }
}

export { ERC20Contract, ERC20Instance } from "./ERC20";
export { ERC20MockContract, ERC20MockInstance } from "./ERC20Mock";
export { FactoryContract, FactoryInstance } from "./Factory";
export { IERC20Contract, IERC20Instance } from "./IERC20";
export {
  IERC20MetadataContract,
  IERC20MetadataInstance,
} from "./IERC20Metadata";
export { MigrationsContract, MigrationsInstance } from "./Migrations";
export { PairContract, PairInstance } from "./Pair";
