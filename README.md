# Vaultis

Vaultis is a tokenized asset management platform for luxury watches, built on an EVM-compatible blockchain. The idea is straightforward: represent real-world watches as on-chain assets, let verified investors trade fractional shares of those watches, and keep everything compliant through an on-chain KYC system that can't be bypassed.

A luxury watch worth 50,000 euros isn't accessible to most investors. But if you split it into 1,000 fungible tokens worth 50 euros each, anyone who passes KYC can buy a share. The watch is represented as a unique NFT (ERC-721) that holds its metadata — brand, model, serial number. The fractional shares are standard ERC-20 tokens tied to that NFT. Both token types enforce KYC at the smart contract level: if your address isn't whitelisted, you can't hold or trade any tokenized asset. Period.

## Why Base Sepolia

The project targets Base Sepolia, an Ethereum L2 testnet. The choice comes down to three things.

First, cost. A real-world asset platform involves frequent small transactions — KYC approvals, share trades, price updates, liquidity operations. On Ethereum L1, each of these costs a few dollars in gas. On Base, it's fractions of a cent. For a platform where users trade 50-euro shares, paying 3 dollars in gas per swap doesn't make sense.

Second, compatibility. Base is a standard OP Stack rollup. It's fully EVM-compatible, which means the same Solidity contracts, the same tooling (Hardhat, viem, wagmi), and the same wallet experience (MetaMask). There's no custom VM, no new language to learn, no bridging complexity for the demo.

Third, finality. Base inherits Ethereum's security while offering faster block times. For a trading platform, users expect near-instant feedback when they swap tokens or add liquidity. L2 gives that without sacrificing the trust guarantees of Ethereum.

## How it works

### Tokenization

Each luxury watch exists on-chain in two forms.

The **WatchNFT** contract is an ERC-721 that represents unique watch ownership. Each token holds on-chain metadata: brand, model, reference number, and a URI pointing to extended data. The contract uses OpenZeppelin's ERC721Enumerable, so the frontend can iterate over all existing watches without relying on off-chain indexes. Minting is restricted to the contract owner (the platform admin).

The **WatchShareToken** contract is an ERC-20 that represents fractional shares of a specific watch. When a watch is fractionalized, a new WatchShareToken is deployed with a fixed supply — say 1,000 tokens for a watch worth 50,000 euros. Each token represents 1/1000th ownership of the underlying asset. The contract stores a reference to the WatchNFT token ID it's attached to, making the link between the NFT and its shares explicit and verifiable on-chain.

Both contracts override the internal `_update()` function to check the KYC registry before every transfer. This means compliance is enforced at the EVM level, not in the frontend. Even if someone interacts directly with the contract through Etherscan or a script, the transfer reverts if either party isn't whitelisted.

### KYC and compliance

The **KYCRegistry** contract is the single source of truth for user authorization. It maintains a mapping of addresses to their status: whitelisted, blacklisted, or unknown. Only the contract owner can modify these statuses.

The flow works like this: a user connects their wallet on the frontend and submits a KYC request with their email. This request is stored in the backend's SQLite database with a "pending" status. The admin sees it in the admin panel, reviews it, and if approved, sends two actions — marking the request as approved in the backend, and calling `whitelist()` on the KYCRegistry contract. The on-chain whitelist is what actually matters: without it, the user can't do anything with tokenized assets.

Blacklisting works the same way in reverse. If a user needs to be revoked (regulatory issue, suspicious activity), the admin calls `blacklist()` and that address is immediately locked out of all token operations. The blacklist takes priority over the whitelist — if an address is blacklisted, it doesn't matter if it was previously whitelisted.

The important design decision here is that KYC enforcement lives in the smart contracts themselves, not in the frontend. The frontend just provides a convenient UI for managing it. You could remove the entire frontend and the compliance rules would still be enforced by the EVM.

### Trading

The **SimpleDEX** contract is a constant-product automated market maker, the same model popularized by Uniswap V2. It manages a single liquidity pool pairing WatchShareToken with WETH (Wrapped ETH).

The core invariant is `x * y = k`, where x and y are the reserves of each token. When someone swaps token A for token B, the contract calculates how much B to give based on maintaining this invariant. A 0.3% fee is taken on every swap and stays in the pool, benefiting liquidity providers.

We chose to build a custom AMM rather than forking Uniswap for two reasons. First, simplicity — the full SimpleDEX contract is under 200 lines of Solidity, which makes it easy to audit and explain during a demo. Second, KYC integration — every function (`addLiquidity`, `removeLiquidity`, `swap`) checks the KYC registry before executing. On a standard Uniswap deployment, anyone can trade. On Vaultis, only whitelisted users can participate, which is the whole point.

Liquidity providers deposit equal-value amounts of both tokens and receive LP tokens (ERC-20) representing their share of the pool. When they withdraw, they burn their LP tokens and get back their proportional share of both reserves plus accumulated fees.

The **WETH** contract is a minimal Wrapped ETH implementation for the testnet. Users deposit ETH and receive an equivalent amount of WETH (an ERC-20), which can then be used in the DEX. This is necessary because the AMM needs two ERC-20 tokens — raw ETH doesn't implement the ERC-20 interface.

### Oracle

The **WatchPriceOracle** contract provides on-chain price data for each tokenized watch. The admin pushes estimated market prices (sourced from watch market platforms and dealers), and these prices are stored on-chain with timestamps.

We use a custom oracle rather than Chainlink because Chainlink doesn't have price feeds for luxury watches. Their feeds cover crypto pairs, forex, and commodities — not individual Patek Philippe or Rolex references. Since our asset class is niche and prices are updated infrequently (watches don't fluctuate like crypto), a simple admin-pushed oracle is appropriate. The contract supports both individual updates (`setPrice`) and batch updates (`batchSetPrices`) for efficiency.

Each price entry stores the value in wei and the timestamp of the update. The frontend reads these to display current estimated values on watch detail pages.

### Indexer

The indexer is a Node.js service that polls the blockchain for events and stores them in a local SQLite database. It also serves as the backend for KYC request management.

Every 15 seconds, the indexer queries the blockchain for new blocks and extracts relevant events: NFT transfers, share token transfers, swaps, liquidity operations, price updates, and KYC status changes (whitelist/blacklist). These events are stored in SQLite and exposed through a REST API that the frontend consumes.

The reason for the indexer is simple: reading historical data directly from the blockchain is slow and limited. If a user swaps tokens through Etherscan (outside our UI), the change needs to appear in our frontend. The indexer catches these external interactions by watching the actual on-chain events, not just tracking what happens through our UI.

The same service handles KYC request storage. When a user submits their email through the frontend, it goes to the indexer's API, gets stored in SQLite, and appears in the admin panel. This keeps the architecture simple — one backend service handles both blockchain event indexing and KYC state management.

SQLite was chosen over a full database server because the workload is small and the deployment is simple. One file, no daemon to manage, no connection pooling to configure. WAL mode is enabled for concurrent read performance.

## Build and run

Prerequisites: **Node.js 22+**, **Docker & Docker Compose** (for local development), and a browser wallet like **MetaMask**.

### Docker (recommended)

```bash
docker compose up --build
```

This starts four services:
- **hardhat-node** on port 8545 — local EVM blockchain
- **deployer** — compiles contracts, deploys them, runs the seed script
- **frontend** on port 3000 — Next.js application
- **indexer** on port 3001 — blockchain polling + KYC backend

Once all containers are up, open `http://localhost:3000` and connect MetaMask to `localhost:8545` (chain ID 31337). Import the first Hardhat account (`0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`) — this is the admin wallet that owns all contracts.

### Without Docker

Start the blockchain, deploy contracts, then run the frontend and indexer separately.

```bash
# Terminal 1 — local blockchain
cd smart-contracts
npm install
npx hardhat node

# Terminal 2 — deploy and seed
cd smart-contracts
npx hardhat ignition deploy ignition/modules/Deploy.ts --network localhost
npx tsx scripts/export-abis.ts
npx tsx scripts/seed.ts

# Terminal 3 — indexer
cd indexer
npm install
WATCH_NFT_ADDRESS=0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9 \
KYC_REGISTRY_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3 \
ORACLE_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0 \
DEX_ADDRESS=0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82 \
SHARE_TOKEN_ADDRESS=0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e \
npm start

# Terminal 4 — frontend
cd frontend
npm install
npm run dev
```

The seed script deploys a complete demo environment: whitelists the admin, mints 3 watch NFTs with metadata, sets oracle prices, deploys a WatchShareToken for the first watch, wraps 5 ETH, deploys a SimpleDEX pool, and adds initial liquidity.

### Testnet deployment (Base Sepolia)

```bash
cd smart-contracts
export BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
export PRIVATE_KEY=0x...

npx hardhat ignition deploy ignition/modules/Deploy.ts --network baseSepolia
npx tsx scripts/export-abis.ts
npx tsx scripts/seed.ts
```

The frontend is hosted on Vercel with the contract addresses configured as environment variables.

## Testing

```bash
cd smart-contracts
npx hardhat test
```

The test suite covers all 5 smart contracts with 77 test cases.

**KYCRegistry** tests verify whitelisting and blacklisting mechanics, authorization checks, owner-only access control, and edge cases like re-whitelisting a blacklisted address.

**WatchNFT** tests cover minting with metadata, KYC-gated transfers (verifying that transfers between non-whitelisted addresses revert), enumerable functionality, and the interaction between the NFT and the KYC registry.

**WatchShareToken** tests validate ERC-20 functionality with KYC enforcement — transfers between whitelisted users succeed, transfers involving non-whitelisted users revert, and the token correctly references its parent WatchNFT token ID.

**WatchPriceOracle** tests check individual and batch price updates, timestamp tracking, owner-only write access, and that reading prices for non-existent tokens returns zero.

**SimpleDEX** tests cover the full AMM lifecycle: adding initial liquidity, adding proportional liquidity, swapping in both directions, removing liquidity, slippage protection, KYC enforcement on all operations, and edge cases like swapping with zero amount or removing more LP tokens than owned.

## Stack

The smart contracts are written in **Solidity 0.8.28** using **OpenZeppelin v5** for standard implementations (ERC-721, ERC-20, Ownable). **Hardhat v3** handles compilation, testing (with `node:test` and `node:assert`), and deployment through **Hardhat Ignition** modules. The **viem** library is used for all blockchain interactions in scripts and tests.

The frontend is a **Next.js 16** application (App Router) using **wagmi** for wallet connection and contract interactions, and **viem** as the underlying Ethereum library. The UI is built with **HeroUI** (component library), **Tailwind CSS** for styling, and **Framer Motion** for animations.

The indexer is a **Node.js** service using **viem** to poll blockchain events and **better-sqlite3** for local persistence. It exposes a plain HTTP API (no framework, just `node:http`) to keep dependencies minimal.

## Project

Built for the Blockchain module — Epitech 2025-2026.
