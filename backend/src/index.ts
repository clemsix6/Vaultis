import express from "express";
import cors from "cors";
import { isAddress } from "viem";
import {
  createUser,
  findByWallet,
  findByEmail,
  findByToken,
  verifyUser,
  markWhitelisted,
  refreshToken,
  isTokenExpired,
  getEvents,
  getEventsByType,
  getSwapEvents,
  getEventCount,
} from "./db.js";
import { whitelistOnChain, isAuthorizedOnChain } from "./blockchain.js";
import { sendVerificationEmail } from "./email.js";
import { startIndexer } from "./indexer.js";

const app = express();
const PORT = Number(process.env.PORT ?? 3001);
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

app.use(cors({ origin: [FRONTEND_URL, "http://localhost:3000", "http://localhost:3001"] }));
app.use(express.json());

// ── Simple in-memory rate limiter ──
const rateLimits = new Map<string, { count: number; resetAt: number }>();
function rateLimit(key: string, maxPerHour: number): boolean {
  const now = Date.now();
  const entry = rateLimits.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (entry.count >= maxPerHour) return false;
  entry.count++;
  return true;
}

// ── Routes ──

/**
 * POST /api/auth/register
 * Body: { walletAddress: string, email: string }
 */
app.post("/api/auth/register", async (req, res) => {
  try {
    const { walletAddress, email } = req.body;

    if (!walletAddress || !isAddress(walletAddress)) {
      res.status(400).json({ error: "Adresse wallet invalide." });
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: "Adresse email invalide." });
      return;
    }

    if (!rateLimit(`register:${walletAddress.toLowerCase()}`, 3)) {
      res.status(429).json({ error: "Trop de tentatives. Réessayez dans 1 heure." });
      return;
    }

    const existingWallet = findByWallet(walletAddress);
    if (existingWallet) {
      if (existingWallet.verified) {
        res.status(409).json({ error: "Ce wallet est déjà vérifié." });
        return;
      }
      const token = refreshToken(existingWallet.id);
      await sendVerificationEmail(email, token, walletAddress);
      res.json({ message: "Email de vérification renvoyé." });
      return;
    }

    const existingEmail = findByEmail(email);
    if (existingEmail) {
      res.status(409).json({ error: "Cet email est déjà utilisé." });
      return;
    }

    const { token } = createUser(walletAddress, email);
    await sendVerificationEmail(email, token, walletAddress);

    res.status(201).json({ message: "Email de vérification envoyé." });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

/**
 * GET /api/auth/verify?token=xxx
 */
app.get("/api/auth/verify", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== "string") {
      res.status(400).json({ error: "Token manquant." });
      return;
    }

    const user = findByToken(token);
    if (!user) {
      res.status(404).json({ error: "Token invalide ou expiré." });
      return;
    }

    if (user.verified) {
      res.json({ message: "Email déjà vérifié.", walletAddress: user.wallet_address });
      return;
    }

    if (isTokenExpired(user)) {
      res.status(410).json({ error: "Token expiré. Demandez un nouveau lien." });
      return;
    }

    verifyUser(user.id);

    try {
      const txHash = await whitelistOnChain(user.wallet_address as `0x${string}`);
      markWhitelisted(user.id);
      console.log(`Whitelisted ${user.wallet_address} on-chain (tx: ${txHash})`);
      res.json({
        message: "Email vérifié et wallet whitelisté !",
        walletAddress: user.wallet_address,
        txHash,
      });
    } catch (chainErr) {
      console.error("On-chain whitelist failed:", chainErr);
      res.json({
        message: "Email vérifié. Le whitelisting on-chain sera effectué prochainement.",
        walletAddress: user.wallet_address,
        warning: "on-chain whitelist pending",
      });
    }
  } catch (err) {
    console.error("Verify error:", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

/**
 * GET /api/auth/status/:walletAddress
 */
app.get("/api/auth/status/:walletAddress", async (req, res) => {
  try {
    const { walletAddress } = req.params;
    if (!isAddress(walletAddress)) {
      res.status(400).json({ error: "Adresse wallet invalide." });
      return;
    }

    const user = findByWallet(walletAddress);
    const onChainAuthorized = await isAuthorizedOnChain(walletAddress as `0x${string}`).catch(() => false);

    if (!user) {
      res.json({
        status: "unknown",
        registered: false,
        verified: false,
        whitelistedOnChain: onChainAuthorized,
      });
      return;
    }

    res.json({
      status: user.verified ? "verified" : "pending",
      registered: true,
      verified: !!user.verified,
      email: user.email.replace(/(.{2}).*(@.*)/, "$1***$2"),
      whitelistedOnChain: onChainAuthorized,
      registeredAt: user.created_at,
      verifiedAt: user.verified_at,
    });
  } catch (err) {
    console.error("Status error:", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

/**
 * POST /api/auth/resend
 * Body: { walletAddress: string }
 */
app.post("/api/auth/resend", async (req, res) => {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress || !isAddress(walletAddress)) {
      res.status(400).json({ error: "Adresse wallet invalide." });
      return;
    }

    if (!rateLimit(`resend:${walletAddress.toLowerCase()}`, 3)) {
      res.status(429).json({ error: "Trop de tentatives. Réessayez dans 1 heure." });
      return;
    }

    const user = findByWallet(walletAddress);
    if (!user) {
      res.status(404).json({ error: "Wallet non enregistré. Inscrivez-vous d'abord." });
      return;
    }
    if (user.verified) {
      res.status(409).json({ error: "Email déjà vérifié." });
      return;
    }

    const token = refreshToken(user.id);
    await sendVerificationEmail(user.email, token, walletAddress);

    res.json({ message: "Email de vérification renvoyé." });
  } catch (err) {
    console.error("Resend error:", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// ═══════════════════════════════════════════════
// ── Indexer API ──
// ═══════════════════════════════════════════════

app.get("/api/events", (_req, res) => {
  try {
    const { type, limit: lim, offset: off } = _req.query;
    const limit = Math.min(Number(lim) || 50, 200);
    const offset = Number(off) || 0;

    const events = type && typeof type === "string"
      ? getEventsByType(type, limit, offset)
      : getEvents(limit, offset);

    const total = getEventCount();

    res.json({
      events: events.map((e) => ({
        ...e,
        data: JSON.parse(e.data),
      })),
      total,
      limit,
      offset,
    });
  } catch (err) {
    console.error("Events error:", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

app.get("/api/trades", (_req, res) => {
  try {
    const limit = Math.min(Number(_req.query.limit) || 50, 200);
    const offset = Number(_req.query.offset) || 0;

    const trades = getSwapEvents(limit, offset);

    res.json({
      trades: trades.map((e) => ({
        ...e,
        data: JSON.parse(e.data),
      })),
      limit,
      offset,
    });
  } catch (err) {
    console.error("Trades error:", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

app.get("/api/activity", (_req, res) => {
  try {
    const limit = Math.min(Number(_req.query.limit) || 20, 100);
    const events = getEvents(limit, 0);

    res.json({
      activity: events.map((e) => ({
        id: e.id,
        type: e.event_type,
        contract: e.contract,
        txHash: e.tx_hash,
        blockNumber: e.block_number,
        timestamp: e.timestamp,
        data: JSON.parse(e.data),
      })),
    });
  } catch (err) {
    console.error("Activity error:", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// ── Health check ──
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "vaultis-backend" });
});

// ── Start ──
app.listen(PORT, () => {
  console.log(`\nVaultis Backend running on http://localhost:${PORT}`);
  console.log(`  POST /api/auth/register    - Register wallet + email`);
  console.log(`  GET  /api/auth/verify      - Verify email token`);
  console.log(`  GET  /api/auth/status/:addr - Check KYC status`);
  console.log(`  POST /api/auth/resend      - Resend verification email`);
  console.log(`  GET  /api/events           - Blockchain events (indexer)`);
  console.log(`  GET  /api/trades           - DEX trade history`);
  console.log(`  GET  /api/activity         - Activity feed`);
  console.log(`  GET  /api/health           - Health check\n`);

  startIndexer();
});
