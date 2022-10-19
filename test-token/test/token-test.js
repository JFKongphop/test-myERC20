const { expect } = require("chai");
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
});