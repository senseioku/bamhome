// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IWBNB
 * @dev Wrapped BNB interface for BSC network
 */
interface IWBNB is IERC20 {
    function deposit() external payable;
    function withdraw(uint256 wad) external;
}