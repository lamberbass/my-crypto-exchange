/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { MigrationsContract } from "./Migrations";
import { PairContract } from "./Pair";

declare global {
  namespace Truffle {
    interface Artifacts {
      require(name: "Migrations"): MigrationsContract;
      require(name: "Pair"): PairContract;
    }
  }
}

export { MigrationsContract, MigrationsInstance } from "./Migrations";
export { PairContract, PairInstance } from "./Pair";
