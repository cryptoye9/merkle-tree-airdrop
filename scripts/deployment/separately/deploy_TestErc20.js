const hre = require("hardhat");
const { ethers, network, waffle } = hre;
const { utils } = require("ethers");
const { verify, getAddressSaver } = require("../utilities/helpers");
const path = require("path");
const { deployContract } = waffle;

const TestRC20Artifact = require("../../../artifacts/contracts/TestERC20.sol/TestERC20.json");

async function main() {
    const [deployer] = await ethers.getSigners();

    // Deployed contract address saving functionality
    const network = 'BSCSCAN_TESTNET'; // Getting of the current network
    // Path for saving of addresses of deployed contracts
    const addressesPath = path.join(__dirname, "../deploymentAddresses.json");
    // The function to save an address of a deployed contract to the specified file and to output to console
    const saveAddress = getAddressSaver(addressesPath, network, true);

    const totalSupply = utils.parseEther("1000000000").toString()
    const AirdropToken = (await ethers.getContractFactory("TestERC20")).connect(deployer);
    const airdropToken = await AirdropToken.deploy(totalSupply);
    await airdropToken.deployed();

    // Saving of an address of the deployed contract to the file
    saveAddress("airdropToken", airdropToken.address);

    // Verification of the deployed contract
    await verify(airdropToken.address, [totalSupply]); 
    console.log("Deployment is completed.");
}

// This pattern is recommended to be able to use async/await everywhere and properly handle errors
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});