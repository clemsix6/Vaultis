import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("DeployModule", (m) => {
  const deployer = m.getAccount(0);

  // Core contracts
  const kycRegistry = m.contract("KYCRegistry", [deployer]);
  const watchNFT = m.contract("WatchNFT", [deployer, kycRegistry]);

  // Oracle
  const watchPriceOracle = m.contract("WatchPriceOracle", [deployer]);

  // WETH mock for DEX
  const weth = m.contract("WETH", []);

  // Marketplace (pays in RSX — WatchShareToken deployed separately via seed)
  // Uses WETH as placeholder payment token; real deployment points to WatchShareToken
  const marketplace = m.contract("WatchMarketplace", [watchNFT, weth, kycRegistry, deployer]);

  return { kycRegistry, watchNFT, watchPriceOracle, weth, marketplace };
});
