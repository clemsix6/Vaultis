#!/bin/sh
set -e

echo "Waiting for Hardhat node..."
while ! nc -z hardhat-node 8545; do
  sleep 1
done
echo "Hardhat node is up!"

export HARDHAT_NODE_URL=http://hardhat-node:8545

echo "Compiling contracts..."
npx hardhat compile

echo "Deploying contracts..."
npx hardhat ignition deploy ignition/modules/Deploy.ts --network localhost

echo "Exporting ABIs..."
ABI_OUTPUT_DIR=/abi-out npx tsx scripts/export-abis.ts

echo "Extracting deployed addresses..."
DEPLOYED_FILE="ignition/deployments/chain-31337/deployed_addresses.json"

KYC_ADDRESS=$(node -e "const d=JSON.parse(require('fs').readFileSync('$DEPLOYED_FILE','utf-8'));console.log(d['DeployModule#KYCRegistry'])")
NFT_ADDRESS=$(node -e "const d=JSON.parse(require('fs').readFileSync('$DEPLOYED_FILE','utf-8'));console.log(d['DeployModule#WatchNFT'])")
ORACLE_ADDRESS=$(node -e "const d=JSON.parse(require('fs').readFileSync('$DEPLOYED_FILE','utf-8'));console.log(d['DeployModule#WatchPriceOracle'])")
WETH_ADDRESS=$(node -e "const d=JSON.parse(require('fs').readFileSync('$DEPLOYED_FILE','utf-8'));console.log(d['DeployModule#WETH'])")
MARKETPLACE_ADDRESS=$(node -e "const d=JSON.parse(require('fs').readFileSync('$DEPLOYED_FILE','utf-8'));console.log(d['DeployModule#WatchMarketplace'])")

echo "KYCRegistry: $KYC_ADDRESS"
echo "WatchNFT: $NFT_ADDRESS"
echo "Oracle: $ORACLE_ADDRESS"
echo "WETH: $WETH_ADDRESS"
echo "Marketplace: $MARKETPLACE_ADDRESS"

mkdir -p /shared
cat > /shared/env-contracts <<EOF
NEXT_PUBLIC_WATCH_NFT_ADDRESS=$NFT_ADDRESS
NEXT_PUBLIC_KYC_REGISTRY_ADDRESS=$KYC_ADDRESS
NEXT_PUBLIC_ORACLE_ADDRESS=$ORACLE_ADDRESS
NEXT_PUBLIC_WETH_ADDRESS=$WETH_ADDRESS
NEXT_PUBLIC_MARKETPLACE_ADDRESS=$MARKETPLACE_ADDRESS
NEXT_PUBLIC_CHAIN_ID=31337
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
EOF

echo "env-contracts written to /shared/"

echo "Running seed script..."
npx tsx scripts/seed.ts

echo "Deploy + seed complete!"
