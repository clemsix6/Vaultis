import { createPublicClient, http, parseAbiItem } from "viem";
import { hardhat, baseSepolia } from "viem/chains";
import {
  insertEvent,
  getLastIndexedBlock,
  setLastIndexedBlock,
} from "./db.js";

const RPC_URL = process.env.RPC_URL ?? "http://127.0.0.1:8545";
const CHAIN_ID = Number(process.env.CHAIN_ID ?? "31337");
const POLL_INTERVAL = Number(process.env.INDEXER_POLL_INTERVAL ?? "10000"); // 10s

const KYC_REGISTRY_ADDRESS = process.env.KYC_REGISTRY_ADDRESS as `0x${string}` | undefined;
const WATCH_NFT_ADDRESS = process.env.WATCH_NFT_ADDRESS as `0x${string}` | undefined;
const SHARES_ADDRESS = process.env.SHARES_ADDRESS as `0x${string}` | undefined;
const POOL_ADDRESS = process.env.POOL_ADDRESS as `0x${string}` | undefined;

const chain = CHAIN_ID === 84532 ? baseSepolia : hardhat;
const transport = http(RPC_URL);
const client = createPublicClient({ chain, transport });

// ── Event signatures ──

const KYC_EVENTS = [
  parseAbiItem("event Whitelisted(address indexed account)"),
  parseAbiItem("event RemovedFromWhitelist(address indexed account)"),
  parseAbiItem("event Blacklisted(address indexed account)"),
  parseAbiItem("event RemovedFromBlacklist(address indexed account)"),
];

const NFT_EVENTS = [
  parseAbiItem("event WatchMinted(uint256 indexed tokenId, address indexed to, string uri)"),
  parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"),
];

const SHARES_EVENTS = [
  parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 value)"),
];

const POOL_EVENTS = [
  parseAbiItem("event Swap(address indexed trader, bool ethToShares, uint256 amountIn, uint256 amountOut)"),
  parseAbiItem("event LiquidityAdded(address indexed provider, uint256 sharesAmount, uint256 ethAmount, uint256 lpMinted)"),
  parseAbiItem("event LiquidityRemoved(address indexed provider, uint256 sharesAmount, uint256 ethAmount, uint256 lpBurned)"),
];

// ── Helpers ──

function formatAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatAmount(value: bigint, decimals = 18): string {
  const num = Number(value) / 10 ** decimals;
  return num.toFixed(num < 1 ? 6 : 4);
}

async function getBlockTimestamp(blockNumber: bigint): Promise<string | null> {
  try {
    const block = await client.getBlock({ blockNumber });
    return new Date(Number(block.timestamp) * 1000).toISOString();
  } catch {
    return null;
  }
}

// ── Main indexing function ──

async function indexEvents(fromBlock: bigint, toBlock: bigint): Promise<number> {
  let totalEvents = 0;

  const timestampCache = new Map<number, string | null>();
  async function getTimestamp(blockNum: bigint): Promise<string | null> {
    const key = Number(blockNum);
    if (timestampCache.has(key)) return timestampCache.get(key)!;
    const ts = await getBlockTimestamp(blockNum);
    timestampCache.set(key, ts);
    return ts;
  }

  // ── KYC Registry events ──
  if (KYC_REGISTRY_ADDRESS) {
    for (const event of KYC_EVENTS) {
      try {
        const logs = await client.getLogs({
          address: KYC_REGISTRY_ADDRESS,
          event,
          fromBlock,
          toBlock,
        });
        for (const log of logs) {
          const ts = await getTimestamp(log.blockNumber);
          const args = log.args as Record<string, unknown>;
          insertEvent(
            log.eventName ?? "KYCEvent",
            "KYCRegistry",
            log.transactionHash ?? "",
            Number(log.blockNumber),
            Number(log.logIndex),
            ts,
            {
              account: args.account,
              description: `${formatAddress(String(args.account))} — ${log.eventName}`,
            }
          );
          totalEvents++;
        }
      } catch (err) {
        console.error(`Indexer: error fetching KYC event:`, err);
      }
    }
  }

  // ── WatchNFT events ──
  if (WATCH_NFT_ADDRESS) {
    // WatchMinted
    try {
      const logs = await client.getLogs({
        address: WATCH_NFT_ADDRESS,
        event: NFT_EVENTS[0],
        fromBlock,
        toBlock,
      });
      for (const log of logs) {
        const ts = await getTimestamp(log.blockNumber);
        const args = log.args as Record<string, unknown>;
        insertEvent(
          "WatchMinted",
          "WatchNFT",
          log.transactionHash ?? "",
          Number(log.blockNumber),
          Number(log.logIndex),
          ts,
          {
            tokenId: String(args.tokenId),
            to: args.to,
            uri: args.uri,
            description: `NFT #${args.tokenId} minted to ${formatAddress(String(args.to))}`,
          }
        );
        totalEvents++;
      }
    } catch (err) {
      console.error(`Indexer: error fetching WatchMinted:`, err);
    }

    // NFT Transfer
    try {
      const logs = await client.getLogs({
        address: WATCH_NFT_ADDRESS,
        event: NFT_EVENTS[1],
        fromBlock,
        toBlock,
      });
      for (const log of logs) {
        const ts = await getTimestamp(log.blockNumber);
        const args = log.args as Record<string, unknown>;
        const from = String(args.from);
        const to = String(args.to);
        // Skip mint transfers (covered by WatchMinted)
        if (from === "0x0000000000000000000000000000000000000000") continue;
        insertEvent(
          "NFTTransfer",
          "WatchNFT",
          log.transactionHash ?? "",
          Number(log.blockNumber),
          Number(log.logIndex),
          ts,
          {
            from,
            to,
            tokenId: String(args.tokenId),
            description: `NFT #${args.tokenId}: ${formatAddress(from)} → ${formatAddress(to)}`,
          }
        );
        totalEvents++;
      }
    } catch (err) {
      console.error(`Indexer: error fetching NFT Transfer:`, err);
    }
  }

  // ── WatchShares Transfer events ──
  if (SHARES_ADDRESS) {
    try {
      const logs = await client.getLogs({
        address: SHARES_ADDRESS,
        event: SHARES_EVENTS[0],
        fromBlock,
        toBlock,
      });
      for (const log of logs) {
        const ts = await getTimestamp(log.blockNumber);
        const args = log.args as Record<string, unknown>;
        const from = String(args.from);
        const to = String(args.to);
        const value = args.value as bigint;
        const isMint = from === "0x0000000000000000000000000000000000000000";
        insertEvent(
          isMint ? "SharesMinted" : "SharesTransfer",
          "WatchShares",
          log.transactionHash ?? "",
          Number(log.blockNumber),
          Number(log.logIndex),
          ts,
          {
            from,
            to,
            value: String(value),
            description: isMint
              ? `${formatAmount(value)} WSUB minted to ${formatAddress(to)}`
              : `${formatAmount(value)} WSUB: ${formatAddress(from)} → ${formatAddress(to)}`,
          }
        );
        totalEvents++;
      }
    } catch (err) {
      console.error(`Indexer: error fetching Shares Transfer:`, err);
    }
  }

  // ── WatchSwapPool events ──
  if (POOL_ADDRESS) {
    // Swap
    try {
      const logs = await client.getLogs({
        address: POOL_ADDRESS,
        event: POOL_EVENTS[0],
        fromBlock,
        toBlock,
      });
      for (const log of logs) {
        const ts = await getTimestamp(log.blockNumber);
        const args = log.args as Record<string, unknown>;
        const ethToShares = args.ethToShares as boolean;
        const amountIn = args.amountIn as bigint;
        const amountOut = args.amountOut as bigint;
        insertEvent(
          "Swap",
          "WatchSwapPool",
          log.transactionHash ?? "",
          Number(log.blockNumber),
          Number(log.logIndex),
          ts,
          {
            trader: args.trader,
            ethToShares,
            amountIn: String(amountIn),
            amountOut: String(amountOut),
            description: ethToShares
              ? `Swap ${formatAmount(amountIn)} ETH → ${formatAmount(amountOut)} WSUB`
              : `Swap ${formatAmount(amountIn)} WSUB → ${formatAmount(amountOut)} ETH`,
          }
        );
        totalEvents++;
      }
    } catch (err) {
      console.error(`Indexer: error fetching Swap:`, err);
    }

    // LiquidityAdded
    try {
      const logs = await client.getLogs({
        address: POOL_ADDRESS,
        event: POOL_EVENTS[1],
        fromBlock,
        toBlock,
      });
      for (const log of logs) {
        const ts = await getTimestamp(log.blockNumber);
        const args = log.args as Record<string, unknown>;
        insertEvent(
          "LiquidityAdded",
          "WatchSwapPool",
          log.transactionHash ?? "",
          Number(log.blockNumber),
          Number(log.logIndex),
          ts,
          {
            provider: args.provider,
            sharesAmount: String(args.sharesAmount),
            ethAmount: String(args.ethAmount),
            lpMinted: String(args.lpMinted),
            description: `${formatAddress(String(args.provider))} added liquidity: ${formatAmount(args.sharesAmount as bigint)} WSUB + ${formatAmount(args.ethAmount as bigint)} ETH`,
          }
        );
        totalEvents++;
      }
    } catch (err) {
      console.error(`Indexer: error fetching LiquidityAdded:`, err);
    }

    // LiquidityRemoved
    try {
      const logs = await client.getLogs({
        address: POOL_ADDRESS,
        event: POOL_EVENTS[2],
        fromBlock,
        toBlock,
      });
      for (const log of logs) {
        const ts = await getTimestamp(log.blockNumber);
        const args = log.args as Record<string, unknown>;
        insertEvent(
          "LiquidityRemoved",
          "WatchSwapPool",
          log.transactionHash ?? "",
          Number(log.blockNumber),
          Number(log.logIndex),
          ts,
          {
            provider: args.provider,
            sharesAmount: String(args.sharesAmount),
            ethAmount: String(args.ethAmount),
            lpBurned: String(args.lpBurned),
            description: `${formatAddress(String(args.provider))} removed liquidity: ${formatAmount(args.sharesAmount as bigint)} WSUB + ${formatAmount(args.ethAmount as bigint)} ETH`,
          }
        );
        totalEvents++;
      }
    } catch (err) {
      console.error(`Indexer: error fetching LiquidityRemoved:`, err);
    }
  }

  return totalEvents;
}

// ── Polling loop ──

let isRunning = false;

async function poll() {
  if (isRunning) return;
  isRunning = true;

  try {
    const lastBlock = getLastIndexedBlock();
    const currentBlock = await client.getBlockNumber();
    const fromBlock = BigInt(lastBlock + 1);

    if (fromBlock > currentBlock) {
      isRunning = false;
      return;
    }

    // Process in chunks of 1000 blocks
    const CHUNK_SIZE = BigInt(1000);
    let from = fromBlock;

    while (from <= currentBlock) {
      const to = from + CHUNK_SIZE - BigInt(1) > currentBlock ? currentBlock : from + CHUNK_SIZE - BigInt(1);
      const count = await indexEvents(from, to);
      setLastIndexedBlock(Number(to));

      if (count > 0) {
        console.log(`Indexer: indexed ${count} events from blocks ${from}–${to}`);
      }

      from = to + BigInt(1);
    }
  } catch (err) {
    console.error("Indexer: poll error:", err);
  } finally {
    isRunning = false;
  }
}

let pollTimer: ReturnType<typeof setInterval> | null = null;

export function startIndexer(): void {
  const contracts = [
    KYC_REGISTRY_ADDRESS && "KYCRegistry",
    WATCH_NFT_ADDRESS && "WatchNFT",
    SHARES_ADDRESS && "WatchShares",
    POOL_ADDRESS && "WatchSwapPool",
  ].filter(Boolean);

  if (contracts.length === 0) {
    console.log("Indexer: no contract addresses configured, skipping.");
    return;
  }

  console.log(`Indexer: watching ${contracts.join(", ")} (poll every ${POLL_INTERVAL / 1000}s)`);

  // Initial poll
  poll();

  // Start interval
  pollTimer = setInterval(poll, POLL_INTERVAL);
}

export function stopIndexer(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}
