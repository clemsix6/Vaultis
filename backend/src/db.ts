import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "data", "vaultis.db");

// Ensure data directory exists
import { mkdirSync } from "node:fs";
mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma("journal_mode = WAL");

// ═══════════════════════════════════════════════
// ── Users table (email KYC) ──
// ═══════════════════════════════════════════════

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_address TEXT UNIQUE NOT NULL COLLATE NOCASE,
    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
    verification_token TEXT,
    token_expires_at TEXT,
    verified INTEGER DEFAULT 0,
    whitelisted_on_chain INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    verified_at TEXT
  )
`);

export interface User {
  id: number;
  wallet_address: string;
  email: string;
  verification_token: string | null;
  token_expires_at: string | null;
  verified: number;
  whitelisted_on_chain: number;
  created_at: string;
  verified_at: string | null;
}

// ── Prepared statements ──

const stmtInsert = db.prepare(`
  INSERT INTO users (wallet_address, email, verification_token, token_expires_at)
  VALUES (?, ?, ?, ?)
`);

const stmtFindByWallet = db.prepare(`
  SELECT * FROM users WHERE wallet_address = ? COLLATE NOCASE
`);

const stmtFindByEmail = db.prepare(`
  SELECT * FROM users WHERE email = ? COLLATE NOCASE
`);

const stmtFindByToken = db.prepare(`
  SELECT * FROM users WHERE verification_token = ?
`);

const stmtVerify = db.prepare(`
  UPDATE users SET verified = 1, verified_at = datetime('now'), verification_token = NULL, token_expires_at = NULL
  WHERE id = ?
`);

const stmtMarkWhitelisted = db.prepare(`
  UPDATE users SET whitelisted_on_chain = 1 WHERE id = ?
`);

const stmtUpdateToken = db.prepare(`
  UPDATE users SET verification_token = ?, token_expires_at = ? WHERE id = ?
`);

// ── Public API ──

export function createUser(walletAddress: string, email: string): { token: string } {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h
  stmtInsert.run(walletAddress.toLowerCase(), email.toLowerCase(), token, expiresAt);
  return { token };
}

export function findByWallet(walletAddress: string): User | undefined {
  return stmtFindByWallet.get(walletAddress.toLowerCase()) as User | undefined;
}

export function findByEmail(email: string): User | undefined {
  return stmtFindByEmail.get(email.toLowerCase()) as User | undefined;
}

export function findByToken(token: string): User | undefined {
  return stmtFindByToken.get(token) as User | undefined;
}

export function verifyUser(userId: number): void {
  stmtVerify.run(userId);
}

export function markWhitelisted(userId: number): void {
  stmtMarkWhitelisted.run(userId);
}

export function refreshToken(userId: number): string {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  stmtUpdateToken.run(token, expiresAt, userId);
  return token;
}

export function isTokenExpired(user: User): boolean {
  if (!user.token_expires_at) return true;
  return new Date(user.token_expires_at) < new Date();
}

// ═══════════════════════════════════════════════
// ── Indexer: blockchain events table ──
// ═══════════════════════════════════════════════

db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    contract TEXT NOT NULL,
    tx_hash TEXT NOT NULL,
    block_number INTEGER NOT NULL,
    log_index INTEGER NOT NULL,
    timestamp TEXT,
    data TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(tx_hash, log_index)
  )
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
  CREATE INDEX IF NOT EXISTS idx_events_block ON events(block_number);
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS indexer_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    last_block INTEGER NOT NULL DEFAULT 0
  )
`);

db.exec(`INSERT OR IGNORE INTO indexer_state (id, last_block) VALUES (1, 0)`);

export interface BlockchainEvent {
  id: number;
  event_type: string;
  contract: string;
  tx_hash: string;
  block_number: number;
  log_index: number;
  timestamp: string | null;
  data: string;
  created_at: string;
}

const stmtInsertEvent = db.prepare(`
  INSERT OR IGNORE INTO events (event_type, contract, tx_hash, block_number, log_index, timestamp, data)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const stmtGetLastBlock = db.prepare(`SELECT last_block FROM indexer_state WHERE id = 1`);
const stmtSetLastBlock = db.prepare(`UPDATE indexer_state SET last_block = ? WHERE id = 1`);

const stmtGetEvents = db.prepare(`
  SELECT * FROM events ORDER BY block_number DESC, log_index DESC LIMIT ? OFFSET ?
`);

const stmtGetEventsByType = db.prepare(`
  SELECT * FROM events WHERE event_type = ? ORDER BY block_number DESC, log_index DESC LIMIT ? OFFSET ?
`);

const stmtGetSwapEvents = db.prepare(`
  SELECT * FROM events WHERE event_type = 'Swap' ORDER BY block_number DESC, log_index DESC LIMIT ? OFFSET ?
`);

const stmtCountEvents = db.prepare(`SELECT COUNT(*) as count FROM events`);

export function insertEvent(
  eventType: string,
  contract: string,
  txHash: string,
  blockNumber: number,
  logIndex: number,
  timestamp: string | null,
  data: object
): void {
  stmtInsertEvent.run(eventType, contract, txHash, blockNumber, logIndex, timestamp, JSON.stringify(data));
}

export function getLastIndexedBlock(): number {
  const row = stmtGetLastBlock.get() as { last_block: number } | undefined;
  return row?.last_block ?? 0;
}

export function setLastIndexedBlock(blockNumber: number): void {
  stmtSetLastBlock.run(blockNumber);
}

export function getEvents(limit = 50, offset = 0): BlockchainEvent[] {
  return stmtGetEvents.all(limit, offset) as BlockchainEvent[];
}

export function getEventsByType(type: string, limit = 50, offset = 0): BlockchainEvent[] {
  return stmtGetEventsByType.all(type, limit, offset) as BlockchainEvent[];
}

export function getSwapEvents(limit = 50, offset = 0): BlockchainEvent[] {
  return stmtGetSwapEvents.all(limit, offset) as BlockchainEvent[];
}

export function getEventCount(): number {
  const row = stmtCountEvents.get() as { count: number };
  return row.count;
}
