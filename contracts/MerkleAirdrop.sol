// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { MerkleProof } from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract MerkleAirdrop is Ownable {
    using SafeERC20 for IERC20;

    address public airdropToken;
    bytes32 root;

    mapping(address => bool) public isAirdropClaimed;

    event AirdropClaimed(address indexed user, address indexed token, uint256 amount);

    function claim(
        address _user,
        uint256 _amount,
        bytes32[] calldata _merkleProof
    ) external {
        require(!isAirdropClaimed[_user], "Airdrop already claimed");

        require(
            isPartOfMerkleTree(
                _user,
                _amount,
                _merkleProof
            ),
            "Merkle verification failed"
        );

        isAirdropClaimed[_user] = true;

        IERC20(airdropToken).safeTransfer(_user, _amount);

        emit AirdropClaimed(_user, airdropToken, _amount);
    }

    function isPartOfMerkleTree(
        address _user,
        uint256 _amount,
        bytes32[] calldata _merkleProof
    ) public view returns (bool) {
        bytes32 node = keccak256(abi.encodePacked(airdropToken, _user, _amount));
        return MerkleProof.verify(_merkleProof, root, node);
    }

    function initAirdrop(address _airdropToken, bytes32 _root) external onlyOwner {
       require(_airdropToken != address(0), "Airdrop token cant be zero address");
       airdropToken = _airdropToken;
       root = _root;
    }
}