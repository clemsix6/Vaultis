# Vaultis — Tokenized Luxury Watch Platform

Plateforme de tokenisation de montres de luxe sur EVM (Base Sepolia). Les montres sont representees en NFTs (ERC-721) et fractionnees en parts (ERC-20), avec un systeme de compliance KYC on-chain, un DEX AMM pour le trading, et un oracle de prix.

## Architecture

```
smart-contracts/     Hardhat (Solidity 0.8.28)
  ├── KYCRegistry.sol        KYC whitelist/blacklist on-chain
  ├── WatchNFT.sol            ERC-721 (montre unique, KYC-gated)
  ├── WatchShareToken.sol     ERC-20 (parts fractionnees, KYC-gated)
  ├── WatchPriceOracle.sol    Oracle de prix custom
  ├── SimpleDEX.sol           AMM constant-product (x*y=k), 0.3% fee
  └── WETH.sol                Wrapped ETH pour le DEX

indexer/              Service Node.js
  └── src/index.ts            Poll les events on-chain, expose API REST

frontend/             Next.js 16 + wagmi + viem
  ├── /showroom               Browse toutes les montres NFT
  ├── /watch/:id              Detail d'une montre + prix oracle
  ├── /trade                  Swap shares/WETH via le DEX
  ├── /dashboard              Holdings de l'utilisateur + statut KYC
  └── /admin                  KYC management + Mint NFT + Oracle prix
```

## Choix techniques

| Decision | Justification |
|---|---|
| **Base Sepolia (L2)** | Frais bas, deploiement rapide, compatible EVM. Ideal pour une plateforme RWA qui necessite des transactions frequentes a faible cout. |
| **ERC-721 + ERC-20** | NFT pour la propriete unique d'une montre, ERC-20 pour les parts fractionnees permettant l'investissement accessible. |
| **KYC on-chain** | Enforcement au niveau `_update()` des contrats — impossible de contourner via le frontend. Whitelist + blacklist. |
| **AMM custom (SimpleDEX)** | Pool constant-product simple et auditable, avec KYC enforcement sur les swaps. |
| **Oracle custom** | Pas de feed Chainlink pour les montres de luxe. L'admin pousse les prix estimes du marche. |
| **Next.js + wagmi** | Stack frontend moderne avec hooks React pour les interactions blockchain. |

## Prerequis

- Node.js >= 22
- Docker & Docker Compose (pour le developpement local)
- MetaMask ou un wallet compatible injected

## Lancer en local (Docker)

```bash
docker compose up --build
```

Cela demarre:
- `hardhat-node` sur le port 8545
- `deployer` qui compile, deploie, seed les contrats
- `frontend` sur http://localhost:3000
- `indexer` sur http://localhost:3001

## Lancer en local (sans Docker)

### Smart contracts

```bash
cd smart-contracts
npm install

# Terminal 1: Hardhat node
npx hardhat node

# Terminal 2: Deploy + seed
npx hardhat ignition deploy ignition/modules/Deploy.ts --network localhost
npx tsx scripts/export-abis.ts
npx tsx scripts/seed.ts
```

### Indexer

```bash
cd indexer
npm install
WATCH_NFT_ADDRESS=0x... KYC_REGISTRY_ADDRESS=0x... npm start
```

### Frontend

```bash
cd frontend
npm install

# Creer .env.local avec les adresses des contrats
cat > .env.local <<EOF
NEXT_PUBLIC_WATCH_NFT_ADDRESS=0x...
NEXT_PUBLIC_KYC_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_ORACLE_ADDRESS=0x...
NEXT_PUBLIC_WETH_ADDRESS=0x...
NEXT_PUBLIC_SHARE_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_DEX_ADDRESS=0x...
NEXT_PUBLIC_INDEXER_URL=http://localhost:3001
EOF

npm run dev
```

## Tests

```bash
cd smart-contracts
npx hardhat test
```

77 tests couvrant:
- KYCRegistry (whitelist, blacklist, authorization)
- WatchNFT (mint, transfer KYC enforcement, enumerable)
- WatchShareToken (ERC-20 KYC enforcement)
- WatchPriceOracle (set/get prices, batch)
- SimpleDEX (liquidity, swap, KYC enforcement, slippage)

## Deploiement testnet (Base Sepolia)

```bash
cd smart-contracts

# Configurer les variables
export BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
export PRIVATE_KEY=0x...

npx hardhat ignition deploy ignition/modules/Deploy.ts --network baseSepolia
npx tsx scripts/export-abis.ts
```

## API Indexer

| Endpoint | Description |
|---|---|
| `GET /api/events?type=Swap&limit=50` | Tous les events filtres par type |
| `GET /api/swaps?limit=20` | Historique des swaps DEX |
| `GET /api/prices` | Prix oracle indexes |
| `GET /api/nft-transfers?limit=50` | Transferts NFT |
| `GET /api/kyc-events?limit=50` | Events KYC (whitelist/blacklist) |
| `GET /api/status` | Status de l'indexer (dernier block, uptime) |

## Fonctionnalites

- **Tokenisation NFT (ERC-721)** : Chaque montre de luxe est un NFT unique avec metadata on-chain
- **Parts fractionnees (ERC-20)** : Chaque montre peut etre fractionnee en shares ERC-20
- **KYC on-chain** : Whitelist/blacklist enforce au niveau contrat (impossible a contourner)
- **DEX AMM** : Pool de liquidite constant-product avec 0.3% de frais, KYC-gated
- **Oracle de prix** : Prix des montres pushes on-chain par l'admin
- **Indexer temps reel** : Service qui poll la blockchain et expose les events via API REST
- **Frontend complet** : Showroom, detail montre, trading, dashboard, admin

## Equipe

Projet realise dans le cadre du module Blockchain — Epitech 2025-2026.
