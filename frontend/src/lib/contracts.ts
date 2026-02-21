import { WatchNFTABI, KYCRegistryABI, WatchShareTokenABI, WatchPriceOracleABI, SimpleDEXABI, WETHABI, WatchMarketplaceABI } from "@/contracts";
import { baseSepolia, hardhat } from "wagmi/chains";

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

const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "31337");
export const defaultChainId = CHAIN_ID === 84532 ? baseSepolia.id : hardhat.id;

export const watchNFTConfig = {
  address: WATCH_NFT_ADDRESS,
  abi: WatchNFTABI,
  chainId: defaultChainId,
} as const;

export const kycRegistryConfig = {
  address: KYC_REGISTRY_ADDRESS,
  abi: KYCRegistryABI,
  chainId: defaultChainId,
} as const;

export const oracleConfig = {
  address: ORACLE_ADDRESS,
  abi: WatchPriceOracleABI,
  chainId: defaultChainId,
} as const;

export const wethConfig = {
  address: WETH_ADDRESS,
  abi: WETHABI,
  chainId: defaultChainId,
} as const;

export const shareTokenConfig = {
  address: SHARE_TOKEN_ADDRESS,
  abi: WatchShareTokenABI,
  chainId: defaultChainId,
} as const;

export const dexConfig = {
  address: DEX_ADDRESS,
  abi: SimpleDEXABI,
  chainId: defaultChainId,
} as const;

export const MARKETPLACE_ADDRESS = process.env
  .NEXT_PUBLIC_MARKETPLACE_ADDRESS as `0x${string}` | undefined;

export const marketplaceConfig = {
  address: MARKETPLACE_ADDRESS,
  abi: WatchMarketplaceABI,
  chainId: defaultChainId,
} as const;
