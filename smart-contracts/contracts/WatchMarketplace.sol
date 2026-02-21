// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IKYCRegistry {
    function isAuthorized(address account) external view returns (bool);
}

/// @title WatchMarketplace — NFT marketplace with escrow and KYC enforcement
/// @notice Users can list WatchNFTs for sale; buyers pay in RSX (WatchShareToken).
contract WatchMarketplace is IERC721Receiver, Ownable {
    // --- Errors ---
    error NotAuthorized();
    error NotSeller();
    error ListingNotActive();
    error ZeroPriceNotAllowed();
    error AlreadyListed();

    // --- Events ---
    event WatchListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event WatchSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event WatchDelisted(uint256 indexed tokenId, address indexed seller);

    // --- Structs ---
    struct Listing {
        address seller;
        uint256 price;
        bool isActive;
    }

    // --- State ---
    IERC721 public immutable watchNFT;
    IERC20 public paymentToken;
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
        address _paymentToken,
        address _kycRegistry,
        address initialOwner
    ) Ownable(initialOwner) {
        watchNFT = IERC721(_watchNFT);
        paymentToken = IERC20(_paymentToken);
        kycRegistry = IKYCRegistry(_kycRegistry);
    }

    /// @notice List a WatchNFT for sale. Caller must own the NFT and have approved this contract.
    function listWatch(uint256 tokenId, uint256 _price) external onlyKYCAuthorized {
        if (_price == 0) revert ZeroPriceNotAllowed();
        if (listings[tokenId].isActive) revert AlreadyListed();

        // Transfer NFT to this contract (escrow)
        watchNFT.transferFrom(msg.sender, address(this), tokenId);

        listings[tokenId] = Listing({
            seller: msg.sender,
            price: _price,
            isActive: true
        });

        _listingIndex[tokenId] = activeListingIds.length;
        activeListingIds.push(tokenId);

        emit WatchListed(tokenId, msg.sender, _price);
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

    /// @notice Buy a listed WatchNFT. Buyer must have approved this contract to spend RSX.
    function buyWatch(uint256 tokenId) external onlyKYCAuthorized {
        Listing storage listing = listings[tokenId];
        if (!listing.isActive) revert ListingNotActive();

        address seller = listing.seller;
        uint256 price = listing.price;

        // Effects before interactions
        listing.isActive = false;
        _removeFromActiveList(tokenId);

        // Transfer RSX from buyer to seller
        paymentToken.transferFrom(msg.sender, seller, price);

        // Transfer NFT to buyer
        watchNFT.transferFrom(address(this), msg.sender, tokenId);

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

    /// @notice Update the payment token (owner only).
    function setPaymentToken(address _paymentToken) external onlyOwner {
        paymentToken = IERC20(_paymentToken);
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
