"use client";

import { useReadContract } from "wagmi";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { swapPoolConfig, watchSharesConfig, SWAP_POOL_ADDRESS, WATCH_SHARES_ADDRESS } from "@/lib/contracts";

// ── Read hooks ──

export function usePoolReserveShares() {
  return useReadContract({
    ...swapPoolConfig,
    functionName: "reserveShares",
    query: { enabled: !!swapPoolConfig.address },
  });
}

export function usePoolReserveETH() {
  return useReadContract({
    ...swapPoolConfig,
    functionName: "reserveETH",
    query: { enabled: !!swapPoolConfig.address },
  });
}

export function usePoolTotalLP() {
  return useReadContract({
    ...swapPoolConfig,
    functionName: "totalLP",
    query: { enabled: !!swapPoolConfig.address },
  });
}

export function usePoolLPBalance(address: `0x${string}` | undefined) {
  return useReadContract({
    ...swapPoolConfig,
    functionName: "lpBalance",
    args: address ? [address] : undefined,
    query: { enabled: !!swapPoolConfig.address && !!address },
  });
}

export function useSharePriceInETH() {
  return useReadContract({
    ...swapPoolConfig,
    functionName: "getSharePriceInETH",
    query: { enabled: !!swapPoolConfig.address },
  });
}

export function useGetAmountOut(
  amountIn: bigint | undefined,
  reserveIn: bigint | undefined,
  reserveOut: bigint | undefined
) {
  return useReadContract({
    ...swapPoolConfig,
    functionName: "getAmountOut",
    args:
      amountIn !== undefined && reserveIn !== undefined && reserveOut !== undefined
        ? [amountIn, reserveIn, reserveOut]
        : undefined,
    query: {
      enabled:
        !!swapPoolConfig.address &&
        amountIn !== undefined &&
        reserveIn !== undefined &&
        reserveOut !== undefined &&
        amountIn > 0n,
    },
  });
}

// ── Write hooks ──

export function useSwapETHForShares() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function swap(minSharesOut: bigint, ethValue: bigint) {
    if (!SWAP_POOL_ADDRESS) return;
    writeContract({
      address: SWAP_POOL_ADDRESS,
      abi: swapPoolConfig.abi,
      functionName: "swapETHForShares",
      args: [minSharesOut],
      value: ethValue,
    });
  }

  return { swap, hash, isPending, isConfirming, isSuccess, error };
}

export function useSwapSharesForETH() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function swap(sharesIn: bigint, minETHOut: bigint) {
    if (!SWAP_POOL_ADDRESS) return;
    writeContract({
      address: SWAP_POOL_ADDRESS,
      abi: swapPoolConfig.abi,
      functionName: "swapSharesForETH",
      args: [sharesIn, minETHOut],
    });
  }

  return { swap, hash, isPending, isConfirming, isSuccess, error };
}

export function useApproveSharesForPool() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function approve(amount: bigint) {
    if (!WATCH_SHARES_ADDRESS || !SWAP_POOL_ADDRESS) return;
    writeContract({
      address: WATCH_SHARES_ADDRESS,
      abi: watchSharesConfig.abi,
      functionName: "approve",
      args: [SWAP_POOL_ADDRESS, amount],
    });
  }

  return { approve, hash, isPending, isConfirming, isSuccess, error };
}

export function useAddLiquidity() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function addLiquidity(sharesAmount: bigint, ethValue: bigint) {
    if (!SWAP_POOL_ADDRESS) return;
    writeContract({
      address: SWAP_POOL_ADDRESS,
      abi: swapPoolConfig.abi,
      functionName: "addLiquidity",
      args: [sharesAmount],
      value: ethValue,
    });
  }

  return { addLiquidity, hash, isPending, isConfirming, isSuccess, error };
}

export function useRemoveLiquidity() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function removeLiquidity(lpAmount: bigint) {
    if (!SWAP_POOL_ADDRESS) return;
    writeContract({
      address: SWAP_POOL_ADDRESS,
      abi: swapPoolConfig.abi,
      functionName: "removeLiquidity",
      args: [lpAmount],
    });
  }

  return { removeLiquidity, hash, isPending, isConfirming, isSuccess, error };
}
