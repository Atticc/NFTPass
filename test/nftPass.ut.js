const {use, expect} = require('chai');
const {ContractFactory, utils} = require('ethers');
const {MockProvider} = require('@ethereum-waffle/provider');
const {waffleChai} = require('@ethereum-waffle/chai');
const {deployMockContract} = require('@ethereum-waffle/mock-contract');

use(waffleChai);

const IERC721 = require('../build/IERC721');
const NFTPass = require('../build/NFTPass');

describe('NFTPass Check whietlist', () => {

    async function setup() {
      const provider  = new MockProvider();  
      const [sender, other] = provider.getWallets();
      const mockERC721 = await deployMockContract(sender, IERC721.abi);
      const contractFactory = new ContractFactory(NFTPass.abi, NFTPass.bytecode, sender);
      const contract = await contractFactory.deploy("ATTPASS", "NFTPASS", "https://metadata.attic.xyz");
      return {sender, other, contract, mockERC721, provider};
    }

    it('returns true if NFT contract is invited.', async () => {
        const {other, contract, mockERC721} = await setup();
        await mockERC721.mock.balanceOf.withArgs(other.address).returns(1);
        await contract.inviteCommunity(mockERC721.address);
        console.log("erc721 addres " +mockERC721.address);
        const ifWhiteListed = await contract.connect(other).checkWhitelist(mockERC721.address, 0, 0);
        console.log("check whitelist result + ", ifWhiteListed)
        expect(ifWhiteListed).to.be.true;
    });

    it('check if user already free minted NFT pass', async () => {
        const {sender, other, contract, mockERC721} = await setup();
        await mockERC721.mock.balanceOf.returns(1);
        await contract.inviteCommunity(mockERC721.address);
        await contract.connect(other).mint(mockERC721.address, 0, 0, 1);
        const ifMintedAlready = await contract.checkUserMinted(other.address);
        expect(ifMintedAlready).to.be.true;
    });

    it('mint by payment - successful', async () => {
        const {sender, other, contract, mockERC721} = await setup();
        await mockERC721.mock.balanceOf.returns(1);
        await contract.setPrice(utils.parseEther("0.1"));
        await contract.connect(other).mint(mockERC721.address, 0, 0, 1, {value: utils.parseEther("0.1")});
        const balance = await contract.balanceOf(other.address);
        expect(balance).to.equal(1);
    });

    it('insufficient payment - mint failed ', async () => {
        const {sender, other, contract, mockERC721} = await setup();
        await mockERC721.mock.balanceOf.returns(1);
        await contract.setPrice(utils.parseEther("0.1"));
        await expect(contract.connect(other).mint(mockERC721.address, 0, 0, 2, {value: utils.parseEther("0.1")})).to.be.reverted;
    });

    it('quantity over total seats of NFT pass - mint failed ', async () => {
        const {sender, other, contract, mockERC721} = await setup();
        await mockERC721.mock.balanceOf.returns(1);
        await contract.setPrice(utils.parseEther("0.1"));
        await expect(contract.connect(other).mint(mockERC721.address, 0, 0, 5556, {value: utils.parseEther("555.6")})).to.be.reverted;
    });

    it('2 free mints - 1st successful, 2nd failed', async () => {
        const {other, contract, mockERC721} = await setup();
        await mockERC721.mock.balanceOf.withArgs(other.address).returns(1);
        await contract.inviteCommunity(mockERC721.address);
        await contract.connect(other).mint(mockERC721.address, 0, 0, 1);
        const ifMintedAlready = await contract.checkUserMinted(other.address);
        expect(ifMintedAlready).to.be.true;
        const balance = await contract.balanceOf(other.address);
        expect(balance).to.equal(1);
        // user can only do free mint once
        await expect(contract.connect(other).mint(mockERC721.address, 0, 0, 1)).to.be.reverted;
    });

    it('withdraw successful', async () => {
        const {sender, other, contract, mockERC721, provider} = await setup();
        await mockERC721.mock.balanceOf.returns(1);
        await contract.setPrice(utils.parseEther("0.1"));
        await contract.connect(other).mint(mockERC721.address, 0, 0, 10, {value: utils.parseEther("1")});
        const balance0ETH = await provider.getBalance(sender.address);
        console.log("balance of eth " + balance0ETH);
        await contract.withdraw();
        const balance1ETH = await provider.getBalance(sender.address);
        console.log("balance of eth " + (balance1ETH - balance0ETH));
        const addedAmt = balance1ETH - balance0ETH;
        console.log("increased amount " + addedAmt);
        expect(addedAmt).to.be.greaterThan(1000000000000000000);
    });
});