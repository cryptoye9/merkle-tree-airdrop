// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestERC20 is ERC20 {
  constructor(uint256 totalSupply) ERC20("ERR20", "ERR") {
    _mint(msg.sender, totalSupply);
  }
}