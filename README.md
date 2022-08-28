# My Crypto Exchange

A simplified Uniswap V2 clone for learning purposes.

#### Instructions to run the app

First, start an ethereum node (eg using Ganache) on port 8545.

Then, compile the smart contracts to create the artifacts:

```bash
truffle compile
```

Then, generate the Typescript types for the smart contracts:

```bash
npm run generate-types
```

Then, transpile the Typescript migrations to Javascript:

```bash
npm run transpile-migrations
```

Then, run migrations (might need sudo):

```bash
truffle migrate
```

Finally, run the tests:

```bash
truffle test
```