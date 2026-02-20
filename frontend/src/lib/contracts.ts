import { WatchNFTABI, KYCRegistryABI, WatchShareTokenABI, WatchPriceOracleABI, SimpleDEXABI, WETHABI } from "@/contracts";

export const WATCH_NFT_ADDRESS = process.env
  .NEXT_PUBLIC_WATCH_NFT_ADDRESS as `0x${string}` | undefined;

export const KYC_REGISTRY_ADDRESS = process.env
  .NEXT_PUBLIC_KYC_REGISTRY_ADDRESS as `0x${string}` | undefined;

export const ORACLE_ADDRESS = process.env
  .NEXT_PUBLIC_ORACLE_ADDRESS as `0x${string}` | undefined;

export const WETH_ADDRESS = process.env
  .NEXT_PUBLIC_WETH_ADDRESS as `0x${string}` | undefined;

export const SHARE_TOKEN_ADDRESS = process.env
  .NEXT_PUBLIC_SHARE_TOKEN_ADDRESS as `0x${string}` | undefined;

export const DEX_ADDRESS = process.env
  .NEXT_PUBLIC_DEX_ADDRESS as `0x${string}` | undefined;

export const INDEXER_URL = process.env
  .NEXT_PUBLIC_INDEXER_URL ?? "http://localhost:3001";

export const watchNFTConfig = {
  address: WATCH_NFT_ADDRESS,
  abi: WatchNFTABI,
} as const;

export const kycRegistryConfig = {
  address: KYC_REGISTRY_ADDRESS,
  abi: KYCRegistryABI,
} as const;

export const oracleConfig = {
  address: ORACLE_ADDRESS,
  abi: WatchPriceOracleABI,
} as const;

export const wethConfig = {
  address: WETH_ADDRESS,
  abi: WETHABI,
} as const;

export const shareTokenConfig = {
  address: SHARE_TOKEN_ADDRESS,
  abi: WatchShareTokenABI,
} as const;

export const dexConfig = {
  address: DEX_ADDRESS,
  abi: SimpleDEXABI,
} as const;
