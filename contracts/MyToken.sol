// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title MyToken (MTK)
/// @notice ERC20 token. The whole initial supply goes to the deployer,
///         who becomes the owner and is the only account allowed to mint more.
contract MyToken is ERC20, Ownable {
    constructor(uint256 initialSupply)
        ERC20("MyToken", "MTK")
        Ownable(msg.sender)
    {
        _mint(msg.sender, initialSupply);
    }

    /// @notice Creates `amount` new tokens for `to`. Only the owner can call it.
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
