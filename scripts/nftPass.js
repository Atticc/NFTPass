// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
async function main() {
    console.log("deploying smart contract");
    const nftContract = await hre.ethers.getContractFactory("NFTPass");
    const nft = await nftContract.deploy("NFTPass", "ATTPASS", "https://metadata.attic.xyz");
    await nft.deployed();
    console.log("Lock with 1 ETH deployed to:", nft.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
