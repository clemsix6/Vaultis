// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IKYCRegistry {
    function isAuthorized(address account) external view returns (bool);
}

/// @title WatchShareToken — ERC-20 fractional shares for a tokenized watch
/// @notice Each WatchNFT can have an associated WatchShareToken.
///         KYC is enforced on every transfer via KYCRegistry.
contract WatchShareToken is ERC20, Ownable {
    error ReceiverNotAuthorized();
    error SenderNotAuthorized();
    error ZeroAddressRegistry();
    error ZeroSupply();

    event SharesMinted(address indexed to, uint256 amount);

    IKYCRegistry public kycRegistry;
    uint256 public watchTokenId;
    uint8 private immutable _decimals;

    constructor(
        string memory name_,
        string memory symbol_,
        address initialOwner,
        address registry,
        uint256 _watchTokenId,
        uint256 totalShares
    ) ERC20(name_, symbol_) Ownable(initialOwner) {
        if (registry == address(0)) revert ZeroAddressRegistry();
        if (totalShares == 0) revert ZeroSupply();
        kycRegistry = IKYCRegistry(registry);
        watchTokenId = _watchTokenId;
        _decimals = 18;
        _mint(initialOwner, totalShares);
        emit SharesMinted(initialOwner, totalShares);
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function setKYCRegistry(address registry) external onlyOwner {
        if (registry == address(0)) revert ZeroAddressRegistry();
        kycRegistry = IKYCRegistry(registry);
    }

    /// @dev KYC enforcement on every transfer (mint, burn, transfer).
    ///      Mints (from == 0) skip sender check. Burns (to == 0) skip receiver check.
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override {
        if (from != address(0) && !kycRegistry.isAuthorized(from))
            revert SenderNotAuthorized();
        if (to != address(0) && !kycRegistry.isAuthorized(to))
            revert ReceiverNotAuthorized();
        super._update(from, to, value);
    }
}
