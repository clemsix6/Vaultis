import Database from "better-sqlite3";
import path from "node:path";

const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), "vaultis.db");

const db = new Database(DB_PATH);

// WAL mode for better concurrent read performance
db.pragma("journal_mode = WAL");

// ── Schema ──

db.exec(`
  CREATE TABLE IF NOT EXISTS kyc_requests (
    wallet TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    submitted_at INTEGER NOT NULL,
    reviewed_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS indexed_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    block_number INTEGER NOT NULL,
    tx_hash TEXT NOT NULL,
    args TEXT NOT NULL,
    indexed_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_events_type ON indexed_events(type);
  CREATE INDEX IF NOT EXISTS idx_events_block ON indexed_events(block_number);
  CREATE INDEX IF NOT EXISTS idx_kyc_status ON kyc_requests(status);
`);

// ── KYC Queries ──

export interface KYCRequest {
  wallet: string;
  email: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: number;
  reviewedAt: number | null;
}

const insertKYC = db.prepare(
  `INSERT INTO kyc_requests (wallet, email, status, submitted_at) VALUES (?, ?, 'pending', ?)`
);

const getKYC = db.prepare(
  `SELECT wallet, email, status, submitted_at as submittedAt, reviewed_at as reviewedAt FROM kyc_requests WHERE wallet = ?`
);

const listKYC = db.prepare(
  `SELECT wallet, email, status, submitted_at as submittedAt, reviewed_at as reviewedAt FROM kyc_requests ORDER BY submitted_at DESC`
);

const listKYCByStatus = db.prepare(
  `SELECT wallet, email, status, submitted_at as submittedAt, reviewed_at as reviewedAt FROM kyc_requests WHERE status = ? ORDER BY submitted_at DESC`
);

const updateKYCStatus = db.prepare(
  `UPDATE kyc_requests SET status = ?, reviewed_at = ? WHERE wallet = ?`
);

export function submitKYC(wallet: string, email: string): { ok: boolean; error?: string } {
  const existing = getKYC.get(wallet.toLowerCase()) as KYCRequest | undefined;
  if (existing) {
    return { ok: false, error: `KYC request already submitted (status: ${existing.status})` };
  }
  insertKYC.run(wallet.toLowerCase(), email, Date.now());
  return { ok: true };
}

export function getKYCStatus(wallet: string): KYCRequest | null {
  return (getKYC.get(wallet.toLowerCase()) as KYCRequest) ?? null;
}

export function listKYCRequests(status?: string): KYCRequest[] {
  if (status) {
    return listKYCByStatus.all(status) as KYCRequest[];
  }
  return listKYC.all() as KYCRequest[];
}

export function reviewKYC(wallet: string, action: "approved" | "rejected"): KYCRequest | null {
  const existing = getKYC.get(wallet.toLowerCase()) as KYCRequest | undefined;
  if (!existing) return null;
  updateKYCStatus.run(action, Date.now(), wallet.toLowerCase());
  return getKYC.get(wallet.toLowerCase()) as KYCRequest;
}

// ── Events Queries ──

export interface StoredEvent {
  id: number;
  type: string;
  blockNumber: number;
  txHash: string;
  args: Record<string, unknown>;
  indexedAt: number;
}

const insertEvent = db.prepare(
  `INSERT INTO indexed_events (type, block_number, tx_hash, args, indexed_at) VALUES (?, ?, ?, ?, ?)`
);

const listEvents = db.prepare(
  `SELECT id, type, block_number as blockNumber, tx_hash as txHash, args, indexed_at as indexedAt FROM indexed_events ORDER BY block_number DESC LIMIT ?`
);

const listEventsByType = db.prepare(
  `SELECT id, type, block_number as blockNumber, tx_hash as txHash, args, indexed_at as indexedAt FROM indexed_events WHERE type = ? ORDER BY block_number DESC LIMIT ?`
);

const getLastBlock = db.prepare(
  `SELECT MAX(block_number) as lastBlock FROM indexed_events`
);

export const insertEvents = db.transaction((events: { type: string; blockNumber: number; txHash: string; args: Record<string, unknown> }[]) => {
  for (const e of events) {
    insertEvent.run(e.type, e.blockNumber, e.txHash, JSON.stringify(e.args), Date.now());
  }
});

export function getStoredEvents(type?: string, limit = 100): StoredEvent[] {
  const rows = type
    ? listEventsByType.all(type, limit) as any[]
    : listEvents.all(limit) as any[];
  return rows.map((r) => ({ ...r, args: JSON.parse(r.args) }));
}

export function getStoredLastBlock(): number {
  const row = getLastBlock.get() as { lastBlock: number | null };
  return row.lastBlock ?? 0;
}

export default db;
