import { ERC20MockInstance, PairInstance } from "../types/truffle-contracts";

const Pair = artifacts.require("Pair");
const ERC20Mock = artifacts.require("ERC20Mock");

const ethBN = (amount: number) => web3.utils.toBN(web3.utils.toWei(amount.toString(), 'ether'));
const weiBN = (amount: number) => web3.utils.toBN(web3.utils.toWei(amount.toString(), 'wei'));

contract('Pair', (accounts: string[]) => {
  describe('Deployment', async () => {
    it('should be deployed', async () => {
      const pairInstance: PairInstance = await Pair.deployed();
      assert.isNotNull(pairInstance);
    });
  });

  describe('Minting', async () => {
    let pairInstance: PairInstance;
    let token0: ERC20MockInstance;
    let token1: ERC20MockInstance;

    beforeEach(async () => {
      token0 = await ERC20Mock.new("Token 0", "T0");
      token1 = await ERC20Mock.new("Token 1", "T1");
      
      pairInstance = await Pair.new();
      await pairInstance.initialize(token0.address, token1.address);

      await token0.mint(ethBN(10), accounts[0]);
      await token1.mint(ethBN(10), accounts[0]);
    });

    it('should mint when there\'s no liquidity', async () => {    
      await token0.transfer(pairInstance.address, ethBN(1));
      await token1.transfer(pairInstance.address, ethBN(1));

      await pairInstance.mint(accounts[0]);

      assert.isTrue((await pairInstance.balanceOf(accounts[0])).eq(ethBN(1).sub(weiBN(1000))));
      assert.isTrue((await pairInstance.reserve0()).eq(ethBN(1)));
      assert.isTrue((await pairInstance.reserve1()).eq(ethBN(1)));
      assert.isTrue((await pairInstance.totalSupply()).eq(ethBN(1)));
    });

    it('should mint when there\'s liquidity', async () => {    
      await token0.transfer(pairInstance.address, ethBN(1));
      await token1.transfer(pairInstance.address, ethBN(1));

      await pairInstance.mint(accounts[0]);

      await token0.transfer(pairInstance.address, ethBN(2));
      await token1.transfer(pairInstance.address, ethBN(2));

      await pairInstance.mint(accounts[0]);

      assert.isTrue((await pairInstance.balanceOf(accounts[0])).eq(ethBN(3).sub(weiBN(1000))));
      assert.isTrue((await pairInstance.reserve0()).eq(ethBN(3)));
      assert.isTrue((await pairInstance.reserve1()).eq(ethBN(3)));
      assert.isTrue((await pairInstance.totalSupply()).eq(ethBN(3)));
    });

    it('should mint with unbalanced token amounts', async () => {    
      await token0.transfer(pairInstance.address, ethBN(1));
      await token1.transfer(pairInstance.address, ethBN(1));

      await pairInstance.mint(accounts[0]);

      await token0.transfer(pairInstance.address, ethBN(2));
      await token1.transfer(pairInstance.address, ethBN(1));

      await pairInstance.mint(accounts[0]);

      assert.isTrue((await pairInstance.balanceOf(accounts[0])).eq(ethBN(2).sub(weiBN(1000))));
      assert.isTrue((await pairInstance.reserve0()).eq(ethBN(3)));
      assert.isTrue((await pairInstance.reserve1()).eq(ethBN(2)));
      assert.isTrue((await pairInstance.totalSupply()).eq(ethBN(2)));
    });
  });

  describe('Burning', async () => {
    let pairInstance: PairInstance;
    let token0: ERC20MockInstance;
    let token1: ERC20MockInstance;

    beforeEach(async () => {
      token0 = await ERC20Mock.new("Token 0", "T0");
      token1 = await ERC20Mock.new("Token 1", "T1");
      
      pairInstance = await Pair.new();
      await pairInstance.initialize(token0.address, token1.address);

      await token0.mint(ethBN(10), accounts[0]);
      await token1.mint(ethBN(10), accounts[0]);

      await token0.mint(ethBN(10), accounts[1]);
      await token1.mint(ethBN(10), accounts[1]);
    });

    it('should burn with balanced token amounts', async () => {    
      await token0.transfer(pairInstance.address, ethBN(1));
      await token1.transfer(pairInstance.address, ethBN(1));

      await pairInstance.mint(accounts[0]);

      await pairInstance.burn(accounts[0]);

      assert.isTrue((await pairInstance.balanceOf(accounts[0])).eq(ethBN(0)));
      assert.isTrue((await pairInstance.reserve0()).eq(weiBN(1000)));
      assert.isTrue((await pairInstance.reserve1()).eq(weiBN(1000)));
      assert.isTrue((await pairInstance.totalSupply()).eq(weiBN(1000)));

      assert.isTrue((await token0.balanceOf(accounts[0])).eq(ethBN(10).sub(weiBN(1000))));
      assert.isTrue((await token1.balanceOf(accounts[0])).eq(ethBN(10).sub(weiBN(1000))));
    });

    it('should burn with unbalanced token amounts', async () => {    
      await token0.transfer(pairInstance.address, ethBN(1));
      await token1.transfer(pairInstance.address, ethBN(1));

      await pairInstance.mint(accounts[0]);

      await token0.transfer(pairInstance.address, ethBN(2));
      await token1.transfer(pairInstance.address, ethBN(1));

      await pairInstance.mint(accounts[0]);

      await pairInstance.burn(accounts[0]);

      assert.isTrue((await pairInstance.balanceOf(accounts[0])).eq(ethBN(0)));
      assert.isTrue((await pairInstance.reserve0()).eq(weiBN(1500)));
      assert.isTrue((await pairInstance.reserve1()).eq(weiBN(1000)));
      assert.isTrue((await pairInstance.totalSupply()).eq(weiBN(1000)));

      assert.isTrue((await token0.balanceOf(accounts[0])).eq(ethBN(10).sub(weiBN(1500))));
      assert.isTrue((await token1.balanceOf(accounts[0])).eq(ethBN(10).sub(weiBN(1000))));
    });

    it('should burn with different users', async () => {    
      await token0.transfer(pairInstance.address, ethBN(1), { from : accounts[1] });
      await token1.transfer(pairInstance.address, ethBN(1), { from : accounts[1] });

      await pairInstance.mint(accounts[1]);

      await token0.transfer(pairInstance.address, ethBN(2));
      await token1.transfer(pairInstance.address, ethBN(1));

      await pairInstance.mint(accounts[0]);

      await pairInstance.burn(accounts[0]);

      assert.isTrue((await pairInstance.balanceOf(accounts[0])).eq(ethBN(0)));
      assert.isTrue((await pairInstance.reserve0()).eq(ethBN(1.5)));
      assert.isTrue((await pairInstance.reserve1()).eq(ethBN(1)));
      assert.isTrue((await pairInstance.totalSupply()).eq(ethBN(1)));

      // accounts[0] lost 0.5 eth for providing unbalanced liquidity
      assert.isTrue((await token0.balanceOf(accounts[0])).eq(ethBN(10).sub(ethBN(0.5))));
      assert.isTrue((await token1.balanceOf(accounts[0])).eq(ethBN(10)));

      await pairInstance.burn(accounts[1]);

      assert.isTrue((await pairInstance.balanceOf(accounts[1])).eq(ethBN(0)));
      assert.isTrue((await pairInstance.reserve0()).eq(weiBN(1500)));
      assert.isTrue((await pairInstance.reserve1()).eq(weiBN(1000)));
      assert.isTrue((await pairInstance.totalSupply()).eq(weiBN(1000)));

      // accounts[0] gained the 0.5 eth that accounts[0] lost
      assert.isTrue((await token0.balanceOf(accounts[1])).eq(ethBN(10).add(ethBN(0.5)).sub(weiBN(1500))));
      assert.isTrue((await token1.balanceOf(accounts[1])).eq(ethBN(10).sub(weiBN(1000))));
    });
  });
});
