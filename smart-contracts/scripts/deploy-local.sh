#!/bin/sh
set -e

echo "Waiting for Hardhat node..."
while ! nc -z hardhat-node 8545; do
  sleep 1
done
echo "Hardhat node is up!"

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

echo "KYCRegistry: $KYC_ADDRESS"
echo "WatchNFT: $NFT_ADDRESS"

mkdir -p /shared
cat > /shared/env-contracts <<EOF
NEXT_PUBLIC_WATCH_NFT_ADDRESS=$NFT_ADDRESS
NEXT_PUBLIC_KYC_REGISTRY_ADDRESS=$KYC_ADDRESS
NEXT_PUBLIC_CHAIN_ID=31337
EOF

echo "env-contracts written to /shared/"

echo "Running seed script..."
npx tsx scripts/seed.ts

echo "Deploy + seed complete!"
