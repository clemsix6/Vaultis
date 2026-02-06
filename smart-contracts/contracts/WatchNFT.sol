// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IKYCRegistry {
    function isAuthorized(address account) external view returns (bool);
}

contract WatchNFT is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {
    error ReceiverNotAuthorized();
    error SenderNotAuthorized();
    error ZeroAddressRegistry();

    event WatchMinted(uint256 indexed tokenId, address indexed to, string uri);
    event KYCRegistryUpdated(address indexed newRegistry);

    IKYCRegistry public kycRegistry;
    uint256 private _nextTokenId;

    constructor(
        address initialOwner,
        address registry
    ) ERC721("LuxWatch", "LWATCH") Ownable(initialOwner) {
        if (registry == address(0)) revert ZeroAddressRegistry();
        kycRegistry = IKYCRegistry(registry);
    }

    function mint(address to, string calldata uri) external onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        emit WatchMinted(tokenId, to, uri);
    }

    function setKYCRegistry(address registry) external onlyOwner {
        if (registry == address(0)) revert ZeroAddressRegistry();
        kycRegistry = IKYCRegistry(registry);
        emit KYCRegistryUpdated(registry);
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && !kycRegistry.isAuthorized(from))
            revert SenderNotAuthorized();
        if (to != address(0) && !kycRegistry.isAuthorized(to))
            revert ReceiverNotAuthorized();
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
