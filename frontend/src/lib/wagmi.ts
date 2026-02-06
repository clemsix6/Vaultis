import { http, createConfig } from "wagmi";
import { hardhat, baseSepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const config = createConfig({
  chains: [hardhat, baseSepolia],
  connectors: [injected()],
  transports: {
    [hardhat.id]: http(process.env.NEXT_PUBLIC_RPC_URL ?? "http://127.0.0.1:8545"),
    [baseSepolia.id]: http(),
  },
  ssr: true,
});
