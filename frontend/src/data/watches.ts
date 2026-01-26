import { Watch } from "@/types";

export const DEMO_WATCHES: Watch[] = [
  {
    id: 1,
    brand: "Rolex",
    model: "Submariner Date Blue",
    serialNumber: "ABC123456",
    certificateURI: "ipfs://...",
    totalShares: 100,
    availableShares: 65,
    pricePerShare: BigInt(0.05 * 1e18),
    sharesContract: "0x0000000000000000000000000000000000000000",
    imageUrl: "/assets/watch-1.png",
    description: "Rolex Submariner Date 41mm Rolesor, cadran bleu",
    year: 2023,
    estimatedValue: 15000,
  },
  {
    id: 2,
    brand: "Rolex",
    model: "Daytona Green Dial",
    serialNumber: "DEF789012",
    certificateURI: "ipfs://...",
    totalShares: 100,
    availableShares: 30,
    pricePerShare: BigInt(0.5 * 1e18),
    sharesContract: "0x0000000000000000000000000000000000000000",
    imageUrl: "/assets/watch-2.png",
    description: "Rolex Cosmograph Daytona en or jaune, cadran vert",
    year: 2021,
    estimatedValue: 85000,
  },
  {
    id: 3,
    brand: "Rolex",
    model: "Submariner Date Black",
    serialNumber: "GHI345678",
    certificateURI: "ipfs://...",
    totalShares: 100,
    availableShares: 80,
    pricePerShare: BigInt(0.3 * 1e18),
    sharesContract: "0x0000000000000000000000000000000000000000",
    imageUrl: "/assets/watch-3.png",
    description: "Rolex Submariner Date 41mm Rolesor, cadran noir",
    year: 2022,
    estimatedValue: 14500,
  },
];

// Stats du showroom
export const SHOWROOM_STATS = [
  { label: "Montres", value: DEMO_WATCHES.length },
  { label: "Valeur totale", value: "210K €" },
  { label: "Parts vendues", value: "125" },
  { label: "Investisseurs", value: "47" },
] as const;
