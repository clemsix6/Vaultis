export interface Watch {
  id: number;
  brand: string;
  model: string;
  serialNumber: string;
  certificateURI: string;
  totalShares: number;
  availableShares: number;
  pricePerShare: bigint;
  sharesContract: `0x${string}`;
  imageUrl: string;
  description?: string;
  year?: number;
  estimatedValue?: number;
}

export interface WatchMetadata {
  name: string;
  description: string;
  image: string;
  attributes: {
    trait_type: string;
    value: string | number;
  }[];
}

export interface SharesInfo {
  watchId: number;
  totalSupply: bigint;
  userBalance: bigint;
  pricePerShare: bigint;
  percentOwned: number;
}

export interface NFTWatch {
  tokenId: number;
  owner: `0x${string}`;
  tokenURI: string;
  brand?: string;
  model?: string;
  imageUrl?: string;
  description?: string;
}
