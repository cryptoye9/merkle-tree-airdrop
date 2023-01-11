const hre = require("hardhat");
const { ethers } = hre;
const path = require("path");
const { utils } = require("ethers");
const keccak256 = require("keccak256");
const { AddressZero } = require("@ethersproject/constants");
const chai = require("chai");
const { expect } = chai;
const { MerkleTree } = require("merkletreejs");


const deploymentAddresses = require("./deployment/deploymentAddresses.json")
const airdropData = require("./airdropUsers.json")

const MerkleAirdropAbi = require("../artifacts/contracts/MerkleAirdrop.sol/MerkleAirdrop.json");

const node = (_token, _user, _amount) => {
    return Buffer.from(
      ethers.utils
        .solidityKeccak256(
          ["address", "address", "uint256"],
          [_token, _user, airdropData[_user]]
        )
        .slice(2),
      "hex"
    );
};

async function main() {

    const [deployer] = await ethers.getSigners();

    const merkleAirdrop_addr = deploymentAddresses.BSCSCAN_TESTNET.new.merkleAirdrop;
    const airdropToken_addr = deploymentAddresses.BSCSCAN_TESTNET.new.airdropToken;

    const merkleAirdrop = await ethers.getContractAt("MerkleAirdrop", merkleAirdrop_addr)

    const merkleTree = new MerkleTree(
        Object.entries(airdropData).map(([_user, _amount]) =>
          node(airdropToken_addr, _user, _amount)
        ),
        keccak256,
        { sortPairs: true }
    )


    await merkleAirdrop.connect(deployer).initAirdrop(airdropToken_addr, merkleTree.getHexRoot());
    expect(await merkleAirdrop.airdropToken()).to.eq(airdropToken_addr);
}

// This pattern is recommended to be able to use async/await everywhere and properly handle errors
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});