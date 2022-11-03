const { expect, util, assert } = require("chai");
const { ethers } = require("hardhat");
const { utils } = ethers;


describe("TokenERC20", async ()=>{
    let owner, investor1, investor2, token;

    beforeEach(async ()=>{
        // test contract
        [owner, investor1, investor2] = await ethers.getSigners();

        // deploy contract before test all time
        const Token = await ethers.getContractFactory("TokenERC20");
        token = await Token.deploy(10000000, "JFKToken", "JFKT");
        await token.deployed()
    })

    // show the name symbol amount and who deploy of token
    it("should return name and symbol token", async ()=>{
        expect(await token.balanceOf(owner.address)).to.equal(utils.parseEther("10000000", 18));
        expect(await token.name()).to.equal("JFKToken");
        expect(await token.symbol()).to.equal("JFKT");
        expect(await token.totalSupply()).to.equal(utils.parseEther("10000000", 18))
        expect(await token.decimals()).to.equal(18)
    })

    // transfer token to address
    it("Should return transfer and amount in address", async ()=>{
        expect(await token.balanceOf(owner.address)).to.equal(utils.parseEther("10000000", 18))

        // transfer from owner to investor1
        const tx1 = await token.connect(owner)._transfer(owner.address, investor1.address, utils.parseEther("10000", 18));
        await tx1.wait()
        expect(await token.balanceOf(owner.address)).to.equal(utils.parseEther("9990000", 18));
        expect(await token.balanceOf(investor1.address)).to.equal(utils.parseEther("10000", 18));
        expect(await token.previousBalances()).to.equal(utils.parseEther("10000000", 18));
        expect(tx1).to.emit(token, "Transfer").withArgs(owner.address, investor1.address, utils.parseEther("10000", 18));

        // transfer from investor1 to investor2
        const tx2 = await token.connect(investor1)._transfer(investor1.address, investor2.address, utils.parseEther("1000", 18));
        await tx2.wait()
        expect(await token.balanceOf(investor1.address)).to.equal(utils.parseEther("9000", 18));
        expect(await token.balanceOf(investor2.address)).to.equal(utils.parseEther("1000", 18));
        expect(await token.previousBalances()).to.equal(utils.parseEther("10000", 18));
        expect(tx2).to.emit(token, "Transfer").withArgs(investor1.address, investor2.address, utils.parseEther("1000", 18));

        // chcek require tx1 and tx2
        await expect(token.connect(owner)._transfer(owner.address, ethers.constants.AddressZero, utils.parseEther("1", 18))).to.be.revertedWith("Cannot transfer to zero address");
        await expect(token.connect(owner)._transfer(owner.address, investor1.address, utils.parseEther("10000001", 18))).to.be.revertedWith("Amount is exceed balanc");
        //await expect(token.connect(owner)._transfer(owner.address, investor1.address, utils.parseEther("-1", 18))).to.be.revertedWith("New balance is must more than initial");
    })

    // transferForm set approve token to other address
    it("Should return approve token from other address", async ()=>{
        expect(await token.balanceOf(owner.address)).to.equal(utils.parseEther("10000000", 18));

        // approve token other address
        const tx1 = await token.connect(owner).approve(investor1.address, utils.parseEther("10000", 18));
        await tx1.wait()
        expect(await token.showAllowance(investor1.address)).to.equal(utils.parseEther("10000", 18));

        const tx2 = await token.connect(owner).approve(investor2.address, utils.parseEther("100", 18));
        await tx2.wait()
        expect(await token.showAllowance(investor2.address)).to.equal(utils.parseEther("100", 18));
    })

    // burn token by owner address
    it("Should burn token in address", async ()=>{
        expect(await token.balanceOf(owner.address)).to.equal(utils.parseEther("10000000", 18));

        // burn token
        const tx1 = await token.connect(owner).burn(utils.parseEther("10000", 18));
        await tx1.wait()
        expect(await token.balanceOf(owner.address)).to.equal(utils.parseEther("9990000", 18));
        expect(await token.totalSupply()).to.equal(utils.parseEther("9990000", 18));
    })

    // burnForm
    it("Should burnToken in address and supply",  async ()=>{
        expect(await token.balanceOf(owner.address)).to.equal(utils.parseEther("10000000", 18));

        const tx1 = await token._transfer(owner.address, investor1.address, utils.parseEther("10000", 18));
        await tx1.wait()
        expect(await token.balanceOf(owner.address)).to.equal(utils.parseEther("9990000", 18));
        expect(await token.balanceOf(investor1.address)).to.equal(utils.parseEther("10000", 18));

        // burn token by other address
        // have some error
        const tx2 = await token.burnFrom(investor1.address, utils.parseEther("1000", 18));
        await tx2.wait()
        expect(await token.balanceOf(investor1.address)).to.equal(utils.parseEther("9000", 18))
    })
})