import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { parseEther } from "viem";

describe("WatchShareToken", async function () {
  const { viem } = await network.connect();
  const [owner, addr1, addr2] = await viem.getWalletClients();

  const TOTAL_SHARES = parseEther("1000");

  async function deploy() {
    const registry = await viem.deployContract("KYCRegistry", [
      owner.account.address,
    ]);
    await registry.write.whitelist([owner.account.address]);
    const token = await viem.deployContract("WatchShareToken", [
      "Rolex Submariner Shares",
      "RSX",
      owner.account.address,
      registry.address,
      0n,
      TOTAL_SHARES,
    ]);
    return { registry, token };
  }

  async function deployAndWhitelist() {
    const { registry, token } = await deploy();
    await registry.write.batchWhitelist([
      [addr1.account.address, addr2.account.address],
    ]);
    return { registry, token };
  }

  describe("Deployment", async function () {
    it("should set the correct name and symbol", async function () {
      const { token } = await deploy();
      assert.equal(await token.read.name(), "Rolex Submariner Shares");
      assert.equal(await token.read.symbol(), "RSX");
    });

    it("should mint total shares to owner", async function () {
      const { token } = await deploy();
      assert.equal(
        await token.read.balanceOf([owner.account.address]),
        TOTAL_SHARES,
      );
    });

    it("should set the correct watchTokenId", async function () {
      const { token } = await deploy();
      assert.equal(await token.read.watchTokenId(), 0n);
    });

    it("should revert with zero address registry", async function () {
      const { token } = await deploy();
      await viem.assertions.revertWithCustomError(
        viem.deployContract("WatchShareToken", [
          "Test",
          "TST",
          owner.account.address,
          "0x0000000000000000000000000000000000000000",
          0n,
          TOTAL_SHARES,
        ]),
        token,
        "ZeroAddressRegistry",
      );
    });

    it("should revert with zero supply", async function () {
      const registry = await viem.deployContract("KYCRegistry", [
        owner.account.address,
      ]);
      await registry.write.whitelist([owner.account.address]);
      const { token } = await deploy();
      await viem.assertions.revertWithCustomError(
        viem.deployContract("WatchShareToken", [
          "Test",
          "TST",
          owner.account.address,
          registry.address,
          0n,
          0n,
        ]),
        token,
        "ZeroSupply",
      );
    });
  });

  describe("KYC Transfer Enforcement", async function () {
    it("should allow transfer between whitelisted addresses", async function () {
      const { token } = await deployAndWhitelist();
      await token.write.transfer([addr1.account.address, parseEther("100")]);
      assert.equal(
        await token.read.balanceOf([addr1.account.address]),
        parseEther("100"),
      );
    });

    it("should revert transfer to non-whitelisted address", async function () {
      const { token } = await deploy();
      await viem.assertions.revertWithCustomError(
        token.write.transfer([addr1.account.address, parseEther("100")]),
        token,
        "ReceiverNotAuthorized",
      );
    });

    it("should revert transfer from blacklisted sender", async function () {
      const { registry, token } = await deployAndWhitelist();
      await token.write.transfer([addr1.account.address, parseEther("100")]);
      await registry.write.blacklist([addr1.account.address]);
      const tokenAsAddr1 = await viem.getContractAt(
        "WatchShareToken",
        token.address,
        { client: { wallet: addr1 } },
      );
      await viem.assertions.revertWithCustomError(
        tokenAsAddr1.write.transfer([addr2.account.address, parseEther("50")]),
        token,
        "SenderNotAuthorized",
      );
    });

    it("should revert transfer to blacklisted receiver", async function () {
      const { registry, token } = await deployAndWhitelist();
      await registry.write.blacklist([addr1.account.address]);
      await viem.assertions.revertWithCustomError(
        token.write.transfer([addr1.account.address, parseEther("100")]),
        token,
        "ReceiverNotAuthorized",
      );
    });
  });

  describe("Allowance + TransferFrom", async function () {
    it("should allow transferFrom between whitelisted addresses", async function () {
      const { token } = await deployAndWhitelist();
      await token.write.approve([addr1.account.address, parseEther("100")]);
      const tokenAsAddr1 = await viem.getContractAt(
        "WatchShareToken",
        token.address,
        { client: { wallet: addr1 } },
      );
      await tokenAsAddr1.write.transferFrom([
        owner.account.address,
        addr2.account.address,
        parseEther("100"),
      ]);
      assert.equal(
        await token.read.balanceOf([addr2.account.address]),
        parseEther("100"),
      );
    });

    it("should enforce KYC on transferFrom", async function () {
      const { registry, token } = await deployAndWhitelist();
      await token.write.approve([addr1.account.address, parseEther("100")]);
      await registry.write.removeFromWhitelist([addr2.account.address]);
      const tokenAsAddr1 = await viem.getContractAt(
        "WatchShareToken",
        token.address,
        { client: { wallet: addr1 } },
      );
      await viem.assertions.revertWithCustomError(
        tokenAsAddr1.write.transferFrom([
          owner.account.address,
          addr2.account.address,
          parseEther("100"),
        ]),
        token,
        "ReceiverNotAuthorized",
      );
    });
  });
});
