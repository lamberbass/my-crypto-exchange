import { ERC20MockInstance, PairInstance } from "../types/truffle-contracts";

const Pair = artifacts.require("Pair");
const ERC20Mock = artifacts.require("ERC20Mock");
const { expectRevert } = require('@openzeppelin/test-helpers');

const ethString = (amount: number) => web3.utils.toWei(amount.toString(), 'ether');
const weiString = (amount: number) => web3.utils.toWei(amount.toString(), 'wei');
const ethBN = (amount: number) => web3.utils.toBN(ethString(amount));
const weiBN = (amount: number) => web3.utils.toBN(weiString(amount));

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

      assert.equal((await pairInstance.balanceOf(accounts[0])).toString(), (ethBN(1).sub(weiBN(1000))).toString());
      assert.equal((await pairInstance.reserve0()).toString(), ethString(1));
      assert.equal((await pairInstance.reserve1()).toString(), ethString(1));
      assert.equal((await pairInstance.totalSupply()).toString(), ethString(1));
    });

    it('should mint when there\'s liquidity', async () => {    
      await token0.transfer(pairInstance.address, ethBN(1));
      await token1.transfer(pairInstance.address, ethBN(1));

      await pairInstance.mint(accounts[0]);

      await token0.transfer(pairInstance.address, ethBN(2));
      await token1.transfer(pairInstance.address, ethBN(2));

      await pairInstance.mint(accounts[0]);

      assert.equal((await pairInstance.balanceOf(accounts[0])).toString(), (ethBN(3).sub(weiBN(1000))).toString());
      assert.equal((await pairInstance.reserve0()).toString(), ethString(3));
      assert.equal((await pairInstance.reserve1()).toString(), ethString(3));
      assert.equal((await pairInstance.totalSupply()).toString(), ethString(3));
    });

    it('should mint with unbalanced token amounts', async () => {    
      await token0.transfer(pairInstance.address, ethBN(1));
      await token1.transfer(pairInstance.address, ethBN(1));

      await pairInstance.mint(accounts[0]);

      await token0.transfer(pairInstance.address, ethBN(2));
      await token1.transfer(pairInstance.address, ethBN(1));

      await pairInstance.mint(accounts[0]);

      assert.equal((await pairInstance.balanceOf(accounts[0])).toString(), (ethBN(2).sub(weiBN(1000))).toString());
      assert.equal((await pairInstance.reserve0()).toString(), ethString(3));
      assert.equal((await pairInstance.reserve1()).toString(), ethString(2));
      assert.equal((await pairInstance.totalSupply()).toString(), ethString(2));
    });

    it('should fail when token amounts are zero', async () => {    
      await expectRevert.unspecified(pairInstance.mint(accounts[0]));
    });

    it('should fail when minting zero LP tokens', async () => {
      await token0.transfer(pairInstance.address, weiBN(1000));
      await token1.transfer(pairInstance.address, weiBN(1000));

      await expectRevert(pairInstance.mint(accounts[0]), 'Insufficient liquidity tokens minted!');
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

      assert.equal((await pairInstance.balanceOf(accounts[0])).toString(), ethString(0));
      assert.equal((await pairInstance.reserve0()).toString(), weiString(1000));
      assert.equal((await pairInstance.reserve1()).toString(), weiString(1000));
      assert.equal((await pairInstance.totalSupply()).toString(), weiString(1000));

      assert.equal((await token0.balanceOf(accounts[0])).toString(), (ethBN(10).sub(weiBN(1000))).toString());
      assert.equal((await token1.balanceOf(accounts[0])).toString(), (ethBN(10).sub(weiBN(1000))).toString());
    });

    it('should burn with unbalanced token amounts', async () => {    
      await token0.transfer(pairInstance.address, ethBN(1));
      await token1.transfer(pairInstance.address, ethBN(1));

      await pairInstance.mint(accounts[0]);

      await token0.transfer(pairInstance.address, ethBN(2));
      await token1.transfer(pairInstance.address, ethBN(1));

      await pairInstance.mint(accounts[0]);

      await pairInstance.burn(accounts[0]);

      assert.equal((await pairInstance.balanceOf(accounts[0])).toString(), ethString(0));
      assert.equal((await pairInstance.reserve0()).toString(), weiString(1500));
      assert.equal((await pairInstance.reserve1()).toString(), weiString(1000));
      assert.equal((await pairInstance.totalSupply()).toString(), weiString(1000));

      assert.equal((await token0.balanceOf(accounts[0])).toString(), (ethBN(10).sub(weiBN(1500))).toString());
      assert.equal((await token1.balanceOf(accounts[0])).toString(), (ethBN(10).sub(weiBN(1000))).toString());
    });

    it('should burn with different users', async () => {    
      await token0.transfer(pairInstance.address, ethBN(1), { from : accounts[1] });
      await token1.transfer(pairInstance.address, ethBN(1), { from : accounts[1] });

      await pairInstance.mint(accounts[1]);

      await token0.transfer(pairInstance.address, ethBN(2));
      await token1.transfer(pairInstance.address, ethBN(1));

      await pairInstance.mint(accounts[0]);

      await pairInstance.burn(accounts[0]);

      assert.equal((await pairInstance.balanceOf(accounts[0])).toString(), ethString(0));
      assert.equal((await pairInstance.reserve0()).toString(), ethString(1.5));
      assert.equal((await pairInstance.reserve1()).toString(), ethString(1));
      assert.equal((await pairInstance.totalSupply()).toString(), ethString(1));

      // accounts[0] lost 0.5 eth for providing unbalanced liquidity
      assert.equal((await token0.balanceOf(accounts[0])).toString(), (ethBN(10).sub(ethBN(0.5))).toString());
      assert.equal((await token1.balanceOf(accounts[0])).toString(), ethString(10));

      await pairInstance.burn(accounts[1]);

      assert.equal((await pairInstance.balanceOf(accounts[1])).toString(), ethString(0));
      assert.equal((await pairInstance.reserve0()).toString(), weiString(1500));
      assert.equal((await pairInstance.reserve1()).toString(), weiString(1000));
      assert.equal((await pairInstance.totalSupply()).toString(), weiString(1000));

      // accounts[1] gained the 0.5 eth that accounts[0] lost
      assert.equal((await token0.balanceOf(accounts[1])).toString(), (ethBN(10).add(ethBN(0.5)).sub(weiBN(1500))).toString());
      assert.equal((await token1.balanceOf(accounts[1])).toString(), (ethBN(10).sub(weiBN(1000))).toString());
    });

    it('should fail when total supply is zero', async () => {    
      await expectRevert.unspecified(pairInstance.burn(accounts[0]));
    });

    it('should fail when LP tokens are zero', async () => {
      await token0.transfer(pairInstance.address, ethBN(1));
      await token1.transfer(pairInstance.address, ethBN(1));

      await pairInstance.mint(accounts[0]);

      await expectRevert(pairInstance.burn(accounts[1]), 'Insufficient liquidity tokens burned!');
    });
  });
});
