// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IKYCRegistry {
    function isAuthorized(address account) external view returns (bool);
}

/// @title SimpleDEX — Constant-product AMM pool (x * y = k) with KYC enforcement
/// @notice A single liquidity pool for tokenA/tokenB with LP token minting.
///         Only KYC-authorized users can add liquidity or swap.
contract SimpleDEX is ERC20, Ownable {
    error NotAuthorized();
    error InsufficientLiquidity();
    error InsufficientAmount();
    error InvalidToken();
    error ZeroAmount();
    error TransferFailed();
    error SlippageExceeded();

    event LiquidityAdded(address indexed provider, uint256 amountA, uint256 amountB, uint256 lpMinted);
    event LiquidityRemoved(address indexed provider, uint256 amountA, uint256 amountB, uint256 lpBurned);
    event Swap(address indexed user, address indexed tokenIn, uint256 amountIn, uint256 amountOut);

    IERC20 public immutable tokenA;
    IERC20 public immutable tokenB;
    IKYCRegistry public kycRegistry;

    uint256 public reserveA;
    uint256 public reserveB;

    uint256 public constant FEE_NUMERATOR = 3;    // 0.3% fee
    uint256 public constant FEE_DENOMINATOR = 1000;

    modifier onlyAuthorized() {
        if (!kycRegistry.isAuthorized(msg.sender)) revert NotAuthorized();
        _;
    }

    constructor(
        address _tokenA,
        address _tokenB,
        address _kycRegistry,
        address initialOwner
    ) ERC20("Vaultis LP Token", "VLP") Ownable(initialOwner) {
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
        kycRegistry = IKYCRegistry(_kycRegistry);
    }

    /// @notice Add liquidity to the pool. First deposit sets the price ratio.
    /// @param amountA Amount of tokenA to deposit
    /// @param amountB Amount of tokenB to deposit
    /// @return lpMinted Amount of LP tokens minted
    function addLiquidity(
        uint256 amountA,
        uint256 amountB
    ) external onlyAuthorized returns (uint256 lpMinted) {
        if (amountA == 0 || amountB == 0) revert ZeroAmount();

        tokenA.transferFrom(msg.sender, address(this), amountA);
        tokenB.transferFrom(msg.sender, address(this), amountB);

        uint256 _totalSupply = totalSupply();
        if (_totalSupply == 0) {
            // First deposit: LP = sqrt(amountA * amountB)
            lpMinted = _sqrt(amountA * amountB);
        } else {
            // Proportional deposit
            uint256 lpFromA = (amountA * _totalSupply) / reserveA;
            uint256 lpFromB = (amountB * _totalSupply) / reserveB;
            lpMinted = lpFromA < lpFromB ? lpFromA : lpFromB;
        }

        if (lpMinted == 0) revert InsufficientAmount();

        reserveA += amountA;
        reserveB += amountB;

        _mint(msg.sender, lpMinted);
        emit LiquidityAdded(msg.sender, amountA, amountB, lpMinted);
    }

    /// @notice Remove liquidity from the pool
    /// @param lpAmount Amount of LP tokens to burn
    /// @return amountA Amount of tokenA returned
    /// @return amountB Amount of tokenB returned
    function removeLiquidity(
        uint256 lpAmount
    ) external onlyAuthorized returns (uint256 amountA, uint256 amountB) {
        if (lpAmount == 0) revert ZeroAmount();

        uint256 _totalSupply = totalSupply();
        amountA = (lpAmount * reserveA) / _totalSupply;
        amountB = (lpAmount * reserveB) / _totalSupply;

        if (amountA == 0 || amountB == 0) revert InsufficientLiquidity();

        _burn(msg.sender, lpAmount);

        reserveA -= amountA;
        reserveB -= amountB;

        tokenA.transfer(msg.sender, amountA);
        tokenB.transfer(msg.sender, amountB);

        emit LiquidityRemoved(msg.sender, amountA, amountB, lpAmount);
    }

    /// @notice Swap tokenIn for the other token using constant-product formula
    /// @param tokenIn Address of the token being sold
    /// @param amountIn Amount of tokenIn to sell
    /// @param minAmountOut Minimum amount of output token (slippage protection)
    /// @return amountOut Amount of output token received
    function swap(
        address tokenIn,
        uint256 amountIn,
        uint256 minAmountOut
    ) external onlyAuthorized returns (uint256 amountOut) {
        if (amountIn == 0) revert ZeroAmount();

        bool isTokenA = tokenIn == address(tokenA);
        bool isTokenB = tokenIn == address(tokenB);
        if (!isTokenA && !isTokenB) revert InvalidToken();

        (
            IERC20 inputToken,
            IERC20 outputToken,
            uint256 reserveIn,
            uint256 reserveOut
        ) = isTokenA
                ? (tokenA, tokenB, reserveA, reserveB)
                : (tokenB, tokenA, reserveB, reserveA);

        inputToken.transferFrom(msg.sender, address(this), amountIn);

        // Constant product with 0.3% fee
        uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - FEE_NUMERATOR);
        amountOut = (amountInWithFee * reserveOut) / (reserveIn * FEE_DENOMINATOR + amountInWithFee);

        if (amountOut < minAmountOut) revert SlippageExceeded();
        if (amountOut == 0) revert InsufficientLiquidity();

        outputToken.transfer(msg.sender, amountOut);

        // Update reserves
        if (isTokenA) {
            reserveA += amountIn;
            reserveB -= amountOut;
        } else {
            reserveB += amountIn;
            reserveA -= amountOut;
        }

        emit Swap(msg.sender, tokenIn, amountIn, amountOut);
    }

    /// @notice Get the expected output amount for a swap (view)
    /// @param tokenIn Address of the input token
    /// @param amountIn Amount of input token
    /// @return amountOut Expected output amount
    function getAmountOut(
        address tokenIn,
        uint256 amountIn
    ) external view returns (uint256 amountOut) {
        bool isTokenA = tokenIn == address(tokenA);
        if (!isTokenA && tokenIn != address(tokenB)) revert InvalidToken();

        (uint256 reserveIn, uint256 reserveOut) = isTokenA
            ? (reserveA, reserveB)
            : (reserveB, reserveA);

        uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - FEE_NUMERATOR);
        amountOut = (amountInWithFee * reserveOut) / (reserveIn * FEE_DENOMINATOR + amountInWithFee);
    }

    function setKYCRegistry(address _kycRegistry) external onlyOwner {
        kycRegistry = IKYCRegistry(_kycRegistry);
    }

    /// @dev Babylonian square root
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
