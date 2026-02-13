# PLAN.md - Vaultis : Plan de complétion du projet

## Suivi d'avancement global

| Phase | Description | Statut | Branche |
|-------|------------|--------|---------|
| Phase 1 | Token ERC-20 WatchShares | ✅ Terminé | `feature/erc20-watch-shares` |
| Phase 2 | DEX / AMM Pool (WatchSwapPool) | ✅ Terminé | `feature/erc20-watch-shares` |
| Phase 3 | Backend + Email KYC | ✅ Terminé | `feature/erc20-watch-shares` |
| Phase 4 | Oracle on-chain | ⏭️ Délégué (collègue) | — |
| Phase 5 | Indexer temps réel | ✅ Terminé | `feature/erc20-watch-shares` |
| Phase 6 | Déploiement Base Sepolia | ⬜ À faire | — |
| Phase 7 | Hosting Vercel + Backend | ⬜ À faire | — |
| Phase 8 | Documentation README | ⬜ À faire | — |
| Phase 9 | Préparation démo | ⬜ À faire | — |

## Inventaire complet du projet

### Smart Contracts (4 contrats — 80/80 tests)

| Contrat | Type | Fichier | Tests |
|---------|------|---------|-------|
| KYCRegistry.sol | Whitelist/Blacklist, owner-only | `smart-contracts/contracts/KYCRegistry.sol` | ✅ 42 tests |
| WatchNFT.sol | ERC-721 + Enumerable + URIStorage, KYC-gated | `smart-contracts/contracts/WatchNFT.sol` | ✅ 42 tests |
| WatchShares.sol | ERC-20, KYC-gated, fractional ownership | `smart-contracts/contracts/WatchShares.sol` | ✅ 18 tests |
| WatchSwapPool.sol | AMM (x*y=k), 0.3% fee, KYC-gated | `smart-contracts/contracts/WatchSwapPool.sol` | ✅ 20 tests |

### Backend (Express + SQLite + Viem)

| Fichier | Rôle |
|---------|------|
| `backend/src/index.ts` | Serveur Express, routes auth + indexer |
| `backend/src/db.ts` | SQLite : tables `users` + `events` + `indexer_state` |
| `backend/src/blockchain.ts` | Viem client : whitelist on-chain, isAuthorized |
| `backend/src/email.ts` | Envoi email Resend (ou console en dev) |
| `backend/src/indexer.ts` | Polling blockchain events toutes les 10s |

**Endpoints API :**
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Inscription wallet + email |
| GET | `/api/auth/verify?token=xxx` | Vérifie email, whitelist on-chain |
| GET | `/api/auth/status/:addr` | Statut KYC d'un wallet |
| POST | `/api/auth/resend` | Renvoie l'email de vérification |
| GET | `/api/events?type=&limit=` | Événements blockchain indexés |
| GET | `/api/trades?limit=` | Historique des swaps DEX |
| GET | `/api/activity?limit=` | Feed d'activité récent |
| GET | `/api/health` | Health check |

### Frontend (Next.js 16 — 10 pages)

| Page | Route | Description |
|------|-------|-------------|
| Accueil | `/` | Landing page 3D |
| Showroom | `/showroom` | Galerie NFTs on-chain |
| Shares | `/shares` | ERC-20 : solde, transfert, portfolio |
| Trade | `/trade` | Swap AMM (ETH ↔ WSUB) |
| Activité | `/activity` | Feed événements blockchain temps réel |
| Dashboard | `/dashboard` | Vue d'ensemble portefeuille |
| Admin | `/admin` | Gestion KYC + Mint NFT |
| Vérification | `/verify` | Callback email vérification |

**Hooks frontend :**
| Hook | Fichier |
|------|---------|
| useWatchNFT (8 hooks) | `src/hooks/useWatchNFT.ts` |
| useKYCRegistry (4 hooks) | `src/hooks/useKYCRegistry.ts` |
| useWatchShares (8 hooks) | `src/hooks/useWatchShares.ts` |
| useSwapPool (11 hooks) | `src/hooks/useSwapPool.ts` |
| useContractWrite (11 hooks) | `src/hooks/useContractWrite.ts` |
| useEmailKYC (4 hooks) | `src/hooks/useEmailKYC.ts` |
| useIndexer (3 hooks) | `src/hooks/useIndexer.ts` |

### Infrastructure

| Composant | Fichier | Statut |
|-----------|---------|--------|
| Docker Compose (4 services) | `docker-compose.yml` | ✅ |
| Hardhat Ignition (deploy) | `smart-contracts/ignition/modules/Deploy.ts` | ✅ |
| Seed script (NFTs + liquidity) | `smart-contracts/scripts/seed.ts` | ✅ |
| Export ABIs | `smart-contracts/scripts/export-abis.ts` | ✅ |
| Deploy local script | `smart-contracts/scripts/deploy-local.sh` | ✅ |

## Ce qui reste à faire

1. ~~Token ERC-20 fungible~~ ✅
2. ~~Trading on-chain + Pool de liquidité DEX~~ ✅
3. ~~Backend + Vérification email~~ ✅
4. **Oracle on-chain** — délégué à un collègue
5. ~~Indexer temps réel~~ ✅
6. **Déploiement sur testnet** (Base Sepolia) — Phase 6
7. **Hosting frontend + backend** (Vercel + service) — Phase 7
8. **Documentation complète** (README.md) — Phase 8

---

## PHASE 1 : Token ERC-20 — WatchShares (Propriété fractionnée) ✅

> **Statut : TERMINÉ** — Contrat déployé, 18 tests, page `/shares` fonctionnelle.

### Ce qui a été fait
- **`WatchShares.sol`** : ERC-20 + Ownable, KYC-gated via `_update()` override
  - Pattern `_initializing` pour skip KYC pendant le mint du constructor
  - `watchTokenId` + `pricePerShare` en storage immutable
- **18 tests** dans `WatchShares.test.ts` (deploy, mint, transfer, KYC revert, blacklist)
- **Deploy.ts** mis à jour : déploie WatchShares après WatchNFT (1000 WSUB à $15/share)
- **Frontend** : 8 hooks read (`useWatchShares.ts`), page `/shares` avec solde, portfolio value, transfert
- **Dashboard** enrichi avec carte "Parts ERC-20"

---

## PHASE 2 : Trading On-Chain + DEX (AMM Pool) ✅

> **Statut : TERMINÉ** — AMM custom déployé, 20 tests, page `/trade` fonctionnelle.

### Ce qui a été fait
- **`WatchSwapPool.sol`** : AMM simple (x * y = k) avec fee 0.3%, KYC-gated
  - `addLiquidity()` / `removeLiquidity()` avec LP token interne
  - `swapETHForShares()` / `swapSharesForETH()` avec slippage protection
  - `getAmountOut()` + `getSharePriceInETH()` view helpers
  - Le pool contract est lui-même whitelisté dans KYCRegistry pour détenir des tokens
- **20 tests** dans `WatchSwapPool.test.ts`
- **Seed script** ajoute liquidité initiale : 500 WSUB + 5 ETH
- **Frontend** : 11 hooks dans `useSwapPool.ts`, page `/trade` avec :
  - Interface swap avec direction toggle (ETH→WSUB / WSUB→ETH)
  - Calcul output estimé, price impact, slippage 1%
  - Stats de la pool (réserves, LP, prix par share)

---

## PHASE 3 : Backend + Vérification Email (KYC Flow) ✅

> **Statut : TERMINÉ** — Backend Express fonctionnel, email KYC, whitelist on-chain automatique.

### Ce qui a été fait
- **Backend** (`backend/`) : Express 5 + TypeScript + SQLite + Viem + Resend
  - `src/index.ts` : serveur avec routes auth, rate limiting, CORS
  - `src/db.ts` : table `users` (wallet, email, token, verified, whitelisted_on_chain)
  - `src/blockchain.ts` : whitelist/isAuthorized on-chain via Viem
  - `src/email.ts` : Resend (ou console log en dev mode sans API key)
- **4 endpoints auth** : register, verify, status, resend
- **Sécurité** : rate limiting (3/h), token expiration 24h, CORS, email validation
- **Frontend** :
  - `useEmailKYC.ts` : 4 hooks (status, register, resend, verify)
  - `EmailVerificationModal.tsx` : 3 états (inscription / pending / verified)
  - `ConnectButton.tsx` enrichi : indicateur KYC (shield vert/jaune)
  - Page `/verify` : callback email vérification
- **Docker** : service `backend` ajouté dans `docker-compose.yml`

---

## PHASE 4 : Oracle On-Chain (Prix des montres) ⏭️

> **Statut : DÉLÉGUÉ** — Pris en charge par un collègue.

### Objectif
Fournir un prix de référence on-chain pour au moins une montre/collection, mis à jour par un oracle.

### Éléments prévus
- Smart Contract `WatchPriceOracle.sol` avec `setPrice()`, `getPrice()`, `batchSetPrices()`
- Script `oracle-updater.ts` (cron ou manuel)
- Hook frontend `useWatchOracle.ts`
- Affichage prix oracle sur les WatchCards

---

## PHASE 5 : Indexer Temps Réel ✅

> **Statut : TERMINÉ** — Intégré dans le backend, 3 endpoints API, page `/activity` temps réel.

### Ce qui a été fait
- **`backend/src/indexer.ts`** : Service intégré au backend (pas de service séparé)
  - Poll toutes les 10 secondes via `viem.getLogs()`
  - Indexe par chunks de 1000 blocks
  - Persiste `last_block` en SQLite (table `indexer_state`)
  - Événements indexés (11 types) :
    - KYCRegistry : `Whitelisted`, `RemovedFromWhitelist`, `Blacklisted`, `RemovedFromBlacklist`
    - WatchNFT : `WatchMinted`, `NFTTransfer`
    - WatchShares : `SharesMinted`, `SharesTransfer`
    - WatchSwapPool : `Swap`, `LiquidityAdded`, `LiquidityRemoved`
- **`backend/src/db.ts`** : Table `events` (event_type, contract, tx_hash, block_number, log_index, timestamp, data JSON) + `indexer_state`
- **3 endpoints API** : `/api/events`, `/api/trades`, `/api/activity`
- **Frontend** :
  - `useIndexer.ts` : 3 hooks (`useEvents`, `useTrades`, `useActivity`) avec auto-refresh 10s
  - Page `/activity` : feed temps réel avec filtres par type, stats, indicateur "Live", liens BaseScan

---

## PHASE 6 : Déploiement Testnet (Base Sepolia)

### Objectif
Tout déployer sur Base Sepolia pour la soutenance. C'est **obligatoire**.

### 6.1 Prérequis
- Un wallet avec des ETH Base Sepolia (faucet gratuit)
- Clé privée dans `.env` (PRIVATE_KEY)
- RPC URL Base Sepolia (Alchemy/Infura gratuit)

### 6.2 Déploiement des contrats
- Utiliser `hardhat ignition deploy --network baseSepolia`
- Déployer dans l'ordre : KYCRegistry → WatchNFT → WatchShares → WatchPriceOracle
- Sauvegarder les adresses déployées
- Vérifier les contrats sur BaseScan (optionnel mais impressionne)

### 6.3 Initialisation
- Whitelist le deployer
- Mint quelques NFTs de démo
- Mint des WatchShares
- Créer la pool Uniswap + ajouter liquidité
- Mettre à jour les prix oracle

### 6.4 Variables d'environnement
- Mettre à jour les `NEXT_PUBLIC_*` pour pointer vers Base Sepolia
- `NEXT_PUBLIC_RPC_URL` → Base Sepolia RPC
- `NEXT_PUBLIC_WATCH_NFT_ADDRESS` → adresse déployée
- `NEXT_PUBLIC_KYC_REGISTRY_ADDRESS` → adresse déployée
- Ajouter les nouvelles adresses (WatchShares, Oracle, Uniswap pair)

### Livrable
Tous les contrats déployés et fonctionnels sur Base Sepolia.

---

## PHASE 7 : Hosting (Vercel + Backend)

### Objectif
Héberger le frontend sur Vercel et le backend sur un service gratuit. **Obligatoire** selon le cahier des charges.

### 7.1 Frontend - Vercel
- Connecter le repo GitHub
- Build command : `cd frontend && npm run build`
- Root directory : `frontend`
- Variables d'environnement : toutes les `NEXT_PUBLIC_*` avec les adresses Base Sepolia
- Framework preset : Next.js

### 7.2 Backend - Render / Railway (gratuit)
- Déployer le backend Express sur Render (free tier) ou Railway
- Variables d'environnement : `PRIVATE_KEY`, `RESEND_API_KEY`, `KYC_REGISTRY_ADDRESS`, `RPC_URL`
- Base SQLite persistante (ou passer à PostgreSQL gratuit sur Render si besoin)
- L'indexer peut tourner dans le même process (cron interne)

### 7.3 Vérifications
- Tester que le site fonctionne avec MetaMask sur Base Sepolia
- Tester le flow complet : connexion wallet → email → vérification → whitelist
- Vérifier le Showroom, Dashboard, Admin, Trading
- Tester un swap en live

### Livrable
URL Vercel (frontend) + URL Render (backend) fonctionnelles et accessibles publiquement.

---

## PHASE 8 : Documentation (README.md)

### Objectif
README complet. Le prof dit "a complete README.md file can be enough".

### 8.1 Contenu du README
1. **Titre + Description** : Vaultis - Tokenized Luxury Watch Platform
2. **Choix techniques justifiés** :
   - Pourquoi Base Sepolia (L2, gas bas, écosystème EVM, compatible Uniswap)
   - Pourquoi les montres de luxe (marché RWA en croissance, assets traçables)
   - Pourquoi Hardhat 3 + Viem (moderne, type-safe)
3. **Architecture** : Diagramme des contrats et leur interaction
4. **Smart Contracts** : Description de chaque contrat, fonctions clés
5. **Frontend** : Stack, pages, fonctionnalités
6. **Indexer** : Comment il fonctionne
7. **Oracle** : Source de données, fréquence de mise à jour
8. **Comment lancer le projet** :
   - En local (Docker Compose)
   - Sur testnet (Vercel + Base Sepolia)
9. **Adresses des contrats déployés** (Base Sepolia)
10. **Lien Vercel**
11. **Captures d'écran** des fonctionnalités clés

### Livrable
README.md complet à la racine du projet.

---

## PHASE 9 : Préparation Soutenance (Demo)

### Objectif
Préparer une démo fluide qui couvre **tous les critères obligatoires** du cahier des charges.

### 9.1 Scénario de démo (ordre suggéré)

1. **Présentation** (2 min)
   - Vaultis = plateforme de tokenisation de montres de luxe
   - Choix de Base Sepolia (justification technique)
   - Architecture globale

2. **Tokenisation** (3 min)
   - Montrer le Showroom avec les montres NFT (ERC-721)
   - Montrer les WatchShares (ERC-20) — propriété fractionnée
   - Minter un nouveau NFT en live depuis l'admin

3. **Compliance / KYC** (4 min)
   - Connecter un nouveau wallet → montrer le modal "Vérifiez votre email"
   - Entrer un email → recevoir le mail de vérification → cliquer le lien
   - Montrer que le wallet est automatiquement whitelisté on-chain
   - Montrer la page Admin → Gestion KYC manuelle (blacklist une adresse)
   - Tenter un transfer vers l'adresse blacklistée → revert on-chain
   - Insister : "le KYC est enforced on-chain, pas juste dans le frontend"

4. **Trading / DEX** (3 min)
   - Montrer la pool Uniswap avec la liquidité
   - Faire un swap WatchShares → ETH en live
   - Montrer que le prix bouge après le swap

5. **Oracle** (2 min)
   - Montrer le prix oracle affiché sur les montres
   - Lancer le script de mise à jour
   - Montrer que le prix change dans le frontend

6. **Indexer** (2 min)
   - Faire une transaction directement sur Etherscan/BaseScan (en dehors de l'UI)
   - Montrer que l'indexer capte l'event et que le frontend se met à jour
   - "Même si quelqu'un trade en dehors de notre UI, on le voit"

7. **Questions** (5 min)

---

## Prochaines étapes

| Priorité | Phase | Statut | Estimation |
|----------|-------|--------|------------|
| ~~P0~~ | ~~Phase 1 : ERC-20 WatchShares~~ | ✅ Terminé | — |
| ~~P0~~ | ~~Phase 2 : DEX + AMM Pool~~ | ✅ Terminé | — |
| ~~P0~~ | ~~Phase 3 : Backend + Email KYC~~ | ✅ Terminé | — |
| ~~P0~~ | ~~Phase 4 : Oracle~~ | ⏭️ Collègue | — |
| ~~P0~~ | ~~Phase 5 : Indexer~~ | ✅ Terminé | — |
| **P1** | **Phase 6 : Déploiement Base Sepolia** | ⬜ À faire | ~3-4h |
| **P1** | **Phase 7 : Hosting Vercel + Backend** | ⬜ À faire | ~2-3h |
| **P2** | **Phase 8 : README** | ⬜ À faire | ~3-4h |
| **P2** | **Phase 9 : Préparer la démo** | ⬜ À faire | ~2-3h |

### Ce qu'il reste à faire

```
Phase 6 (Déploiement Base Sepolia)
    │
    ▼
Phase 7 (Hosting Vercel + Backend)
    │
    ├── Phase 8 (README)
    └── Phase 9 (Préparation démo)
```

**Estimation restante : ~10-14h de travail.**
