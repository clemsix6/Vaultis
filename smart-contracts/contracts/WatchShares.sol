// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IKYCRegistry {
    function isAuthorized(address account) external view returns (bool);
}

/**
 * @title WatchShares
 * @notice ERC-20 token representing fractional ownership of a luxury watch NFT.
 *         Transfers are KYC-gated: both sender and receiver must be authorized.
 */
contract WatchShares is ERC20, Ownable {
    error ReceiverNotAuthorized();
    error SenderNotAuthorized();
    error ZeroAddressRegistry();
    error ZeroTotalShares();

    event KYCRegistryUpdated(address indexed newRegistry);

    IKYCRegistry public kycRegistry;

    /// @notice The WatchNFT token ID this share token is linked to
    uint256 public immutable watchTokenId;

    /// @notice Price per share in USD (scaled by 1e2, e.g. 1500 = $15.00)
    uint256 public immutable pricePerShare;

    /// @dev Skips KYC check during constructor mint
    bool private _initializing;

    constructor(
        string memory name_,
        string memory symbol_,
        address initialOwner,
        address registry,
        uint256 _watchTokenId,
        uint256 _totalShares,
        uint256 _pricePerShare
    ) ERC20(name_, symbol_) Ownable(initialOwner) {
        if (registry == address(0)) revert ZeroAddressRegistry();
        if (_totalShares == 0) revert ZeroTotalShares();

        kycRegistry = IKYCRegistry(registry);
        watchTokenId = _watchTokenId;
        pricePerShare = _pricePerShare;

        // Mint all shares to the owner — skip KYC for initial distribution
        _initializing = true;
        _mint(initialOwner, _totalShares * 10 ** decimals());
        _initializing = false;
    }

    function setKYCRegistry(address registry) external onlyOwner {
        if (registry == address(0)) revert ZeroAddressRegistry();
        kycRegistry = IKYCRegistry(registry);
        emit KYCRegistryUpdated(registry);
    }

    /**
     * @dev Override _update to enforce KYC on every transfer.
     *      Minting (from == address(0)) only checks receiver.
     *      Burning (to == address(0)) only checks sender.
     *      Regular transfers check both.
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override {
        // Skip KYC during constructor mint
        if (!_initializing) {
            if (from != address(0) && !kycRegistry.isAuthorized(from))
                revert SenderNotAuthorized();
            if (to != address(0) && !kycRegistry.isAuthorized(to))
                revert ReceiverNotAuthorized();
        }
        super._update(from, to, value);
    }
}
