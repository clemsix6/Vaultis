import { WatchNFTABI, KYCRegistryABI } from "@/contracts";

export const WATCH_NFT_ADDRESS = process.env
  .NEXT_PUBLIC_WATCH_NFT_ADDRESS as `0x${string}` | undefined;

export const KYC_REGISTRY_ADDRESS = process.env
  .NEXT_PUBLIC_KYC_REGISTRY_ADDRESS as `0x${string}` | undefined;

export const watchNFTConfig = {
  address: WATCH_NFT_ADDRESS,
  abi: WatchNFTABI,
} as const;

export const kycRegistryConfig = {
  address: KYC_REGISTRY_ADDRESS,
  abi: KYCRegistryABI,
} as const;
