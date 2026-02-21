import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { hardhat, baseSepolia } from "viem/chains";

const RPC_URL = process.env.RPC_URL ?? "http://127.0.0.1:8545";
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}` | undefined;
const KYC_REGISTRY_ADDRESS = process.env.KYC_REGISTRY_ADDRESS as `0x${string}` | undefined;
const CHAIN_ID = Number(process.env.CHAIN_ID ?? "31337");

const chain = CHAIN_ID === 84532 ? baseSepolia : hardhat;

const whitelistAbi = [
  {
    type: "function",
    name: "whitelist",
    inputs: [{ name: "account", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "isAuthorized",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "bool" }],
    stateMutability: "view",
  },
] as const;

const transport = http(RPC_URL);

const publicClient = createPublicClient({ chain, transport });

function getWalletClient() {
  if (!PRIVATE_KEY) throw new Error("PRIVATE_KEY not set");
  const account = privateKeyToAccount(PRIVATE_KEY);
  return createWalletClient({ chain, account, transport });
}

/**
 * Whitelist an address on the KYCRegistry contract.
 * Called after a user verifies their email.
 */
export async function whitelistOnChain(walletAddress: `0x${string}`): Promise<string> {
  if (!KYC_REGISTRY_ADDRESS) throw new Error("KYC_REGISTRY_ADDRESS not set");

  const walletClient = getWalletClient();
  const hash = await walletClient.writeContract({
    address: KYC_REGISTRY_ADDRESS,
    abi: whitelistAbi,
    functionName: "whitelist",
    args: [walletAddress],
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

/**
 * Check if an address is authorized on-chain.
 */
export async function isAuthorizedOnChain(walletAddress: `0x${string}`): Promise<boolean> {
  if (!KYC_REGISTRY_ADDRESS) return false;

  return publicClient.readContract({
    address: KYC_REGISTRY_ADDRESS,
    abi: whitelistAbi,
    functionName: "isAuthorized",
    args: [walletAddress],
  });
}
