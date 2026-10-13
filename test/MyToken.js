const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("MyToken", function () {
  const INITIAL_SUPPLY = ethers.parseEther("1000000");

  async function deployFixture() {
    const [owner, alice, bob] = await ethers.getSigners();
    const MyToken = await ethers.getContractFactory("MyToken");
    const myToken = await MyToken.deploy(INITIAL_SUPPLY);
    await myToken.waitForDeployment();
    return { myToken, owner, alice, bob };
  }

  describe("Deployment", function () {
    it("Should deploy with correct initial supply", async function () {
      const { myToken, owner } = await loadFixture(deployFixture);
      expect(await myToken.totalSupply()).to.equal(INITIAL_SUPPLY);
      expect(await myToken.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY);
    });

    it("Should set name, symbol and decimals", async function () {
      const { myToken } = await loadFixture(deployFixture);
      expect(await myToken.name()).to.equal("MyToken");
      expect(await myToken.symbol()).to.equal("MTK");
      expect(await myToken.decimals()).to.equal(18n);
    });

    it("Should make the deployer the owner", async function () {
      const { myToken, owner } = await loadFixture(deployFixture);
      expect(await myToken.owner()).to.equal(owner.address);
    });
  });

  describe("Minting", function () {
    it("Should let the owner mint new tokens", async function () {
      const { myToken, alice } = await loadFixture(deployFixture);
      const amount = ethers.parseEther("500");

      await expect(myToken.mint(alice.address, amount))
        .to.emit(myToken, "Transfer")
        .withArgs(ethers.ZeroAddress, alice.address, amount);

      expect(await myToken.balanceOf(alice.address)).to.equal(amount);
      expect(await myToken.totalSupply()).to.equal(INITIAL_SUPPLY + amount);
    });

    it("Should not let other accounts mint", async function () {
      const { myToken, alice } = await loadFixture(deployFixture);

      await expect(myToken.connect(alice).mint(alice.address, 1n))
        .to.be.revertedWithCustomError(myToken, "OwnableUnauthorizedAccount")
        .withArgs(alice.address);
    });

    it("Should not mint to the zero address", async function () {
      const { myToken } = await loadFixture(deployFixture);

      await expect(myToken.mint(ethers.ZeroAddress, 1n))
        .to.be.revertedWithCustomError(myToken, "ERC20InvalidReceiver")
        .withArgs(ethers.ZeroAddress);
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      const { myToken, owner, alice, bob } = await loadFixture(deployFixture);
      const amount = ethers.parseEther("100");

      // owner -> alice
      await expect(myToken.transfer(alice.address, amount)).to.changeTokenBalances(
        myToken,
        [owner, alice],
        [-amount, amount]
      );

      // alice -> bob
      await expect(myToken.connect(alice).transfer(bob.address, amount))
        .to.emit(myToken, "Transfer")
        .withArgs(alice.address, bob.address, amount);

      expect(await myToken.balanceOf(alice.address)).to.equal(0n);
      expect(await myToken.balanceOf(bob.address)).to.equal(amount);
    });

    it("Should fail when sending more tokens than the balance", async function () {
      const { myToken, alice, bob } = await loadFixture(deployFixture);
      const amount = ethers.parseEther("1");

      await expect(myToken.connect(alice).transfer(bob.address, amount))
        .to.be.revertedWithCustomError(myToken, "ERC20InsufficientBalance")
        .withArgs(alice.address, 0n, amount);
    });

    it("Should not change balances after a failed transfer", async function () {
      const { myToken, owner, alice } = await loadFixture(deployFixture);
      const tooMuch = INITIAL_SUPPLY + 1n;

      await expect(myToken.transfer(alice.address, tooMuch)).to.be.reverted;

      expect(await myToken.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY);
      expect(await myToken.balanceOf(alice.address)).to.equal(0n);
    });

    it("Should not transfer to the zero address", async function () {
      const { myToken } = await loadFixture(deployFixture);

      await expect(myToken.transfer(ethers.ZeroAddress, 1n))
        .to.be.revertedWithCustomError(myToken, "ERC20InvalidReceiver")
        .withArgs(ethers.ZeroAddress);
    });

    it("Should let an approved spender use transferFrom within the allowance", async function () {
      const { myToken, owner, alice, bob } = await loadFixture(deployFixture);
      const allowance = ethers.parseEther("50");

      await myToken.approve(alice.address, allowance);
      expect(await myToken.allowance(owner.address, alice.address)).to.equal(allowance);

      await myToken.connect(alice).transferFrom(owner.address, bob.address, allowance);
      expect(await myToken.balanceOf(bob.address)).to.equal(allowance);
      expect(await myToken.allowance(owner.address, alice.address)).to.equal(0n);

      await expect(myToken.connect(alice).transferFrom(owner.address, bob.address, 1n))
        .to.be.revertedWithCustomError(myToken, "ERC20InsufficientAllowance")
        .withArgs(alice.address, 0n, 1n);
    });
  });
});
