"use client";

import { useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { marketplaceConfig, MARKETPLACE_ADDRESS, watchNFTConfig, WATCH_NFT_ADDRESS } from "@/lib/contracts";

// --- Read hooks ---

export function useActiveListingCount() {
  return useReadContract({
    ...marketplaceConfig,
    functionName: "getActiveListingCount",
    query: { enabled: !!marketplaceConfig.address },
  });
}

export function useActiveListingIds(offset: bigint, limit: bigint) {
  return useReadContract({
    ...marketplaceConfig,
    functionName: "getActiveListings",
    args: [offset, limit],
    query: { enabled: !!marketplaceConfig.address && limit > 0n },
  });
}

export function useListing(tokenId: bigint | undefined) {
  return useReadContract({
    ...marketplaceConfig,
    functionName: "listings",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: !!marketplaceConfig.address && tokenId !== undefined },
  });
}

export function useListingsBatch(tokenIds: bigint[]) {
  const contracts = tokenIds.map((id) => ({
    ...marketplaceConfig,
    functionName: "listings" as const,
    args: [id] as const,
  }));

  return useReadContracts({
    contracts,
    query: { enabled: tokenIds.length > 0 && !!marketplaceConfig.address },
  });
}

// --- Write hooks ---

export function useApproveMarketplace() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function approve() {
    if (!WATCH_NFT_ADDRESS || !MARKETPLACE_ADDRESS) {
      console.error("useApproveMarketplace: missing addresses", { WATCH_NFT_ADDRESS, MARKETPLACE_ADDRESS });
      return;
    }
    console.log("Approving marketplace", { nft: WATCH_NFT_ADDRESS, marketplace: MARKETPLACE_ADDRESS });
    writeContract({
      address: WATCH_NFT_ADDRESS,
      abi: watchNFTConfig.abi,
      functionName: "setApprovalForAll",
      args: [MARKETPLACE_ADDRESS, true],
    });
  }

  return { approve, hash, isPending, isConfirming, isSuccess, error };
}

export function useListWatch() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function listWatch(tokenId: bigint, priceInWei: bigint) {
    if (!MARKETPLACE_ADDRESS) return;
    writeContract({
      address: MARKETPLACE_ADDRESS,
      abi: marketplaceConfig.abi,
      functionName: "listWatch",
      args: [tokenId, priceInWei],
    });
  }

  return { listWatch, hash, isPending, isConfirming, isSuccess, error };
}

export function useCancelListing() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function cancelListing(tokenId: bigint) {
    if (!MARKETPLACE_ADDRESS) return;
    writeContract({
      address: MARKETPLACE_ADDRESS,
      abi: marketplaceConfig.abi,
      functionName: "cancelListing",
      args: [tokenId],
    });
  }

  return { cancelListing, hash, isPending, isConfirming, isSuccess, error };
}

export function useApproveRSXForMarketplace() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function approveRSX(amount: bigint) {
    if (!MARKETPLACE_ADDRESS) return;
    const shareTokenAddress = process.env.NEXT_PUBLIC_SHARE_TOKEN_ADDRESS as `0x${string}` | undefined;
    if (!shareTokenAddress) return;
    writeContract({
      address: shareTokenAddress,
      abi: [{ type: "function", name: "approve", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "nonpayable" }] as const,
      functionName: "approve",
      args: [MARKETPLACE_ADDRESS, amount],
    });
  }

  return { approveRSX, hash, isPending, isConfirming, isSuccess, error };
}

export function useBuyWatch() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function buyWatch(tokenId: bigint) {
    if (!MARKETPLACE_ADDRESS) return;
    writeContract({
      address: MARKETPLACE_ADDRESS,
      abi: marketplaceConfig.abi,
      functionName: "buyWatch",
      args: [tokenId],
    });
  }

  return { buyWatch, hash, isPending, isConfirming, isSuccess, error };
}
