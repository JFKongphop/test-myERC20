const { expect, util } = require("chai");
const { ethers } = require("hardhat");
const { utils } = ethers;

describe("JFK-token", function () {
    let owner, investor1, investor2, token
    beforeEach(async ()=>{
        // test contract
        [owner, investor1, investor2] = await ethers.getSigners();

        // deploy token
        // must use name contract same of the contract
        const Token = await ethers.getContractFactory("JFK");
        token = await Token.deploy();
        await token.deployed();
    })

    // check mint and balance
    it("Should return the balance when mint", async function () {
        // tx1
        expect(await token._balances(owner.address)).to.equal(0)
        const tx1 = await token.connect(owner)._mint(owner.address, utils.parseUnits("1000000", 18));
        await tx1.wait()

        expect(await token._balances(owner.address)).to.equal(utils.parseUnits("1000000", 18));
        expect(await token.balanceOf(owner.address)).to.equal(utils.parseUnits("1000000", 18));
        expect(await token._totalSupply()).to.equal(utils.parseUnits("1000000", 18));

        // check event
        expect(tx1).to.emit(token, "Transfer").withArgs(owner.address, utils.parseUnits("1000000", 18))

        // tx2
        const tx2 = await token.connect(investor1)._mint(investor1.address, utils.parseUnits("5000000", 18))
        await tx2.wait()

        expect(await token._balances(investor1.address)).to.equal(utils.parseUnits("5000000", 18));
        expect(await token.balanceOf(investor1.address)).to.equal(utils.parseUnits("5000000", 18));

        // check event
        expect(tx2).to.emit(token, "Transfer").withArgs(investor1.address, utils.parseEther("5000000", 18));
        

        // both tx1 and tx2 totalSupply
        expect(await token._totalSupply()).to.equal(utils.parseUnits("6000000", 18));

        // revert when address is 0
        await expect(token.connect(owner)._mint(ethers.constants.AddressZero, utils.parseUnits("5000000", 18))).to.be.revertedWith("Mint to zero address");
    });

    // check burn and balance
    it("Should return the balance when burn", async function () {
        // owner
        // mint token 
        const tx1 = await token.connect(owner)._mint(owner.address, utils.parseUnits("1000000", 18));
        await tx1.wait()
        expect(await token._balances(owner.address)).to.equal(utils.parseUnits("1000000", 18));

        // burn token
        const tx2 = await token.connect(owner)._burn(owner.address, utils.parseUnits("600000", 18));
        await tx2.wait()
        expect(await token._balances(owner.address)).to.equal(utils.parseUnits("400000", 18));
        expect(await token.balanceOf(owner.address)).to.equal(utils.parseUnits("400000", 18));
        expect(await token._totalSupply()).to.equal(utils.parseUnits("400000", 18));

        // chcek event
        expect(tx2).to.emit(token, "Transfer").withArgs(owner.address, utils.parseUnits("600000", 18));

        // investor1
        // mint token
        const tx3 = await token.connect(investor1)._mint(investor1.address, utils.parseUnits("10000", 18));
        await tx3.wait()
        expect(await token._balances(investor1.address)).to.equal(utils.parseUnits("10000", 18));

        // burn token
        const tx4 = await token.connect(investor1)._burn(investor1.address, utils.parseUnits("1000", 18));
        await tx4.wait()
        expect(await token._balances(investor1.address)).to.equal(utils.parseUnits("9000", 18));
        expect(await token.balanceOf(investor1.address)).to.equal(utils.parseUnits("9000", 18));
        
        // both tx1 and tx2 totalSupply
        expect(await token._totalSupply()).to.equal(utils.parseUnits("409000", 18));

        // check revert  burn tokem by address 0
        await expect(token.connect(owner)._burn(ethers.constants.AddressZero, utils.parseUnits("500000", 18))).to.be.revertedWith("Burn to zero address");
        await expect(token.connect(owner)._burn(owner.address, utils.parseUnits("1000001", 18))).to.be.revertedWith("Burn amount exceeds belance");
    });

    // check transfer and balance
    it("Should return the balance when transfer", async ()=>{
        const tx1 = await token.connect(owner)._mint(owner.address, utils.parseUnits("1000000", 18));
        await tx1.wait()
        expect(await token._balances(owner.address)).to.equal(utils.parseUnits("1000000", 18));

        // transfer
        const tx2 = await token.connect(owner)._transfer(owner.address, investor1.address, utils.parseUnits("100000", 18));
        await tx2.wait()
        expect(await token._balances(owner.address)).to.equal(utils.parseUnits("900000", 18));
        expect(await token._balances(investor1.address)).to.equal(utils.parseUnits("100000", 18));
        expect(await token.balanceOf(owner.address)).to.equal(utils.parseUnits("900000", 18));
        expect(await token.balanceOf(investor1.address)).to.equal(utils.parseUnits("100000", 18));
        expect(await token._totalSupply()).to.equal(utils.parseUnits("1000000", 18));

        // next
        const tx3 = await token.connect(investor2)._mint(investor2.address, utils.parseUnits("1000000", 18));
        await tx3.wait()
        expect(await token._balances(investor2.address)).to.equal(utils.parseUnits("1000000", 18));

        // transfer
        const tx4 = await token.connect(investor2)._transfer(investor2.address, owner.address, utils.parseUnits("1000000", 18));
        await tx4.wait()
        expect(await token._balances(investor2.address)).to.equal(utils.parseUnits("0", 18));
        expect(await token._balances(owner.address)).to.equal(utils.parseUnits("1900000", 18))

        expect(await token._totalSupply()).to.equal(utils.parseUnits("2000000", 18));

        // check revert
        await expect(token.connect(owner)._transfer(ethers.constants.AddressZero, investor1.address, utils.parseUnits("1", 18))).to.be.revertedWith("Transfer from zero address");
        await expect(token.connect(owner)._transfer(owner.address, ethers.constants.AddressZero, utils.parseUnits("1", 18))).to.be.revertedWith("Transfer to zero address");
        await expect(token.connect(owner)._transfer(owner.address, investor1.address, utils.parseUnits("10000000000000", 18))).to.be.revertedWith("Transfer amount exceeds balance");

        // chcek emit
        expect(tx2).to.emit(token, "Transfer").withArgs(owner.address, investor1.address, utils.parseUnits("100000", 18));
        expect(tx4).to.emit(token, "Transfer").withArgs(investor2.address, owner.address, utils.parseUnits("1000000", 18));
    })

    // check approve
    it("Should return approve address and allowance", async ()=>{
        // mint token
        const tx1 = await token.connect(owner)._mint(owner.address, utils.parseUnits("1000000", 18));
        await tx1.wait()
        expect(await token._balances(owner.address)).to.equal(utils.parseUnits("1000000", 18));

        const tx2 = await token.connect(owner)._approve(owner.address, investor1.address, utils.parseUnits("10000", 18));
        await tx2.wait();

        // test nested mapping allowance
        expect(await token._allowance(owner.address, investor1.address)).to.equal(utils.parseUnits("10000", 18));
        expect(await token._balances(owner.address)).to.equal(utils.parseUnits("1000000", 18));
        expect(await token.allowance(owner.address, investor1.address)).to.equal(utils.parseUnits("10000", 18));

        // error
        const tx3 = await token.connect(investor1)._transfer(investor1.address, investor2.address, utils.parseUnits("1", 18));
        await tx3.wait()

        expect(await token._balances(investor2.address)).to.equal(utils.parseUnits("1", 18))
        expect(await token._balances(owner.address)).to.equal(utils.parseUnits("1000000", 18));
    })
});