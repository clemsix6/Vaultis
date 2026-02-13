import { createPublicClient, createWalletClient, http, parseEther, parseUnits } from "viem";
import { hardhat } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Hardhat account #0
const DEPLOYER_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" as const;

const RPC_URL = process.env.RPC_URL ?? "http://hardhat-node:8545";

const DEMO_TOKEN_URIS = [
  "data:application/json;base64,eyJuYW1lIjoiUm9sZXggU3VibWFyaW5lciBEYXRlIEJsdWUiLCJkZXNjcmlwdGlvbiI6IlJvbGV4IFN1Ym1hcmluZXIgRGF0ZSA0MW1tIFJvbGVzb3IsIGNhZHJhbiBibGV1IiwiaW1hZ2UiOiIvYXNzZXRzL3dhdGNoLTEucG5nIiwiYXR0cmlidXRlcyI6W3sidHJhaXRfdHlwZSI6IkJyYW5kIiwidmFsdWUiOiJSb2xleCJ9LHsidHJhaXRfdHlwZSI6Ik1vZGVsIiwidmFsdWUiOiJTdWJtYXJpbmVyIERhdGUgQmx1ZSJ9LHsidHJhaXRfdHlwZSI6IlllYXIiLCJ2YWx1ZSI6MjAyM30seyJ0cmFpdF90eXBlIjoiU2VyaWFsIiwidmFsdWUiOiJBQkMxMjM0NTYifSx7InRyYWl0X3R5cGUiOiJFc3RpbWF0ZWQgVmFsdWUiLCJ2YWx1ZSI6MTUwMDB9XX0=",
  "data:application/json;base64,eyJuYW1lIjoiUm9sZXggRGF5dG9uYSBHcmVlbiBEaWFsIiwiZGVzY3JpcHRpb24iOiJSb2xleCBDb3Ntb2dyYXBoIERheXRvbmEgZW4gb3IgamF1bmUsIGNhZHJhbiB2ZXJ0IiwiaW1hZ2UiOiIvYXNzZXRzL3dhdGNoLTIucG5nIiwiYXR0cmlidXRlcyI6W3sidHJhaXRfdHlwZSI6IkJyYW5kIiwidmFsdWUiOiJSb2xleCJ9LHsidHJhaXRfdHlwZSI6Ik1vZGVsIiwidmFsdWUiOiJEYXl0b25hIEdyZWVuIERpYWwifSx7InRyYWl0X3R5cGUiOiJZZWFyIiwidmFsdWUiOjIwMjF9LHsidHJhaXRfdHlwZSI6IlNlcmlhbCIsInZhbHVlIjoiREVGNzg5MDEyIn0seyJ0cmFpdF90eXBlIjoiRXN0aW1hdGVkIFZhbHVlIiwidmFsdWUiOjg1MDAwfV19",
  "data:application/json;base64,eyJuYW1lIjoiUm9sZXggU3VibWFyaW5lciBEYXRlIEJsYWNrIiwiZGVzY3JpcHRpb24iOiJSb2xleCBTdWJtYXJpbmVyIERhdGUgNDFtbSBSb2xlc29yLCBjYWRyYW4gbm9pciIsImltYWdlIjoiL2Fzc2V0cy93YXRjaC0zLnBuZyIsImF0dHJpYnV0ZXMiOlt7InRyYWl0X3R5cGUiOiJCcmFuZCIsInZhbHVlIjoiUm9sZXgifSx7InRyYWl0X3R5cGUiOiJNb2RlbCIsInZhbHVlIjoiU3VibWFyaW5lciBEYXRlIEJsYWNrIn0seyJ0cmFpdF90eXBlIjoiWWVhciIsInZhbHVlIjoyMDIyfSx7InRyYWl0X3R5cGUiOiJTZXJpYWwiLCJ2YWx1ZSI6IkdISTM0NTY3OCJ9LHsidHJhaXRfdHlwZSI6IkVzdGltYXRlZCBWYWx1ZSIsInZhbHVlIjoxNDUwMH1dfQ==",
];

const whitelistAbi = [
  {
    type: "function",
    name: "whitelist",
    inputs: [{ name: "account", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

const mintAbi = [
  {
    type: "function",
    name: "mint",
    inputs: [
      { name: "to", type: "address" },
      { name: "uri", type: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

const approveAbi = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
    stateMutability: "nonpayable",
  },
] as const;

const addLiquidityAbi = [
  {
    type: "function",
    name: "addLiquidity",
    inputs: [{ name: "sharesAmount", type: "uint256" }],
    outputs: [],
    stateMutability: "payable",
  },
] as const;

async function main() {
  const deployedPath = join(
    __dirname,
    "..",
    "ignition",
    "deployments",
    "chain-31337",
    "deployed_addresses.json"
  );
  const addresses = JSON.parse(readFileSync(deployedPath, "utf-8"));

  const kycRegistryAddress = addresses["DeployModule#KYCRegistry"] as `0x${string}` | undefined;
  const watchNFTAddress = addresses["DeployModule#WatchNFT"] as `0x${string}` | undefined;
  const watchSharesAddress = addresses["DeployModule#WatchShares"] as `0x${string}` | undefined;
  const swapPoolAddress = addresses["DeployModule#WatchSwapPool"] as `0x${string}` | undefined;

  if (!kycRegistryAddress || !watchNFTAddress) {
    throw new Error("Missing deployed addresses — did deploy succeed?");
  }

  console.log("KYCRegistry:", kycRegistryAddress);
  console.log("WatchNFT:", watchNFTAddress);
  console.log("WatchShares:", watchSharesAddress ?? "not deployed");
  console.log("SwapPool:", swapPoolAddress ?? "not deployed");
  console.log("RPC:", RPC_URL);

  const account = privateKeyToAccount(DEPLOYER_KEY);
  const transport = http(RPC_URL);

  const publicClient = createPublicClient({
    chain: hardhat,
    transport,
  });

  const walletClient = createWalletClient({
    chain: hardhat,
    account,
    transport,
  });

  console.log("Deployer:", account.address);

  // ── Step 1: Whitelist deployer ──
  console.log("\nWhitelisting deployer...");
  let hash = await walletClient.writeContract({
    address: kycRegistryAddress,
    abi: whitelistAbi,
    functionName: "whitelist",
    args: [account.address],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  console.log("Deployer whitelisted!");

  // ── Step 2: Whitelist the swap pool (so it can hold KYC-gated shares) ──
  if (swapPoolAddress) {
    console.log("\nWhitelisting swap pool...");
    hash = await walletClient.writeContract({
      address: kycRegistryAddress,
      abi: whitelistAbi,
      functionName: "whitelist",
      args: [swapPoolAddress],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    console.log("Swap pool whitelisted!");
  }

  // ── Step 3: Mint demo NFTs ──
  for (let i = 0; i < DEMO_TOKEN_URIS.length; i++) {
    console.log(`\nMinting NFT #${i}...`);
    hash = await walletClient.writeContract({
      address: watchNFTAddress,
      abi: mintAbi,
      functionName: "mint",
      args: [account.address, DEMO_TOKEN_URIS[i]],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    console.log(`NFT #${i} minted!`);
  }

  // ── Step 4: Add initial liquidity to swap pool ──
  if (watchSharesAddress && swapPoolAddress) {
    const sharesAmount = parseUnits("500", 18); // 500 shares
    const ethAmount = parseEther("5");           // 5 ETH → 1 share = 0.01 ETH

    console.log("\nApproving shares for swap pool...");
    hash = await walletClient.writeContract({
      address: watchSharesAddress,
      abi: approveAbi,
      functionName: "approve",
      args: [swapPoolAddress, sharesAmount],
    });
    await publicClient.waitForTransactionReceipt({ hash });

    console.log("Adding initial liquidity: 500 WSUB + 5 ETH...");
    hash = await walletClient.writeContract({
      address: swapPoolAddress,
      abi: addLiquidityAbi,
      functionName: "addLiquidity",
      args: [sharesAmount],
      value: ethAmount,
    });
    await publicClient.waitForTransactionReceipt({ hash });
    console.log("Liquidity added! Pool is live.");
  }

  console.log("\nSeed complete!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
