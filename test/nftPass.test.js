// const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
// const { expect } = require('chai');
// const { ZERO_ADDRESS } = constants;

// const NFTPass = artifacts.require('./contracts/core/token/NFTPass.sol');

// contract('NFTPass', function (accounts) {
//     const [ owner, other ] = accounts;
    
//     beforeEach(async function () {
//         this.nftPass = await NFTPass.new("ATTPASS", "NFTPASS", "https://metadata.attic.xyz");
//         await this.nftPass.inviteCommunity('0xa2A51e040cD5a5F5568066FDA14d9Be4045158B1', {"from": owner});
//     });

//     it('has correct subscriptionId', async function () {
//         expect(await this.nftPass.checkNFTWhitelist('0xa2A51e040cD5a5F5568066FDA14d9Be4045158B1')).equal(true);
//     });
// });