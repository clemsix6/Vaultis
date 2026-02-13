// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IKYCRegistry {
    function isAuthorized(address account) external view returns (bool);
}

/**
 * @title WatchSwapPool
 * @notice Simple AMM (Automated Market Maker) pool for WatchShares/ETH trading.
 *         Implements constant product formula (x * y = k) with 0.3% swap fee.
 *         All interactions require KYC authorization.
 *
 *         NOTE: This pool contract must be whitelisted in the KYCRegistry
 *         to hold and transfer KYC-gated WatchShares tokens.
 */
contract WatchSwapPool is Ownable {
    // ── Errors ──
    error NotAuthorized();
    error ZeroAmount();
    error InsufficientLiquidity();
    error SlippageExceeded();
    error InsufficientLPBalance();
    error TransferFailed();
    error ZeroAddress();

    // ── Events ──
    event LiquidityAdded(
        address indexed provider,
        uint256 sharesAmount,
        uint256 ethAmount,
        uint256 lpMinted
    );
    event LiquidityRemoved(
        address indexed provider,
        uint256 sharesAmount,
        uint256 ethAmount,
        uint256 lpBurned
    );
    event Swap(
        address indexed trader,
        bool ethToShares,
        uint256 amountIn,
        uint256 amountOut
    );

    // ── State ──
    IERC20 public immutable sharesToken;
    IKYCRegistry public kycRegistry;

    uint256 public reserveShares;
    uint256 public reserveETH;

    /// @notice LP token balances (internal accounting, not a separate ERC-20)
    uint256 public totalLP;
    mapping(address => uint256) public lpBalance;

    /// @notice Swap fee: 0.3% (numerator = 997, denominator = 1000)
    uint256 public constant FEE_NUMERATOR = 997;
    uint256 public constant FEE_DENOMINATOR = 1000;

    // ── Modifiers ──
    modifier onlyAuthorized() {
        if (!kycRegistry.isAuthorized(msg.sender)) revert NotAuthorized();
        _;
    }

    constructor(
        address _sharesToken,
        address _kycRegistry,
        address _owner
    ) Ownable(_owner) {
        if (_sharesToken == address(0) || _kycRegistry == address(0))
            revert ZeroAddress();
        sharesToken = IERC20(_sharesToken);
        kycRegistry = IKYCRegistry(_kycRegistry);
    }

    // ── Liquidity ──

    /**
     * @notice Add liquidity to the pool. On first deposit the caller sets the price ratio.
     *         On subsequent deposits the caller must provide tokens proportional to reserves.
     * @param sharesAmount Amount of WatchShares to deposit
     */
    function addLiquidity(uint256 sharesAmount) external payable onlyAuthorized {
        if (msg.value == 0 || sharesAmount == 0) revert ZeroAmount();

        uint256 lpMinted;

        if (totalLP == 0) {
            // First deposit — caller sets the initial price
            lpMinted = _sqrt(msg.value * sharesAmount);
        } else {
            // Proportional deposit
            uint256 lpFromETH = (msg.value * totalLP) / reserveETH;
            uint256 lpFromShares = (sharesAmount * totalLP) / reserveShares;
            lpMinted = lpFromETH < lpFromShares ? lpFromETH : lpFromShares;
        }

        if (lpMinted == 0) revert ZeroAmount();

        // Transfer shares from sender to pool
        sharesToken.transferFrom(msg.sender, address(this), sharesAmount);

        reserveETH += msg.value;
        reserveShares += sharesAmount;
        totalLP += lpMinted;
        lpBalance[msg.sender] += lpMinted;

        emit LiquidityAdded(msg.sender, sharesAmount, msg.value, lpMinted);
    }

    /**
     * @notice Remove liquidity and receive proportional shares + ETH.
     * @param lpAmount Amount of LP tokens to burn
     */
    function removeLiquidity(uint256 lpAmount) external onlyAuthorized {
        if (lpAmount == 0) revert ZeroAmount();
        if (lpAmount > lpBalance[msg.sender]) revert InsufficientLPBalance();

        uint256 ethAmount = (lpAmount * reserveETH) / totalLP;
        uint256 sharesAmount = (lpAmount * reserveShares) / totalLP;

        lpBalance[msg.sender] -= lpAmount;
        totalLP -= lpAmount;
        reserveETH -= ethAmount;
        reserveShares -= sharesAmount;

        sharesToken.transfer(msg.sender, sharesAmount);
        (bool ok,) = payable(msg.sender).call{value: ethAmount}("");
        if (!ok) revert TransferFailed();

        emit LiquidityRemoved(msg.sender, sharesAmount, ethAmount, lpAmount);
    }

    // ── Swaps ──

    /**
     * @notice Swap ETH for WatchShares.
     * @param minSharesOut Minimum shares to receive (slippage protection)
     */
    function swapETHForShares(uint256 minSharesOut) external payable onlyAuthorized {
        if (msg.value == 0) revert ZeroAmount();
        if (reserveShares == 0 || reserveETH == 0) revert InsufficientLiquidity();

        uint256 sharesOut = getAmountOut(msg.value, reserveETH, reserveShares);
        if (sharesOut < minSharesOut) revert SlippageExceeded();

        reserveETH += msg.value;
        reserveShares -= sharesOut;

        sharesToken.transfer(msg.sender, sharesOut);

        emit Swap(msg.sender, true, msg.value, sharesOut);
    }

    /**
     * @notice Swap WatchShares for ETH.
     * @param sharesIn Amount of shares to swap
     * @param minETHOut Minimum ETH to receive (slippage protection)
     */
    function swapSharesForETH(uint256 sharesIn, uint256 minETHOut) external onlyAuthorized {
        if (sharesIn == 0) revert ZeroAmount();
        if (reserveShares == 0 || reserveETH == 0) revert InsufficientLiquidity();

        uint256 ethOut = getAmountOut(sharesIn, reserveShares, reserveETH);
        if (ethOut < minETHOut) revert SlippageExceeded();

        sharesToken.transferFrom(msg.sender, address(this), sharesIn);

        reserveShares += sharesIn;
        reserveETH -= ethOut;

        (bool ok,) = payable(msg.sender).call{value: ethOut}("");
        if (!ok) revert TransferFailed();

        emit Swap(msg.sender, false, sharesIn, ethOut);
    }

    // ── View helpers ──

    /**
     * @notice Calculate output amount for a swap using constant product formula.
     *         Includes 0.3% fee.
     */
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256) {
        if (amountIn == 0 || reserveIn == 0 || reserveOut == 0) return 0;
        uint256 amountInWithFee = amountIn * FEE_NUMERATOR;
        return (amountInWithFee * reserveOut) / (reserveIn * FEE_DENOMINATOR + amountInWithFee);
    }

    /**
     * @notice Get the current price of 1 share in ETH (scaled by 1e18).
     */
    function getSharePriceInETH() external view returns (uint256) {
        if (reserveShares == 0) return 0;
        return (reserveETH * 1e18) / reserveShares;
    }

    // ── Admin ──

    function setKYCRegistry(address _kycRegistry) external onlyOwner {
        if (_kycRegistry == address(0)) revert ZeroAddress();
        kycRegistry = IKYCRegistry(_kycRegistry);
    }

    // ── Internals ──

    function _sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}
