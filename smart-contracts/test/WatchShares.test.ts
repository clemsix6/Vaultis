import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { parseUnits } from "viem";

describe("WatchShares", async function () {
  const { viem } = await network.connect();
  const [owner, addr1, addr2] = await viem.getWalletClients();

  const TOTAL_SHARES = 1000n;
  const PRICE_PER_SHARE = 1500n; // $15.00
  const WATCH_TOKEN_ID = 0n;

  async function deployWithRegistry() {
    const registry = await viem.deployContract("KYCRegistry", [
      owner.account.address,
    ]);
    const shares = await viem.deployContract("WatchShares", [
      "Submariner Blue Shares",
      "WSUB",
      owner.account.address,
      registry.address,
      WATCH_TOKEN_ID,
      TOTAL_SHARES,
      PRICE_PER_SHARE,
    ]);
    return { registry, shares };
  }

  async function deployAndWhitelist() {
    const { registry, shares } = await deployWithRegistry();
    await registry.write.batchWhitelist([
      [owner.account.address, addr1.account.address, addr2.account.address],
    ]);
    return { registry, shares };
  }

  describe("Deployment", async function () {
    it("should set the correct name and symbol", async function () {
      const { shares } = await deployWithRegistry();
      assert.equal(await shares.read.name(), "Submariner Blue Shares");
      assert.equal(await shares.read.symbol(), "WSUB");
    });

    it("should set the correct owner", async function () {
      const { shares } = await deployWithRegistry();
      assert.equal(
        (await shares.read.owner()).toLowerCase(),
        owner.account.address.toLowerCase(),
      );
    });

    it("should set the KYC registry", async function () {
      const { registry, shares } = await deployWithRegistry();
      assert.equal(
        (await shares.read.kycRegistry()).toLowerCase(),
        registry.address.toLowerCase(),
      );
    });

    it("should set immutable fields", async function () {
      const { shares } = await deployWithRegistry();
      assert.equal(await shares.read.watchTokenId(), WATCH_TOKEN_ID);
      assert.equal(await shares.read.pricePerShare(), PRICE_PER_SHARE);
    });

    it("should mint totalShares to the owner", async function () {
      const { shares } = await deployWithRegistry();
      const decimals = await shares.read.decimals();
      const expected = TOTAL_SHARES * 10n ** BigInt(decimals);
      assert.equal(await shares.read.totalSupply(), expected);
      assert.equal(
        await shares.read.balanceOf([owner.account.address]),
        expected,
      );
    });

    it("should revert with zero address registry", async function () {
      const { shares } = await deployWithRegistry();
      await viem.assertions.revertWithCustomError(
        viem.deployContract("WatchShares", [
          "Test",
          "TST",
          owner.account.address,
          "0x0000000000000000000000000000000000000000",
          0n,
          1000n,
          100n,
        ]),
        shares,
        "ZeroAddressRegistry",
      );
    });

    it("should revert with zero total shares", async function () {
      const { registry, shares } = await deployWithRegistry();
      await viem.assertions.revertWithCustomError(
        viem.deployContract("WatchShares", [
          "Test",
          "TST",
          owner.account.address,
          registry.address,
          0n,
          0n,
          100n,
        ]),
        shares,
        "ZeroTotalShares",
      );
    });
  });

  describe("KYC Transfer Enforcement", async function () {
    it("should allow transfer between whitelisted addresses", async function () {
      const { shares } = await deployAndWhitelist();
      const amount = parseUnits("100", 18);
      await shares.write.transfer([addr1.account.address, amount]);
      assert.equal(
        await shares.read.balanceOf([addr1.account.address]),
        amount,
      );
    });

    it("should revert transfer to non-whitelisted address", async function () {
      const { registry, shares } = await deployWithRegistry();
      await registry.write.whitelist([owner.account.address]);
      const amount = parseUnits("100", 18);
      await viem.assertions.revertWithCustomError(
        shares.write.transfer([addr1.account.address, amount]),
        shares,
        "ReceiverNotAuthorized",
      );
    });

    it("should revert transfer from non-whitelisted sender", async function () {
      const { shares } = await deployAndWhitelist();
      const amount = parseUnits("100", 18);
      await shares.write.transfer([addr1.account.address, amount]);

      // Remove addr1 from whitelist
      const { registry } = await deployAndWhitelist();
      // Use fresh deploy for this test
      const freshRegistry = await viem.deployContract("KYCRegistry", [
        owner.account.address,
      ]);
      const freshShares = await viem.deployContract("WatchShares", [
        "Test",
        "TST",
        owner.account.address,
        freshRegistry.address,
        0n,
        1000n,
        100n,
      ]);
      await freshRegistry.write.whitelist([owner.account.address]);
      await freshRegistry.write.whitelist([addr1.account.address]);
      const transferAmount = parseUnits("50", 18);
      await freshShares.write.transfer([addr1.account.address, transferAmount]);

      // Remove addr1 from whitelist
      await freshRegistry.write.removeFromWhitelist([addr1.account.address]);

      const sharesAsAddr1 = await viem.getContractAt(
        "WatchShares",
        freshShares.address,
        { client: { wallet: addr1 } },
      );
      await viem.assertions.revertWithCustomError(
        sharesAsAddr1.write.transfer([addr2.account.address, transferAmount]),
        freshShares,
        "SenderNotAuthorized",
      );
    });

    it("should revert transfer to blacklisted address", async function () {
      const { registry, shares } = await deployAndWhitelist();
      await registry.write.blacklist([addr1.account.address]);
      const amount = parseUnits("100", 18);
      await viem.assertions.revertWithCustomError(
        shares.write.transfer([addr1.account.address, amount]),
        shares,
        "ReceiverNotAuthorized",
      );
    });

    it("should revert transfer from blacklisted sender", async function () {
      const { registry, shares } = await deployAndWhitelist();
      const amount = parseUnits("100", 18);
      await shares.write.transfer([addr1.account.address, amount]);
      await registry.write.blacklist([addr1.account.address]);

      const sharesAsAddr1 = await viem.getContractAt(
        "WatchShares",
        shares.address,
        { client: { wallet: addr1 } },
      );
      await viem.assertions.revertWithCustomError(
        sharesAsAddr1.write.transfer([addr2.account.address, amount]),
        shares,
        "SenderNotAuthorized",
      );
    });
  });

  describe("Allowance & TransferFrom", async function () {
    it("should allow approved transferFrom between whitelisted", async function () {
      const { shares } = await deployAndWhitelist();
      const amount = parseUnits("100", 18);
      await shares.write.transfer([addr1.account.address, amount]);

      const sharesAsAddr1 = await viem.getContractAt(
        "WatchShares",
        shares.address,
        { client: { wallet: addr1 } },
      );
      await sharesAsAddr1.write.approve([owner.account.address, amount]);
      await shares.write.transferFrom([
        addr1.account.address,
        addr2.account.address,
        amount,
      ]);
      assert.equal(
        await shares.read.balanceOf([addr2.account.address]),
        amount,
      );
    });

    it("should enforce KYC on transferFrom receiver", async function () {
      const { registry, shares } = await deployWithRegistry();
      await registry.write.whitelist([owner.account.address]);
      await registry.write.whitelist([addr1.account.address]);
      const amount = parseUnits("100", 18);
      await shares.write.transfer([addr1.account.address, amount]);

      const sharesAsAddr1 = await viem.getContractAt(
        "WatchShares",
        shares.address,
        { client: { wallet: addr1 } },
      );
      await sharesAsAddr1.write.approve([owner.account.address, amount]);
      await viem.assertions.revertWithCustomError(
        shares.write.transferFrom([
          addr1.account.address,
          addr2.account.address,
          amount,
        ]),
        shares,
        "ReceiverNotAuthorized",
      );
    });
  });

  describe("Admin", async function () {
    it("should update KYC registry", async function () {
      const { shares } = await deployAndWhitelist();
      const newRegistry = await viem.deployContract("KYCRegistry", [
        owner.account.address,
      ]);
      await shares.write.setKYCRegistry([newRegistry.address]);
      assert.equal(
        (await shares.read.kycRegistry()).toLowerCase(),
        newRegistry.address.toLowerCase(),
      );
    });

    it("should emit KYCRegistryUpdated event", async function () {
      const { shares } = await deployAndWhitelist();
      const newRegistry = await viem.deployContract("KYCRegistry", [
        owner.account.address,
      ]);
      await viem.assertions.emit(
        shares.write.setKYCRegistry([newRegistry.address]),
        shares,
        "KYCRegistryUpdated",
      );
    });

    it("should revert setKYCRegistry with zero address", async function () {
      const { shares } = await deployAndWhitelist();
      await viem.assertions.revertWithCustomError(
        shares.write.setKYCRegistry([
          "0x0000000000000000000000000000000000000000",
        ]),
        shares,
        "ZeroAddressRegistry",
      );
    });

    it("should revert when non-owner tries to setKYCRegistry", async function () {
      const { shares } = await deployAndWhitelist();
      const newRegistry = await viem.deployContract("KYCRegistry", [
        owner.account.address,
      ]);
      const sharesAsAddr1 = await viem.getContractAt(
        "WatchShares",
        shares.address,
        { client: { wallet: addr1 } },
      );
      await viem.assertions.revertWithCustomError(
        sharesAsAddr1.write.setKYCRegistry([newRegistry.address]),
        shares,
        "OwnableUnauthorizedAccount",
      );
    });
  });
});
