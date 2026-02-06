"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import {
  watchNFTConfig,
  kycRegistryConfig,
  WATCH_NFT_ADDRESS,
  KYC_REGISTRY_ADDRESS,
} from "@/lib/contracts";

export function useMintWatch() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  function mint(to: `0x${string}`, uri: string) {
    if (!WATCH_NFT_ADDRESS) return;
    writeContract({
      address: WATCH_NFT_ADDRESS,
      abi: watchNFTConfig.abi,
      functionName: "mint",
      args: [to, uri],
    });
  }

  return { mint, hash, isPending, isConfirming, isSuccess, error };
}

export function useTransferWatch() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  function transfer(
    from: `0x${string}`,
    to: `0x${string}`,
    tokenId: bigint
  ) {
    if (!WATCH_NFT_ADDRESS) return;
    writeContract({
      address: WATCH_NFT_ADDRESS,
      abi: watchNFTConfig.abi,
      functionName: "transferFrom",
      args: [from, to, tokenId],
    });
  }

  return { transfer, hash, isPending, isConfirming, isSuccess, error };
}

export function useWhitelistAddress() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  function whitelist(account: `0x${string}`) {
    if (!KYC_REGISTRY_ADDRESS) return;
    writeContract({
      address: KYC_REGISTRY_ADDRESS,
      abi: kycRegistryConfig.abi,
      functionName: "whitelist",
      args: [account],
    });
  }

  return { whitelist, hash, isPending, isConfirming, isSuccess, error };
}
