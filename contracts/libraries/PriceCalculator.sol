// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PriceCalculator
 * @dev Library for price calculations in BAM Swap
 */
library PriceCalculator {
    uint256 private constant BAM_PRICE = 100; // $0.0000001 in wei
    uint256 private constant PRECISION = 1e18;

    /**
     * @dev Calculate BAM tokens from USD amount
     * @param usdAmount USD amount in wei (18 decimals)
     * @return BAM tokens amount (18 decimals)
     */
    function calculateBAMFromUSD(uint256 usdAmount) internal pure returns (uint256) {
        return (usdAmount * PRECISION) / BAM_PRICE;
    }

    /**
     * @dev Calculate USD value from BNB amount
     * @param bnbAmount BNB amount in wei
     * @param bnbPriceUSD BNB price in USD (18 decimals)
     * @return USD value in wei (18 decimals)
     */
    function calculateUSDFromBNB(uint256 bnbAmount, uint256 bnbPriceUSD) 
        internal 
        pure 
        returns (uint256) 
    {
        return (bnbAmount * bnbPriceUSD) / PRECISION;
    }

    /**
     * @dev Calculate BAM tokens from BNB amount
     * @param bnbAmount BNB amount in wei
     * @param bnbPriceUSD BNB price in USD (18 decimals)
     * @return BAM tokens amount (18 decimals)
     */
    function calculateBAMFromBNB(uint256 bnbAmount, uint256 bnbPriceUSD) 
        internal 
        pure 
        returns (uint256) 
    {
        uint256 usdValue = calculateUSDFromBNB(bnbAmount, bnbPriceUSD);
        return calculateBAMFromUSD(usdValue);
    }
}