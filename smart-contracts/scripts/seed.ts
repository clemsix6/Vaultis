import { createPublicClient, createWalletClient, http, parseEther, encodeFunctionData } from "viem";
import { hardhat, baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const CHAIN_ID = Number(process.env.CHAIN_ID ?? "31337");

const DEPLOYER_KEY = (process.env.PRIVATE_KEY
  ? (process.env.PRIVATE_KEY.startsWith("0x") ? process.env.PRIVATE_KEY : `0x${process.env.PRIVATE_KEY}`)
  : "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80") as `0x${string}`;

const RPC_URL = process.env.RPC_URL ?? (CHAIN_ID === 84532 ? "https://sepolia.base.org" : "http://hardhat-node:8545");

const DEMO_TOKEN_URIS = [
  "data:application/json;base64,eyJuYW1lIjoiUm9sZXggU3VibWFyaW5lciBEYXRlIEJsdWUiLCJkZXNjcmlwdGlvbiI6IlJvbGV4IFN1Ym1hcmluZXIgRGF0ZSA0MW1tIFJvbGVzb3IsIGNhZHJhbiBibGV1IiwiaW1hZ2UiOiIvYXNzZXRzL3dhdGNoLTEucG5nIiwiYXR0cmlidXRlcyI6W3sidHJhaXRfdHlwZSI6IkJyYW5kIiwidmFsdWUiOiJSb2xleCJ9LHsidHJhaXRfdHlwZSI6Ik1vZGVsIiwidmFsdWUiOiJTdWJtYXJpbmVyIERhdGUgQmx1ZSJ9LHsidHJhaXRfdHlwZSI6IlllYXIiLCJ2YWx1ZSI6MjAyM30seyJ0cmFpdF90eXBlIjoiU2VyaWFsIiwidmFsdWUiOiJBQkMxMjM0NTYifSx7InRyYWl0X3R5cGUiOiJFc3RpbWF0ZWQgVmFsdWUiLCJ2YWx1ZSI6MTUwMDB9XX0=",
  "data:application/json;base64,eyJuYW1lIjoiUm9sZXggRGF5dG9uYSBHcmVlbiBEaWFsIiwiZGVzY3JpcHRpb24iOiJSb2xleCBDb3Ntb2dyYXBoIERheXRvbmEgZW4gb3IgamF1bmUsIGNhZHJhbiB2ZXJ0IiwiaW1hZ2UiOiIvYXNzZXRzL3dhdGNoLTIucG5nIiwiYXR0cmlidXRlcyI6W3sidHJhaXRfdHlwZSI6IkJyYW5kIiwidmFsdWUiOiJSb2xleCJ9LHsidHJhaXRfdHlwZSI6Ik1vZGVsIiwidmFsdWUiOiJEYXl0b25hIEdyZWVuIERpYWwifSx7InRyYWl0X3R5cGUiOiJZZWFyIiwidmFsdWUiOjIwMjF9LHsidHJhaXRfdHlwZSI6IlNlcmlhbCIsInZhbHVlIjoiREVGNzg5MDEyIn0seyJ0cmFpdF90eXBlIjoiRXN0aW1hdGVkIFZhbHVlIiwidmFsdWUiOjg1MDAwfV19",
  "data:application/json;base64,eyJuYW1lIjoiUm9sZXggU3VibWFyaW5lciBEYXRlIEJsYWNrIiwiZGVzY3JpcHRpb24iOiJSb2xleCBTdWJtYXJpbmVyIERhdGUgNDFtbSBSb2xlc29yLCBjYWRyYW4gbm9pciIsImltYWdlIjoiL2Fzc2V0cy93YXRjaC0zLnBuZyIsImF0dHJpYnV0ZXMiOlt7InRyYWl0X3R5cGUiOiJCcmFuZCIsInZhbHVlIjoiUm9sZXgifSx7InRyYWl0X3R5cGUiOiJNb2RlbCIsInZhbHVlIjoiU3VibWFyaW5lciBEYXRlIEJsYWNrIn0seyJ0cmFpdF90eXBlIjoiWWVhciIsInZhbHVlIjoyMDIyfSx7InRyYWl0X3R5cGUiOiJTZXJpYWwiLCJ2YWx1ZSI6IkdISTM0NTY3OCJ9LHsidHJhaXRfdHlwZSI6IkVzdGltYXRlZCBWYWx1ZSIsInZhbHVlIjoxNDUwMH1dfQ==",
];

// Watch estimated values in ETH (matching the metadata)
const WATCH_PRICES_ETH = [
  parseEther("5"),    // Submariner Blue ~15,000€ => 5 ETH
  parseEther("28"),   // Daytona Green ~85,000€ => 28 ETH
  parseEther("4.8"),  // Submariner Black ~14,500€ => ~4.8 ETH
];

// Shares per watch
const SHARES_PER_WATCH = parseEther("1000");

// ABIs (minimal)
const kycAbi = [
  { type: "function", name: "whitelist", inputs: [{ name: "account", type: "address" }], outputs: [], stateMutability: "nonpayable" },
] as const;

const mintAbi = [
  { type: "function", name: "mint", inputs: [{ name: "to", type: "address" }, { name: "uri", type: "string" }], outputs: [], stateMutability: "nonpayable" },
] as const;

const oracleAbi = [
  { type: "function", name: "setPrice", inputs: [{ name: "tokenId", type: "uint256" }, { name: "price", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
] as const;

const shareTokenAbi = [
  { type: "function", name: "approve", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "nonpayable" },
] as const;

const wethAbi = [
  { type: "function", name: "deposit", inputs: [], outputs: [], stateMutability: "payable" },
  { type: "function", name: "approve", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "nonpayable" },
] as const;

const watchShareTokenBytecode = JSON.parse(
  readFileSync(join(__dirname, "..", "artifacts", "contracts", "WatchShareToken.sol", "WatchShareToken.json"), "utf-8")
).bytecode as `0x${string}`;

const watchShareTokenFullAbi = JSON.parse(
  readFileSync(join(__dirname, "..", "artifacts", "contracts", "WatchShareToken.sol", "WatchShareToken.json"), "utf-8")
).abi;

const simpleDexBytecode = JSON.parse(
  readFileSync(join(__dirname, "..", "artifacts", "contracts", "SimpleDEX.sol", "SimpleDEX.json"), "utf-8")
).bytecode as `0x${string}`;

const simpleDexFullAbi = JSON.parse(
  readFileSync(join(__dirname, "..", "artifacts", "contracts", "SimpleDEX.sol", "SimpleDEX.json"), "utf-8")
).abi;

const dexAddLiquidityAbi = [
  { type: "function", name: "addLiquidity", inputs: [{ name: "amountA", type: "uint256" }, { name: "amountB", type: "uint256" }], outputs: [{ name: "lpMinted", type: "uint256" }], stateMutability: "nonpayable" },
] as const;

async function main() {
  const deployedPath = join(
    __dirname, "..", "ignition", "deployments", `chain-${CHAIN_ID}`, "deployed_addresses.json"
  );
  const addresses = JSON.parse(readFileSync(deployedPath, "utf-8"));

  const kycRegistryAddress = addresses["DeployModule#KYCRegistry"] as `0x${string}`;
  const watchNFTAddress = addresses["DeployModule#WatchNFT"] as `0x${string}`;
  const oracleAddress = addresses["DeployModule#WatchPriceOracle"] as `0x${string}`;
  const wethAddress = addresses["DeployModule#WETH"] as `0x${string}`;

  if (!kycRegistryAddress || !watchNFTAddress || !oracleAddress || !wethAddress) {
    throw new Error("Missing deployed addresses — did deploy succeed?");
  }

  console.log("KYCRegistry:", kycRegistryAddress);
  console.log("WatchNFT:", watchNFTAddress);
  console.log("Oracle:", oracleAddress);
  console.log("WETH:", wethAddress);
  console.log("RPC:", RPC_URL);

  const account = privateKeyToAccount(DEPLOYER_KEY);
  const chain = CHAIN_ID === 84532 ? baseSepolia : hardhat;
  const transport = http(RPC_URL);

  const publicClient = createPublicClient({ chain, transport });
  const walletClient = createWalletClient({ chain, account, transport });

  const waitTx = async (hash: `0x${string}`) => {
    await publicClient.waitForTransactionReceipt({ hash });
  };

  console.log("Deployer:", account.address);

  // ── 1. Whitelist deployer ──
  console.log("\n─── Whitelisting deployer ───");
  await waitTx(await walletClient.writeContract({
    address: kycRegistryAddress, abi: kycAbi, functionName: "whitelist", args: [account.address],
  }));
  console.log("Deployer whitelisted!");

  // ── 2. Mint demo NFTs ──
  console.log("\n─── Minting NFTs ───");
  for (let i = 0; i < DEMO_TOKEN_URIS.length; i++) {
    await waitTx(await walletClient.writeContract({
      address: watchNFTAddress, abi: mintAbi, functionName: "mint", args: [account.address, DEMO_TOKEN_URIS[i]],
    }));
    console.log(`NFT #${i} minted!`);
  }

  // ── 3. Set oracle prices ──
  console.log("\n─── Setting oracle prices ───");
  for (let i = 0; i < WATCH_PRICES_ETH.length; i++) {
    await waitTx(await walletClient.writeContract({
      address: oracleAddress, abi: oracleAbi, functionName: "setPrice", args: [BigInt(i), WATCH_PRICES_ETH[i]],
    }));
    console.log(`Price set for watch #${i}: ${WATCH_PRICES_ETH[i]} wei`);
  }

  // ── 4. Deploy WatchShareToken for watch #0 (Submariner Blue) ──
  console.log("\n─── Deploying share token for watch #0 ───");
  const shareTokenHash = await walletClient.deployContract({
    abi: watchShareTokenFullAbi,
    bytecode: watchShareTokenBytecode,
    args: ["Rolex Submariner Shares", "RSX", account.address, kycRegistryAddress, 0n, SHARES_PER_WATCH],
  });
  const shareTokenReceipt = await publicClient.waitForTransactionReceipt({ hash: shareTokenHash });
  const shareTokenAddress = shareTokenReceipt.contractAddress!;
  console.log("WatchShareToken deployed at:", shareTokenAddress);

  // ── 5. Wrap ETH to WETH for liquidity ──
  console.log("\n─── Wrapping ETH to WETH ───");
  const wethAmount = CHAIN_ID === 84532 ? parseEther("0.01") : parseEther("5");
  await waitTx(await walletClient.writeContract({
    address: wethAddress, abi: wethAbi, functionName: "deposit", args: [], value: wethAmount,
  }));
  console.log(`Wrapped ${wethAmount} wei to WETH`);

  // ── 6. Deploy SimpleDEX pool (RSX/WETH) ──
  console.log("\n─── Deploying DEX pool ───");
  const dexHash = await walletClient.deployContract({
    abi: simpleDexFullAbi,
    bytecode: simpleDexBytecode,
    args: [shareTokenAddress, wethAddress, kycRegistryAddress, account.address],
  });
  const dexReceipt = await publicClient.waitForTransactionReceipt({ hash: dexHash });
  const dexAddress = dexReceipt.contractAddress!;
  console.log("SimpleDEX deployed at:", dexAddress);

  // Whitelist the DEX so it can hold KYC-gated tokens
  await waitTx(await walletClient.writeContract({
    address: kycRegistryAddress, abi: kycAbi, functionName: "whitelist", args: [dexAddress],
  }));
  console.log("DEX whitelisted on KYCRegistry");

  // ── 7. Add initial liquidity ──
  console.log("\n─── Adding initial liquidity ───");
  const liquidityShares = CHAIN_ID === 84532 ? parseEther("50") : parseEther("500");

  await waitTx(await walletClient.writeContract({
    address: shareTokenAddress, abi: shareTokenAbi, functionName: "approve", args: [dexAddress, liquidityShares],
  }));
  await waitTx(await walletClient.writeContract({
    address: wethAddress, abi: wethAbi, functionName: "approve", args: [dexAddress, wethAmount],
  }));

  await waitTx(await walletClient.writeContract({
    address: dexAddress, abi: dexAddLiquidityAbi, functionName: "addLiquidity", args: [liquidityShares, wethAmount],
  }));
  console.log(`Liquidity added: ${liquidityShares} RSX + ${wethAmount} WETH`);

  // ── Done ──
  console.log("\n════════════════════════════════════");
  console.log("Seed complete!");
  console.log("ShareToken:", shareTokenAddress);
  console.log("DEX Pool:", dexAddress);
  console.log("════════════════════════════════════");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
