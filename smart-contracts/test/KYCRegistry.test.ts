import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";

describe("KYCRegistry", async function () {
  const { viem } = await network.connect();
  const [owner, addr1, addr2, addr3] = await viem.getWalletClients();

  async function deploy() {
    return viem.deployContract("KYCRegistry", [owner.account.address]);
  }

  describe("Deployment", async function () {
    it("should set the correct owner", async function () {
      const registry = await deploy();
      assert.equal(
        (await registry.read.owner()).toLowerCase(),
        owner.account.address.toLowerCase(),
      );
    });
  });

  describe("Whitelist", async function () {
    it("should whitelist an address", async function () {
      const registry = await deploy();
      await registry.write.whitelist([addr1.account.address]);
      assert.equal(await registry.read.whitelisted([addr1.account.address]), true);
    });

    it("should emit Whitelisted event", async function () {
      const registry = await deploy();
      await viem.assertions.emit(
        registry.write.whitelist([addr1.account.address]),
        registry,
        "Whitelisted",
      );
    });

    it("should remove from whitelist", async function () {
      const registry = await deploy();
      await registry.write.whitelist([addr1.account.address]);
      await registry.write.removeFromWhitelist([addr1.account.address]);
      assert.equal(await registry.read.whitelisted([addr1.account.address]), false);
    });

    it("should emit RemovedFromWhitelist event", async function () {
      const registry = await deploy();
      await registry.write.whitelist([addr1.account.address]);
      await viem.assertions.emit(
        registry.write.removeFromWhitelist([addr1.account.address]),
        registry,
        "RemovedFromWhitelist",
      );
    });

    it("should batch whitelist", async function () {
      const registry = await deploy();
      await registry.write.batchWhitelist([
        [addr1.account.address, addr2.account.address, addr3.account.address],
      ]);
      assert.equal(await registry.read.whitelisted([addr1.account.address]), true);
      assert.equal(await registry.read.whitelisted([addr2.account.address]), true);
      assert.equal(await registry.read.whitelisted([addr3.account.address]), true);
    });

    it("should revert batch whitelist with empty array", async function () {
      const registry = await deploy();
      await viem.assertions.revertWithCustomError(
        registry.write.batchWhitelist([[]]),
        registry,
        "EmptyArray",
      );
    });

    it("should revert when non-owner tries to whitelist", async function () {
      const registry = await deploy();
      const registryAsAddr1 = await viem.getContractAt(
        "KYCRegistry",
        registry.address,
        { client: { wallet: addr1 } },
      );
      await viem.assertions.revertWithCustomError(
        registryAsAddr1.write.whitelist([addr2.account.address]),
        registry,
        "OwnableUnauthorizedAccount",
      );
    });
  });

  describe("Blacklist", async function () {
    it("should blacklist an address", async function () {
      const registry = await deploy();
      await registry.write.blacklist([addr1.account.address]);
      assert.equal(await registry.read.blacklisted([addr1.account.address]), true);
    });

    it("should emit Blacklisted event", async function () {
      const registry = await deploy();
      await viem.assertions.emit(
        registry.write.blacklist([addr1.account.address]),
        registry,
        "Blacklisted",
      );
    });

    it("should remove from blacklist", async function () {
      const registry = await deploy();
      await registry.write.blacklist([addr1.account.address]);
      await registry.write.removeFromBlacklist([addr1.account.address]);
      assert.equal(await registry.read.blacklisted([addr1.account.address]), false);
    });

    it("should batch blacklist", async function () {
      const registry = await deploy();
      await registry.write.batchBlacklist([
        [addr1.account.address, addr2.account.address],
      ]);
      assert.equal(await registry.read.blacklisted([addr1.account.address]), true);
      assert.equal(await registry.read.blacklisted([addr2.account.address]), true);
    });

    it("should revert batch blacklist with empty array", async function () {
      const registry = await deploy();
      await viem.assertions.revertWithCustomError(
        registry.write.batchBlacklist([[]]),
        registry,
        "EmptyArray",
      );
    });

    it("should revert when non-owner tries to blacklist", async function () {
      const registry = await deploy();
      const registryAsAddr1 = await viem.getContractAt(
        "KYCRegistry",
        registry.address,
        { client: { wallet: addr1 } },
      );
      await viem.assertions.revertWithCustomError(
        registryAsAddr1.write.blacklist([addr2.account.address]),
        registry,
        "OwnableUnauthorizedAccount",
      );
    });
  });

  describe("Authorization", async function () {
    it("should return false for non-whitelisted address", async function () {
      const registry = await deploy();
      assert.equal(await registry.read.isAuthorized([addr1.account.address]), false);
    });

    it("should return true for whitelisted address", async function () {
      const registry = await deploy();
      await registry.write.whitelist([addr1.account.address]);
      assert.equal(await registry.read.isAuthorized([addr1.account.address]), true);
    });

    it("should return false for whitelisted and blacklisted address", async function () {
      const registry = await deploy();
      await registry.write.whitelist([addr1.account.address]);
      await registry.write.blacklist([addr1.account.address]);
      assert.equal(await registry.read.isAuthorized([addr1.account.address]), false);
    });

    it("should return true after removing from blacklist", async function () {
      const registry = await deploy();
      await registry.write.whitelist([addr1.account.address]);
      await registry.write.blacklist([addr1.account.address]);
      await registry.write.removeFromBlacklist([addr1.account.address]);
      assert.equal(await registry.read.isAuthorized([addr1.account.address]), true);
    });
  });
});
