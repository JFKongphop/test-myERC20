const { expect, util, assert } = require("chai");
const { ethers } = require("hardhat");
const { utils } = ethers;

describe("JFKNFT", async ()=>{
    let owner, investor1, investor2, token;

    beforeEach(async ()=>{
        // test contract
        [owner, investor1, investor2] = await ethers.getSigners();

        // deploy contract before test all time || _symbol_name
        const Token = await ethers.getContractFactory("JFKNFT");
        token = await Token.deploy();
        await token.deployed()
    })

    // check initial value after deploy contract
    describe("Initail value after deploy", ()=>{
        
        it("Should return the name and symbol of token ERC721", async ()=>{
            expect(await token._name()).to.equal("JFK-NonFunToken");
            expect(await token._symbol()).to.equal("JFKNFT");
            expect(await token.totalSupply()).to.equal("0");
            expect(await token.balanceOf(owner.address)).to.equal("0");
            expect(await token._balances(owner.address)).to.equal("0")
        })
    })

    // mint token
    describe("Mint token to address", ()=>{
        it("Should return minted token, totalSupply, balances, tokenID and URI", async ()=>{
            
            // mint token from address 0 to other address
            const tx1 = await token.connect(owner)._mint(owner.address, "1", "hello-world");
            await tx1.wait();
            expect(await token._balances(owner.address)).to.equal("1");
            expect(await token._owners("1")).to.equal(owner.address);
            expect(await token._tokenURLIs("1")).to.equal("hello-world");

            // show the token id in nested mapping
            expect(await token.showOwnerTokens(owner.address, "0")).to.equal("1");
            expect(await token._ownedTokenIndex("1")).to.equal("0");
            expect(await token.totalSupply()).to.equal("1");

            const tx2 = await token.connect(owner)._mint(owner.address, "2", "hello-world2");
            await tx2.wait()
            expect(await token._balances(owner.address)).to.equal("2");
            expect(await token._owners("2")).to.equal(owner.address);
            expect(await token._tokenURLIs("2")).to.equal("hello-world2");
            expect(await token.showOwnerTokens(owner.address, "1")).to.equal("2");
            expect(await token._ownedTokenIndex("2")).to.equal("1");
            expect(await token.totalSupply()).to.equal("2");

            // checking revert require
            await expect(token.connect(owner)._mint(ethers.constants.AddressZero, "3", "z")).to.be.revertedWith("Mint to zero address");
            await expect(token.connect(owner)._mint(owner.address, "2", "aaaa")).to.be.revertedWith("Token already minted")
        })

        it("Should return protect mint to contract not wallet from _safeMint()", async ()=>{
            // mint token
            const tx1 = await token.connect(owner).safeMint(owner.address, "1", "test");
            await tx1.wait();
            expect(await token._balances(owner.address)).to.equal("1");
        })

        it("Should return token index and revert of require", async ()=>{
            
            // mint token 
            const tx1 = await token.connect(owner)._mint(owner.address, "1", "aaaa");
            await tx1.wait();
            expect(await token._balances(owner.address)).to.equal("1");
            //expect(await token.tokenByIndex("0")).to.equal("aaaa")
        })
    })


})