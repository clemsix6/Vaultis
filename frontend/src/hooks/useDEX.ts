"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import {
  dexConfig,
  shareTokenConfig,
  wethConfig,
  DEX_ADDRESS,
  SHARE_TOKEN_ADDRESS,
  WETH_ADDRESS,
} from "@/lib/contracts";

export function useDEXReserves() {
  const reserveA = useReadContract({
    ...dexConfig,
    functionName: "reserveA",
    query: { enabled: !!dexConfig.address },
  });
  const reserveB = useReadContract({
    ...dexConfig,
    functionName: "reserveB",
    query: { enabled: !!dexConfig.address },
  });
  return { reserveA: reserveA.data, reserveB: reserveB.data, isLoading: reserveA.isLoading || reserveB.isLoading };
}

export function useGetAmountOut(tokenIn: `0x${string}` | undefined, amountIn: bigint | undefined) {
  return useReadContract({
    ...dexConfig,
    functionName: "getAmountOut",
    args: tokenIn && amountIn !== undefined ? [tokenIn, amountIn] : undefined,
    query: { enabled: !!dexConfig.address && !!tokenIn && amountIn !== undefined && amountIn > 0n },
  });
}

export function useSwap() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function swap(tokenIn: `0x${string}`, amountIn: bigint, minAmountOut: bigint) {
    if (!DEX_ADDRESS) return;
    writeContract({
      address: DEX_ADDRESS,
      abi: dexConfig.abi,
      functionName: "swap",
      args: [tokenIn, amountIn, minAmountOut],
    });
  }

  return { swap, hash, isPending, isConfirming, isSuccess, error };
}

export function useApproveShareToken() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function approve(amount: bigint) {
    if (!SHARE_TOKEN_ADDRESS || !DEX_ADDRESS) return;
    writeContract({
      address: SHARE_TOKEN_ADDRESS,
      abi: shareTokenConfig.abi,
      functionName: "approve",
      args: [DEX_ADDRESS, amount],
    });
  }

  return { approve, hash, isPending, isConfirming, isSuccess, error };
}

export function useApproveWETH() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function approve(amount: bigint) {
    if (!WETH_ADDRESS || !DEX_ADDRESS) return;
    writeContract({
      address: WETH_ADDRESS,
      abi: wethConfig.abi,
      functionName: "approve",
      args: [DEX_ADDRESS, amount],
    });
  }

  return { approve, hash, isPending, isConfirming, isSuccess, error };
}

export function useDepositWETH() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function deposit(amount: bigint) {
    if (!WETH_ADDRESS) return;
    writeContract({
      address: WETH_ADDRESS,
      abi: wethConfig.abi,
      functionName: "deposit",
      value: amount,
    });
  }

  return { deposit, hash, isPending, isConfirming, isSuccess, error };
}

export function useShareTokenBalance(owner: `0x${string}` | undefined) {
  return useReadContract({
    ...shareTokenConfig,
    functionName: "balanceOf",
    args: owner ? [owner] : undefined,
    query: { enabled: !!shareTokenConfig.address && !!owner },
  });
}

export function useWETHBalance(owner: `0x${string}` | undefined) {
  return useReadContract({
    ...wethConfig,
    functionName: "balanceOf",
    args: owner ? [owner] : undefined,
    query: { enabled: !!wethConfig.address && !!owner },
  });
}
