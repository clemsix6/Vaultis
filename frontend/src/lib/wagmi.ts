import { http, createConfig } from "wagmi";
import { hardhat, baseSepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "31337");
const chains =
  chainId === 84532 ? [baseSepolia, hardhat] as const : [hardhat, baseSepolia] as const;

export const config = createConfig({
  chains,
  connectors: [injected()],
  transports: {
    [hardhat.id]: http(process.env.NEXT_PUBLIC_RPC_URL ?? "http://127.0.0.1:8545"),
    [baseSepolia.id]: http(chainId === 84532 ? (process.env.NEXT_PUBLIC_RPC_URL ?? "https://sepolia.base.org") : "https://sepolia.base.org"),
  },
  ssr: true,
});
