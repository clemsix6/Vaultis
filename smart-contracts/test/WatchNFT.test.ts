import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { getAddress } from "viem";

describe("WatchNFT", async function () {
  const { viem } = await network.connect();
  const [owner, addr1, addr2] = await viem.getWalletClients();

  const TEST_URI = "https://metadata.example.com/watches/1.json";

  async function deployWithRegistry() {
    const registry = await viem.deployContract("KYCRegistry", [
      owner.account.address,
    ]);
    const nft = await viem.deployContract("WatchNFT", [
      owner.account.address,
      registry.address,
    ]);
    return { registry, nft };
  }

  async function deployAndWhitelist() {
    const { registry, nft } = await deployWithRegistry();
    await registry.write.batchWhitelist([
      [owner.account.address, addr1.account.address, addr2.account.address],
    ]);
    return { registry, nft };
  }

  describe("Deployment", async function () {
    it("should set the correct name and symbol", async function () {
      const { nft } = await deployWithRegistry();
      assert.equal(await nft.read.name(), "LuxWatch");
      assert.equal(await nft.read.symbol(), "LWATCH");
    });

    it("should set the correct owner", async function () {
      const { nft } = await deployWithRegistry();
      assert.equal(
        (await nft.read.owner()).toLowerCase(),
        owner.account.address.toLowerCase(),
      );
    });

    it("should set the KYC registry", async function () {
      const { registry, nft } = await deployWithRegistry();
      assert.equal(
        (await nft.read.kycRegistry()).toLowerCase(),
        registry.address.toLowerCase(),
      );
    });

    it("should revert with zero address registry", async function () {
      const { nft } = await deployWithRegistry();
      await viem.assertions.revertWithCustomError(
        viem.deployContract("WatchNFT", [
          owner.account.address,
          "0x0000000000000000000000000000000000000000",
        ]),
        nft,
        "ZeroAddressRegistry",
      );
    });
  });

  describe("Minting", async function () {
    it("should mint to whitelisted address", async function () {
      const { nft } = await deployAndWhitelist();
      await nft.write.mint([addr1.account.address, TEST_URI]);
      assert.equal(
        (await nft.read.ownerOf([0n])).toLowerCase(),
        addr1.account.address.toLowerCase(),
      );
    });

    it("should revert mint to non-whitelisted address", async function () {
      const { nft } = await deployWithRegistry();
      await viem.assertions.revertWithCustomError(
        nft.write.mint([addr1.account.address, TEST_URI]),
        nft,
        "ReceiverNotAuthorized",
      );
    });

    it("should revert mint to blacklisted address", async function () {
      const { registry, nft } = await deployAndWhitelist();
      await registry.write.blacklist([addr1.account.address]);
      await viem.assertions.revertWithCustomError(
        nft.write.mint([addr1.account.address, TEST_URI]),
        nft,
        "ReceiverNotAuthorized",
      );
    });

    it("should revert when non-owner tries to mint", async function () {
      const { nft } = await deployAndWhitelist();
      const nftAsAddr1 = await viem.getContractAt("WatchNFT", nft.address, {
        client: { wallet: addr1 },
      });
      await viem.assertions.revertWithCustomError(
        nftAsAddr1.write.mint([addr1.account.address, TEST_URI]),
        nft,
        "OwnableUnauthorizedAccount",
      );
    });

    it("should set the correct tokenURI", async function () {
      const { nft } = await deployAndWhitelist();
      await nft.write.mint([addr1.account.address, TEST_URI]);
      assert.equal(await nft.read.tokenURI([0n]), TEST_URI);
    });

    it("should emit WatchMinted event", async function () {
      const { nft } = await deployAndWhitelist();
      await viem.assertions.emitWithArgs(
        nft.write.mint([addr1.account.address, TEST_URI]),
        nft,
        "WatchMinted",
        [0n, getAddress(addr1.account.address), TEST_URI],
      );
    });

    it("should increment token IDs", async function () {
      const { nft } = await deployAndWhitelist();
      await nft.write.mint([addr1.account.address, TEST_URI]);
      await nft.write.mint([addr2.account.address, TEST_URI]);
      assert.equal(
        (await nft.read.ownerOf([0n])).toLowerCase(),
        addr1.account.address.toLowerCase(),
      );
      assert.equal(
        (await nft.read.ownerOf([1n])).toLowerCase(),
        addr2.account.address.toLowerCase(),
      );
    });
  });

  describe("KYC Transfer Enforcement", async function () {
    it("should allow transfer between whitelisted addresses", async function () {
      const { nft } = await deployAndWhitelist();
      await nft.write.mint([addr1.account.address, TEST_URI]);
      const nftAsAddr1 = await viem.getContractAt("WatchNFT", nft.address, {
        client: { wallet: addr1 },
      });
      await nftAsAddr1.write.transferFrom([
        addr1.account.address,
        addr2.account.address,
        0n,
      ]);
      assert.equal(
        (await nft.read.ownerOf([0n])).toLowerCase(),
        addr2.account.address.toLowerCase(),
      );
    });

    it("should revert transfer to non-whitelisted address", async function () {
      const { registry, nft } = await deployWithRegistry();
      await registry.write.whitelist([owner.account.address]);
      await registry.write.whitelist([addr1.account.address]);
      await nft.write.mint([addr1.account.address, TEST_URI]);
      const nftAsAddr1 = await viem.getContractAt("WatchNFT", nft.address, {
        client: { wallet: addr1 },
      });
      await viem.assertions.revertWithCustomError(
        nftAsAddr1.write.transferFrom([
          addr1.account.address,
          addr2.account.address,
          0n,
        ]),
        nft,
        "ReceiverNotAuthorized",
      );
    });

    it("should revert transfer to blacklisted address", async function () {
      const { registry, nft } = await deployAndWhitelist();
      await nft.write.mint([addr1.account.address, TEST_URI]);
      await registry.write.blacklist([addr2.account.address]);
      const nftAsAddr1 = await viem.getContractAt("WatchNFT", nft.address, {
        client: { wallet: addr1 },
      });
      await viem.assertions.revertWithCustomError(
        nftAsAddr1.write.transferFrom([
          addr1.account.address,
          addr2.account.address,
          0n,
        ]),
        nft,
        "ReceiverNotAuthorized",
      );
    });

    it("should revert transfer from blacklisted sender", async function () {
      const { registry, nft } = await deployAndWhitelist();
      await nft.write.mint([addr1.account.address, TEST_URI]);
      await registry.write.blacklist([addr1.account.address]);
      const nftAsAddr1 = await viem.getContractAt("WatchNFT", nft.address, {
        client: { wallet: addr1 },
      });
      await viem.assertions.revertWithCustomError(
        nftAsAddr1.write.transferFrom([
          addr1.account.address,
          addr2.account.address,
          0n,
        ]),
        nft,
        "SenderNotAuthorized",
      );
    });

    it("should revert transfer from removed-whitelist sender", async function () {
      const { registry, nft } = await deployAndWhitelist();
      await nft.write.mint([addr1.account.address, TEST_URI]);
      await registry.write.removeFromWhitelist([addr1.account.address]);
      const nftAsAddr1 = await viem.getContractAt("WatchNFT", nft.address, {
        client: { wallet: addr1 },
      });
      await viem.assertions.revertWithCustomError(
        nftAsAddr1.write.transferFrom([
          addr1.account.address,
          addr2.account.address,
          0n,
        ]),
        nft,
        "SenderNotAuthorized",
      );
    });
  });

  describe("safeTransferFrom", async function () {
    it("should enforce KYC on safeTransferFrom", async function () {
      const { registry, nft } = await deployWithRegistry();
      await registry.write.whitelist([owner.account.address]);
      await registry.write.whitelist([addr1.account.address]);
      await nft.write.mint([addr1.account.address, TEST_URI]);
      const nftAsAddr1 = await viem.getContractAt("WatchNFT", nft.address, {
        client: { wallet: addr1 },
      });
      await viem.assertions.revertWithCustomError(
        nftAsAddr1.write.safeTransferFrom([
          addr1.account.address,
          addr2.account.address,
          0n,
        ]),
        nft,
        "ReceiverNotAuthorized",
      );
    });
  });

  describe("Approval + Transfer", async function () {
    it("should enforce KYC on approved transfer", async function () {
      const { registry, nft } = await deployWithRegistry();
      await registry.write.whitelist([owner.account.address]);
      await registry.write.whitelist([addr1.account.address]);
      await nft.write.mint([addr1.account.address, TEST_URI]);
      const nftAsAddr1 = await viem.getContractAt("WatchNFT", nft.address, {
        client: { wallet: addr1 },
      });
      await nftAsAddr1.write.approve([owner.account.address, 0n]);
      await viem.assertions.revertWithCustomError(
        nft.write.transferFrom([
          addr1.account.address,
          addr2.account.address,
          0n,
        ]),
        nft,
        "ReceiverNotAuthorized",
      );
    });
  });

  describe("Enumerable", async function () {
    it("should track totalSupply", async function () {
      const { nft } = await deployAndWhitelist();
      await nft.write.mint([addr1.account.address, TEST_URI]);
      await nft.write.mint([addr2.account.address, TEST_URI]);
      assert.equal(await nft.read.totalSupply(), 2n);
    });

    it("should track tokenOfOwnerByIndex", async function () {
      const { nft } = await deployAndWhitelist();
      await nft.write.mint([addr1.account.address, TEST_URI]);
      await nft.write.mint([addr1.account.address, "https://example.com/2.json"]);
      assert.equal(await nft.read.tokenOfOwnerByIndex([addr1.account.address, 0n]), 0n);
      assert.equal(await nft.read.tokenOfOwnerByIndex([addr1.account.address, 1n]), 1n);
    });
  });

  describe("Admin", async function () {
    it("should update KYC registry", async function () {
      const { nft } = await deployAndWhitelist();
      const newRegistry = await viem.deployContract("KYCRegistry", [
        owner.account.address,
      ]);
      await nft.write.setKYCRegistry([newRegistry.address]);
      assert.equal(
        (await nft.read.kycRegistry()).toLowerCase(),
        newRegistry.address.toLowerCase(),
      );
    });

    it("should emit KYCRegistryUpdated event", async function () {
      const { nft } = await deployAndWhitelist();
      const newRegistry = await viem.deployContract("KYCRegistry", [
        owner.account.address,
      ]);
      await viem.assertions.emit(
        nft.write.setKYCRegistry([newRegistry.address]),
        nft,
        "KYCRegistryUpdated",
      );
    });

    it("should revert setKYCRegistry with zero address", async function () {
      const { nft } = await deployAndWhitelist();
      await viem.assertions.revertWithCustomError(
        nft.write.setKYCRegistry([
          "0x0000000000000000000000000000000000000000",
        ]),
        nft,
        "ZeroAddressRegistry",
      );
    });

    it("should revert when non-owner tries to setKYCRegistry", async function () {
      const { nft } = await deployAndWhitelist();
      const newRegistry = await viem.deployContract("KYCRegistry", [
        owner.account.address,
      ]);
      const nftAsAddr1 = await viem.getContractAt("WatchNFT", nft.address, {
        client: { wallet: addr1 },
      });
      await viem.assertions.revertWithCustomError(
        nftAsAddr1.write.setKYCRegistry([newRegistry.address]),
        nft,
        "OwnableUnauthorizedAccount",
      );
    });
  });
});
