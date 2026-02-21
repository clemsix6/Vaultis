// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IKYCRegistry {
    function isAuthorized(address account) external view returns (bool);
}

/// @title WatchMarketplace — NFT marketplace with escrow and KYC enforcement
/// @notice Users can list WatchNFTs for sale; buyers pay in ETH.
contract WatchMarketplace is IERC721Receiver, Ownable {
    // --- Errors ---
    error NotAuthorized();
    error NotSeller();
    error ListingNotActive();
    error IncorrectPayment();
    error ZeroPriceNotAllowed();
    error TransferFailed();
    error AlreadyListed();

    // --- Events ---
    event WatchListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event WatchSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event WatchDelisted(uint256 indexed tokenId, address indexed seller);

    // --- Structs ---
    struct Listing {
        address seller;
        uint256 priceInWei;
        bool isActive;
    }

    // --- State ---
    IERC721 public immutable watchNFT;
    IKYCRegistry public kycRegistry;

    mapping(uint256 => Listing) public listings;
    uint256[] public activeListingIds;
    mapping(uint256 => uint256) private _listingIndex;

    // --- Modifiers ---
    modifier onlyKYCAuthorized() {
        if (!kycRegistry.isAuthorized(msg.sender)) revert NotAuthorized();
        _;
    }

    constructor(
        address _watchNFT,
        address _kycRegistry,
        address initialOwner
    ) Ownable(initialOwner) {
        watchNFT = IERC721(_watchNFT);
        kycRegistry = IKYCRegistry(_kycRegistry);
    }

    /// @notice List a WatchNFT for sale. Caller must own the NFT and have approved this contract.
    function listWatch(uint256 tokenId, uint256 priceInWei) external onlyKYCAuthorized {
        if (priceInWei == 0) revert ZeroPriceNotAllowed();
        if (listings[tokenId].isActive) revert AlreadyListed();

        // Transfer NFT to this contract (escrow)
        watchNFT.transferFrom(msg.sender, address(this), tokenId);

        listings[tokenId] = Listing({
            seller: msg.sender,
            priceInWei: priceInWei,
            isActive: true
        });

        _listingIndex[tokenId] = activeListingIds.length;
        activeListingIds.push(tokenId);

        emit WatchListed(tokenId, msg.sender, priceInWei);
    }

    /// @notice Cancel a listing and return the NFT to the seller.
    function cancelListing(uint256 tokenId) external {
        Listing storage listing = listings[tokenId];
        if (!listing.isActive) revert ListingNotActive();
        if (listing.seller != msg.sender) revert NotSeller();

        listing.isActive = false;
        _removeFromActiveList(tokenId);

        watchNFT.transferFrom(address(this), msg.sender, tokenId);

        emit WatchDelisted(tokenId, msg.sender);
    }

    /// @notice Buy a listed WatchNFT. Must send exact ETH amount.
    function buyWatch(uint256 tokenId) external payable onlyKYCAuthorized {
        Listing storage listing = listings[tokenId];
        if (!listing.isActive) revert ListingNotActive();
        if (msg.value != listing.priceInWei) revert IncorrectPayment();

        address seller = listing.seller;
        uint256 price = listing.priceInWei;

        // Effects before interactions
        listing.isActive = false;
        _removeFromActiveList(tokenId);

        // Transfer NFT to buyer
        watchNFT.transferFrom(address(this), msg.sender, tokenId);

        // Send ETH to seller
        (bool sent, ) = seller.call{value: price}("");
        if (!sent) revert TransferFailed();

        emit WatchSold(tokenId, seller, msg.sender, price);
    }

    /// @notice Get the number of active listings.
    function getActiveListingCount() external view returns (uint256) {
        return activeListingIds.length;
    }

    /// @notice Get a page of active listing token IDs.
    function getActiveListings(uint256 offset, uint256 limit)
        external
        view
        returns (uint256[] memory tokenIds)
    {
        uint256 total = activeListingIds.length;
        if (offset >= total) return new uint256[](0);
        uint256 end = offset + limit > total ? total : offset + limit;
        tokenIds = new uint256[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            tokenIds[i - offset] = activeListingIds[i];
        }
    }

    /// @notice Update the KYC registry address (owner only).
    function setKYCRegistry(address _kycRegistry) external onlyOwner {
        kycRegistry = IKYCRegistry(_kycRegistry);
    }

    /// @dev Required by IERC721Receiver to accept safeTransferFrom.
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    // --- Internal ---
    function _removeFromActiveList(uint256 tokenId) internal {
        uint256 index = _listingIndex[tokenId];
        uint256 lastIndex = activeListingIds.length - 1;
        if (index != lastIndex) {
            uint256 lastTokenId = activeListingIds[lastIndex];
            activeListingIds[index] = lastTokenId;
            _listingIndex[lastTokenId] = index;
        }
        activeListingIds.pop();
        delete _listingIndex[tokenId];
    }
}
