import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("DeployModule", (m) => {
  const deployer = m.getAccount(0);

  const kycRegistry = m.contract("KYCRegistry", [deployer]);
  const watchNFT = m.contract("WatchNFT", [deployer, kycRegistry]);

  // WatchShares: fractional ownership of Watch #0 (Submariner Blue)
  // 1000 shares at $15.00 each (1500 in 1e2 scale)
  const watchSharesSub = m.contract("WatchShares", [
    "Submariner Blue Shares",
    "WSUB",
    deployer,
    kycRegistry,
    0n,    // watchTokenId (will be token #0 after mint)
    1000n, // totalShares
    1500n, // pricePerShare ($15.00)
  ]);

  // WatchSwapPool: AMM pool for WatchShares/ETH trading
  const swapPool = m.contract("WatchSwapPool", [
    watchSharesSub,
    kycRegistry,
    deployer,
  ]);

  return { kycRegistry, watchNFT, watchSharesSub, swapPool };
});
