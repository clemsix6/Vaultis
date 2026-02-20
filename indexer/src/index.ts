import http, { type IncomingMessage, type ServerResponse } from "node:http";
import { createPublicClient, http as viemHttp, parseAbiItem, type Log } from "viem";
import { hardhat, baseSepolia } from "viem/chains";
import {
  submitKYC,
  getKYCStatus,
  listKYCRequests,
  reviewKYC,
  insertEvents,
  getStoredEvents,
  getStoredLastBlock,
} from "./db.js";

// ── Config ──

const RPC_URL = process.env.RPC_URL ?? "http://127.0.0.1:8545";
const CHAIN_ID = Number(process.env.CHAIN_ID ?? "31337");
const PORT = Number(process.env.PORT ?? "3001");
const POLL_INTERVAL = Number(process.env.POLL_INTERVAL ?? "15000"); // 15s
const START_BLOCK = Number(process.env.START_BLOCK ?? "0");

const WATCH_NFT_ADDRESS = process.env.WATCH_NFT_ADDRESS as `0x${string}` | undefined;
const KYC_REGISTRY_ADDRESS = process.env.KYC_REGISTRY_ADDRESS as `0x${string}` | undefined;
const ORACLE_ADDRESS = process.env.ORACLE_ADDRESS as `0x${string}` | undefined;
const DEX_ADDRESS = process.env.DEX_ADDRESS as `0x${string}` | undefined;
const SHARE_TOKEN_ADDRESS = process.env.SHARE_TOKEN_ADDRESS as `0x${string}` | undefined;

// ── Event signatures ──

const events = {
  Transfer: parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"),
  ERC20Transfer: parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 value)"),
  Swap: parseAbiItem("event Swap(address indexed user, address indexed tokenIn, uint256 amountIn, uint256 amountOut)"),
  PriceUpdated: parseAbiItem("event PriceUpdated(uint256 indexed tokenId, uint256 price, uint256 timestamp)"),
  LiquidityAdded: parseAbiItem("event LiquidityAdded(address indexed provider, uint256 amountA, uint256 amountB, uint256 lpMinted)"),
  LiquidityRemoved: parseAbiItem("event LiquidityRemoved(address indexed provider, uint256 amountA, uint256 amountB, uint256 lpBurned)"),
  Whitelisted: parseAbiItem("event Whitelisted(address indexed account)"),
  Blacklisted: parseAbiItem("event Blacklisted(address indexed account)"),
  WatchMinted: parseAbiItem("event WatchMinted(uint256 indexed tokenId, address indexed to, string uri)"),
};

// ── In-memory tracking (last polled block) ──

const storedBlock = getStoredLastBlock();
let lastPolledBlock = BigInt(storedBlock > 0 ? storedBlock : START_BLOCK);

// ── Viem client ──

const chain = CHAIN_ID === 84532 ? baseSepolia : hardhat;
const client = createPublicClient({
  chain,
  transport: viemHttp(RPC_URL),
});

// ── Polling logic ──

const MAX_BLOCK_RANGE = 9000n; // RPC limit is 10,000, keep margin

async function pollEvents() {
  try {
    const currentBlock = await client.getBlockNumber();
    if (currentBlock <= lastPolledBlock) return;

    // Cap range to MAX_BLOCK_RANGE to avoid RPC limits
    const fromBlock = lastPolledBlock + 1n;
    const toBlock = fromBlock + MAX_BLOCK_RANGE < currentBlock
      ? fromBlock + MAX_BLOCK_RANGE
      : currentBlock;

    console.log(`[indexer] Polling blocks ${fromBlock} → ${toBlock}`);

    const logPromises: Promise<Log[]>[] = [];

    if (WATCH_NFT_ADDRESS) {
      logPromises.push(
        client.getLogs({ address: WATCH_NFT_ADDRESS, event: events.Transfer, fromBlock, toBlock }) as Promise<Log[]>
      );
      logPromises.push(
        client.getLogs({ address: WATCH_NFT_ADDRESS, event: events.WatchMinted, fromBlock, toBlock }) as Promise<Log[]>
      );
    }

    if (DEX_ADDRESS) {
      logPromises.push(
        client.getLogs({ address: DEX_ADDRESS, event: events.Swap, fromBlock, toBlock }) as Promise<Log[]>
      );
      logPromises.push(
        client.getLogs({ address: DEX_ADDRESS, event: events.LiquidityAdded, fromBlock, toBlock }) as Promise<Log[]>
      );
      logPromises.push(
        client.getLogs({ address: DEX_ADDRESS, event: events.LiquidityRemoved, fromBlock, toBlock }) as Promise<Log[]>
      );
    }

    if (ORACLE_ADDRESS) {
      logPromises.push(
        client.getLogs({ address: ORACLE_ADDRESS, event: events.PriceUpdated, fromBlock, toBlock }) as Promise<Log[]>
      );
    }

    if (KYC_REGISTRY_ADDRESS) {
      logPromises.push(
        client.getLogs({ address: KYC_REGISTRY_ADDRESS, event: events.Whitelisted, fromBlock, toBlock }) as Promise<Log[]>
      );
      logPromises.push(
        client.getLogs({ address: KYC_REGISTRY_ADDRESS, event: events.Blacklisted, fromBlock, toBlock }) as Promise<Log[]>
      );
    }

    if (SHARE_TOKEN_ADDRESS) {
      logPromises.push(
        client.getLogs({ address: SHARE_TOKEN_ADDRESS, event: events.ERC20Transfer, fromBlock, toBlock }) as Promise<Log[]>
      );
    }

    const allLogs = await Promise.all(logPromises);

    // Collect events for batch insert into SQLite
    const batch: { type: string; blockNumber: number; txHash: string; args: Record<string, unknown> }[] = [];

    for (const logs of allLogs) {
      for (const log of logs) {
        const eventName = (log as any).eventName ?? "Unknown";
        const rawArgs = (log as any).args ?? {};
        // Serialize bigints to strings for JSON storage
        const args: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(rawArgs)) {
          args[k] = typeof v === "bigint" ? String(v) : v;
        }
        batch.push({
          type: eventName,
          blockNumber: Number(log.blockNumber ?? 0),
          txHash: log.transactionHash ?? "",
          args,
        });
      }
    }

    if (batch.length > 0) {
      insertEvents(batch);
    }

    lastPolledBlock = toBlock;
    console.log(`[indexer] Synced to block ${toBlock}, indexed ${batch.length} new events`);
  } catch (err) {
    console.error("[indexer] Poll error:", err);
  }
}

// ── HTTP helpers ──

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk: Buffer) => { body += chunk.toString(); });
    req.on("end", () => resolve(body));
  });
}

function json(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status);
  res.end(JSON.stringify(data));
}

// ── HTTP API ──

const server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  // ── Indexed events endpoints ──

  if (url.pathname === "/api/events") {
    const type = url.searchParams.get("type") ?? undefined;
    const limit = Number(url.searchParams.get("limit") ?? "100");
    json(res, 200, {
      events: getStoredEvents(type, limit),
      lastBlock: String(lastPolledBlock),
    });
  } else if (url.pathname === "/api/swaps") {
    const limit = Number(url.searchParams.get("limit") ?? "50");
    json(res, 200, { swaps: getStoredEvents("Swap", limit) });
  } else if (url.pathname === "/api/prices") {
    const priceEvents = getStoredEvents("PriceUpdated", 1000);
    // Deduplicate: keep latest per tokenId
    const latest = new Map<string, { price: string; updatedAt: string }>();
    for (const e of priceEvents) {
      const tokenId = String(e.args.tokenId);
      if (!latest.has(tokenId)) {
        latest.set(tokenId, {
          price: String(e.args.price),
          updatedAt: String(e.args.timestamp),
        });
      }
    }
    json(res, 200, { prices: Object.fromEntries(latest) });
  } else if (url.pathname === "/api/nft-transfers") {
    const limit = Number(url.searchParams.get("limit") ?? "50");
    json(res, 200, { transfers: getStoredEvents("Transfer", limit) });
  } else if (url.pathname === "/api/kyc-events") {
    const limit = Number(url.searchParams.get("limit") ?? "50");
    const whitelisted = getStoredEvents("Whitelisted", limit);
    const blacklisted = getStoredEvents("Blacklisted", limit);
    json(res, 200, { events: [...whitelisted, ...blacklisted] });

  // ── KYC submission endpoints ──

  } else if (url.pathname === "/api/kyc/submit" && req.method === "POST") {
    const body = await readBody(req);
    try {
      const { wallet, email } = JSON.parse(body);
      if (!wallet || !email) {
        json(res, 400, { error: "wallet and email are required" });
        return;
      }
      const result = submitKYC(wallet, email);
      if (!result.ok) {
        json(res, 409, { error: result.error });
      } else {
        console.log(`[kyc] New KYC request: ${wallet} (${email})`);
        json(res, 201, { message: "KYC request submitted" });
      }
    } catch {
      json(res, 400, { error: "Invalid JSON" });
    }
  } else if (url.pathname === "/api/kyc/status") {
    const wallet = url.searchParams.get("wallet");
    if (!wallet) {
      json(res, 400, { error: "wallet parameter required" });
      return;
    }
    json(res, 200, { request: getKYCStatus(wallet) });
  } else if (url.pathname === "/api/kyc/requests") {
    const status = url.searchParams.get("status") ?? undefined;
    json(res, 200, { requests: listKYCRequests(status) });
  } else if (url.pathname === "/api/kyc/review" && req.method === "POST") {
    const body = await readBody(req);
    try {
      const { wallet, action } = JSON.parse(body);
      if (!wallet || !["approved", "rejected"].includes(action)) {
        json(res, 400, { error: "wallet and action (approved|rejected) required" });
        return;
      }
      const request = reviewKYC(wallet, action);
      if (!request) {
        json(res, 404, { error: "KYC request not found" });
      } else {
        console.log(`[kyc] KYC ${action}: ${wallet}`);
        json(res, 200, { message: `KYC ${action}`, request });
      }
    } catch {
      json(res, 400, { error: "Invalid JSON" });
    }

  // ── Status ──

  } else if (url.pathname === "/api/status") {
    json(res, 200, {
      lastBlock: String(lastPolledBlock),
      totalEvents: getStoredEvents(undefined, 999999).length,
      uptime: process.uptime(),
    });
  } else {
    json(res, 404, { error: "Not found" });
  }
});

// ── Start ──

server.listen(PORT, () => {
  console.log(`[indexer] API listening on http://localhost:${PORT}`);
  console.log(`[indexer] Polling ${RPC_URL} every ${POLL_INTERVAL}ms`);
  console.log(`[indexer] SQLite database ready`);

  pollEvents();
  setInterval(pollEvents, POLL_INTERVAL);
});
