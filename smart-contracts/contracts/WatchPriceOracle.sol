// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title WatchPriceOracle — On-chain price oracle for luxury watches
/// @notice The admin pushes estimated market prices per watch tokenId.
///         Anyone can read the latest price on-chain.
contract WatchPriceOracle is Ownable {
    error ZeroPrice();
    error PriceNotSet(uint256 tokenId);

    event PriceUpdated(uint256 indexed tokenId, uint256 price, uint256 timestamp);

    struct PriceData {
        uint256 price;      // Price in wei (ETH-denominated)
        uint256 updatedAt;  // Timestamp of last update
    }

    mapping(uint256 => PriceData) public prices;

    constructor(address initialOwner) Ownable(initialOwner) {}

    /// @notice Set the estimated price for a watch
    /// @param tokenId The WatchNFT token ID
    /// @param price The price in wei
    function setPrice(uint256 tokenId, uint256 price) external onlyOwner {
        if (price == 0) revert ZeroPrice();
        prices[tokenId] = PriceData(price, block.timestamp);
        emit PriceUpdated(tokenId, price, block.timestamp);
    }

    /// @notice Set prices for multiple watches at once
    /// @param tokenIds Array of WatchNFT token IDs
    /// @param _prices Array of prices in wei
    function batchSetPrices(
        uint256[] calldata tokenIds,
        uint256[] calldata _prices
    ) external onlyOwner {
        require(tokenIds.length == _prices.length, "Length mismatch");
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (_prices[i] == 0) revert ZeroPrice();
            prices[tokenIds[i]] = PriceData(_prices[i], block.timestamp);
            emit PriceUpdated(tokenIds[i], _prices[i], block.timestamp);
        }
    }

    /// @notice Get the latest price for a watch
    /// @param tokenId The WatchNFT token ID
    /// @return price The price in wei
    /// @return updatedAt Timestamp of last update
    function getPrice(uint256 tokenId) external view returns (uint256 price, uint256 updatedAt) {
        PriceData memory data = prices[tokenId];
        if (data.updatedAt == 0) revert PriceNotSet(tokenId);
        return (data.price, data.updatedAt);
    }
}
