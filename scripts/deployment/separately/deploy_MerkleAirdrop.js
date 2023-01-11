const hre = require("hardhat");
const { ethers } = hre;
const { verify, getAddressSaver } = require("../utilities/helpers");
const path = require("path");
const deploymentAddresses = require("../deploymentAddresses.json")

const AIRDROP_AMOUNT = ethers.utils.parseUnits('10000.0');

const ver = async function verifyContracts(address, arguments) {
  await hre
      .run('verify:verify', {
          address: address,
          constructorArguments: arguments,
      }).catch((err) => console.log(err))
}

async function main() {
    const [deployer] = await ethers.getSigners();

    // Deployed contract address saving functionality
    const network = 'BSCSCAN_TESTNET'; // Getting of the current network
    // Path for saving of addresses of deployed contracts
    const addressesPath = path.join(__dirname, "../deploymentAddresses.json");
    // The function to save an address of a deployed contract to the specified file and to output to console
    const saveAddress = getAddressSaver(addressesPath, network, true);

    const airdropToken_addr = deploymentAddresses.BSCSCAN_TESTNET.new.airdropToken;

    const airdropToken = await ethers.getContractAt("TestERC20", airdropToken_addr)

    const MerkleAirdrop = (await ethers.getContractFactory("MerkleAirdrop")).connect(deployer);
    const merkleAirdrop = await MerkleAirdrop.deploy();
    await merkleAirdrop.deployed();
    saveAddress("merkleAirdrop", merkleAirdrop.address);

    await airdropToken.connect(deployer).transfer(merkleAirdrop.address, AIRDROP_AMOUNT)

    // Verification of the deployed contract
    await ver(merkleAirdrop.address, []); 
    console.log("Deployment is completed.");
}

// This pattern is recommended to be able to use async/await everywhere and properly handle errors
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});