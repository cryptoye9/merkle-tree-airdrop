const { ethers, network, waffle } = require("hardhat");
const { utils } = require("ethers");
const keccak256 = require("keccak256");
const { AddressZero } = require("@ethersproject/constants");
const chai = require("chai");

const MerkleAirdropDistributorArtifact = require("../artifacts/contracts/MerkleAirdrop.sol/MerkleAirdrop.json");
const TestRC20Artifact = require("../artifacts/contracts/TestERC20.sol/TestERC20.json");

const { MerkleTree } = require("merkletreejs");

const { expect } = chai;
const { deployContract } = waffle;

let airdropData = {}
let merkleTree;

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

describe("MerkleAirdrop", () => {
  let merkleAirdrop;
  let airdropToken;

  let deployer;
  let user0;
  let user1;
  let hacker;

  before(async () => {
    [deployer, user0, user1, hacker] = await ethers.getSigners();

    merkleAirdrop = (await deployContract(
      deployer,
      MerkleAirdropDistributorArtifact
    ));

    const totalSupply = utils.parseEther("1000000000").toString()
    airdropToken = (await deployContract(deployer, TestRC20Artifact, [
        totalSupply,
    ]));

    await airdropToken.connect(deployer).transfer(merkleAirdrop.address, totalSupply)

    airdropData = {
      [user0.address]: utils.parseEther("100").toString(),
      [user1.address]: utils.parseEther("200").toString(),
    };


    merkleTree = new MerkleTree(
        Object.entries(airdropData).map(([_user, _amount]) =>
          node(airdropToken.address, _user, _amount)
        ),
        keccak256,
        { sortPairs: true }
    )
  });

  describe("Init Airdrop", () => {
      it("# initArdrop", async () => {
        await merkleAirdrop.connect(deployer).initAirdrop(airdropToken.address, merkleTree.getHexRoot());
        expect(await merkleAirdrop.airdropToken()).to.eq(airdropToken.address);
      });

      it("revert when initArdrop with airdrop token zero address", async () => {
        await expect(
            merkleAirdrop
              .connect(deployer)
              .initAirdrop(AddressZero, merkleTree.getHexRoot()
          )).to.be.revertedWith("Airdrop token cant be zero address");
      });
  });

  describe("Claim Airdrops", () => {
    it("# claimAirdrop (user1)", async () => {
        const _user = user0;
        const _amount = airdropData[_user.address];

        const proof = merkleTree.getHexProof(
          node(airdropToken.address, _user.address, _amount)
        );

        const preBalance = await airdropToken.balanceOf(_user.address);
        await merkleAirdrop
          .connect(_user)
          .claim(_user.address, _amount, proof);
        const postBalance = await airdropToken.balanceOf(_user.address);

        expect(postBalance.sub(preBalance)).to.eq(_amount);
      });

      it("# claimAirdrop (user2)", async () => {
        const _user = user1;
        const _amount = airdropData[_user.address];

        const proof = merkleTree.getHexProof(
          node(airdropToken.address, _user.address, _amount)
        );

        const preBalance = await airdropToken.balanceOf(_user.address);
        await merkleAirdrop
          .connect(_user)
          .claim(_user.address, _amount, proof);
        const postBalance = await airdropToken.balanceOf(_user.address);

        expect(postBalance.sub(preBalance)).to.eq(_amount);
      });

      it("revert when claiming tokens for the second time", async () => {
        const _user = user0;
        const _amount = airdropData[_user.address];

        const proof = merkleTree.getHexProof(
          node(airdropToken.address, _user.address, _amount)
        );

        await expect(
          merkleAirdrop
            .connect(_user)
            .claim(_user.address, _amount, proof)
        ).to.revertedWith("Airdrop already claimed");
      });

      it("revert when hacker tries to claim tokens", async () => {
        const _user = hacker;
        const _amount = utils.parseEther("100").toString();

        const proof = merkleTree.getHexProof(
              Buffer.from(
                ethers.utils
                  .solidityKeccak256(
                    ["address", "address", "uint256"],
                    [airdropToken.address, _user.address, _amount]
                  )
                  .slice(2),
                "hex"
              )
        );

        await expect(
          merkleAirdrop
            .connect(_user)
            .claim(_user.address, _amount, proof)
        ).to.revertedWith("Merkle verification failed");
      });
  });
});