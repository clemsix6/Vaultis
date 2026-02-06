import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("DeployModule", (m) => {
  const deployer = m.getAccount(0);

  const kycRegistry = m.contract("KYCRegistry", [deployer]);
  const watchNFT = m.contract("WatchNFT", [deployer, kycRegistry]);

  return { kycRegistry, watchNFT };
});
