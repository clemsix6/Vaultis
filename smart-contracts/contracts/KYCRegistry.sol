// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract KYCRegistry is Ownable {
    error EmptyArray();

    event Whitelisted(address indexed account);
    event RemovedFromWhitelist(address indexed account);
    event Blacklisted(address indexed account);
    event RemovedFromBlacklist(address indexed account);

    mapping(address => bool) public whitelisted;
    mapping(address => bool) public blacklisted;

    constructor(address initialOwner) Ownable(initialOwner) {}

    function isAuthorized(address account) external view returns (bool) {
        return whitelisted[account] && !blacklisted[account];
    }

    function whitelist(address account) external onlyOwner {
        whitelisted[account] = true;
        emit Whitelisted(account);
    }

    function removeFromWhitelist(address account) external onlyOwner {
        whitelisted[account] = false;
        emit RemovedFromWhitelist(account);
    }

    function blacklist(address account) external onlyOwner {
        blacklisted[account] = true;
        emit Blacklisted(account);
    }

    function removeFromBlacklist(address account) external onlyOwner {
        blacklisted[account] = false;
        emit RemovedFromBlacklist(account);
    }

    function batchWhitelist(address[] calldata accounts) external onlyOwner {
        if (accounts.length == 0) revert EmptyArray();
        for (uint256 i = 0; i < accounts.length; i++) {
            whitelisted[accounts[i]] = true;
            emit Whitelisted(accounts[i]);
        }
    }

    function batchBlacklist(address[] calldata accounts) external onlyOwner {
        if (accounts.length == 0) revert EmptyArray();
        for (uint256 i = 0; i < accounts.length; i++) {
            blacklisted[accounts[i]] = true;
            emit Blacklisted(accounts[i]);
        }
    }
}
