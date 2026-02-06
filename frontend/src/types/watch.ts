export interface Watch {
  id: number;
  brand: string;
  model: string;
  serialNumber: string;
  certificateURI: string;
  totalShares?: number;
  availableShares?: number;
  pricePerShare?: bigint;
  sharesContract?: `0x${string}`;
  imageUrl: string;
  description?: string;
  year?: number;
  estimatedValue?: number;
  owner?: `0x${string}`;
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
