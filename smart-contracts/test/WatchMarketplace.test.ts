import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { parseEther, getAddress } from "viem";

describe("WatchMarketplace", async function () {
  const { viem } = await network.connect();
  const [owner, buyer, addr2] = await viem.getWalletClients();

  const TEST_URI = "https://metadata.example.com/watches/1.json";

  async function deployAll() {
    const registry = await viem.deployContract("KYCRegistry", [
      owner.account.address,
    ]);
    const nft = await viem.deployContract("WatchNFT", [
      owner.account.address,
      registry.address,
    ]);
    const marketplace = await viem.deployContract("WatchMarketplace", [
      nft.address,
      registry.address,
      owner.account.address,
    ]);

    // Whitelist owner, buyer, and the marketplace contract
    await registry.write.batchWhitelist([
      [
        owner.account.address,
        buyer.account.address,
        addr2.account.address,
        marketplace.address,
      ],
    ]);

    return { registry, nft, marketplace };
  }

  async function deployAndMint() {
    const { registry, nft, marketplace } = await deployAll();

    // Mint NFT #0 to owner
    await nft.write.mint([owner.account.address, TEST_URI]);

    // Approve marketplace for all NFTs
    await nft.write.setApprovalForAll([marketplace.address, true]);

    return { registry, nft, marketplace };
  }

  describe("Deployment", async function () {
    it("should set the correct watchNFT address", async function () {
      const { nft, marketplace } = await deployAll();
      assert.equal(
        (await marketplace.read.watchNFT()).toLowerCase(),
        nft.address.toLowerCase(),
      );
    });

    it("should set the correct owner", async function () {
      const { marketplace } = await deployAll();
      assert.equal(
        (await marketplace.read.owner()).toLowerCase(),
        owner.account.address.toLowerCase(),
      );
    });

    it("should start with zero active listings", async function () {
      const { marketplace } = await deployAll();
      assert.equal(await marketplace.read.getActiveListingCount(), 0n);
    });
  });

  describe("listWatch", async function () {
    it("should list a watch successfully", async function () {
      const { nft, marketplace } = await deployAndMint();

      await marketplace.write.listWatch([0n, parseEther("5")]);

      // NFT should be held by marketplace
      assert.equal(
        (await nft.read.ownerOf([0n])).toLowerCase(),
        marketplace.address.toLowerCase(),
      );

      // Listing should be active
      const listing = await marketplace.read.listings([0n]);
      assert.equal(listing[0].toLowerCase(), owner.account.address.toLowerCase()); // seller
      assert.equal(listing[1], parseEther("5")); // price
      assert.equal(listing[2], true); // isActive

      // Active listing count
      assert.equal(await marketplace.read.getActiveListingCount(), 1n);
    });

    it("should emit WatchListed event", async function () {
      const { marketplace } = await deployAndMint();
      await viem.assertions.emit(
        marketplace.write.listWatch([0n, parseEther("5")]),
        marketplace,
        "WatchListed",
      );
    });

    it("should revert if price is zero", async function () {
      const { marketplace } = await deployAndMint();
      await viem.assertions.revertWithCustomError(
        marketplace.write.listWatch([0n, 0n]),
        marketplace,
        "ZeroPriceNotAllowed",
      );
    });

    it("should revert if caller is not KYC authorized", async function () {
      const { registry, nft, marketplace } = await deployAndMint();

      // Remove buyer from whitelist
      await registry.write.removeFromWhitelist([addr2.account.address]);

      // addr2 tries to list (they don't own NFT either, but KYC check comes first)
      const marketplaceAsAddr2 = await viem.getContractAt(
        "WatchMarketplace",
        marketplace.address,
        { client: { wallet: addr2 } },
      );

      await viem.assertions.revertWithCustomError(
        marketplaceAsAddr2.write.listWatch([0n, parseEther("1")]),
        marketplace,
        "NotAuthorized",
      );
    });

    it("should revert if already listed", async function () {
      const { nft, marketplace } = await deployAndMint();

      await marketplace.write.listWatch([0n, parseEther("5")]);

      // Try to list again
      await viem.assertions.revertWithCustomError(
        marketplace.write.listWatch([0n, parseEther("10")]),
        marketplace,
        "AlreadyListed",
      );
    });
  });

  describe("cancelListing", async function () {
    it("should cancel a listing and return NFT", async function () {
      const { nft, marketplace } = await deployAndMint();

      await marketplace.write.listWatch([0n, parseEther("5")]);
      await marketplace.write.cancelListing([0n]);

      // NFT should be returned to owner
      assert.equal(
        (await nft.read.ownerOf([0n])).toLowerCase(),
        owner.account.address.toLowerCase(),
      );

      // Listing should be inactive
      const listing = await marketplace.read.listings([0n]);
      assert.equal(listing[2], false);

      // No active listings
      assert.equal(await marketplace.read.getActiveListingCount(), 0n);
    });

    it("should emit WatchDelisted event", async function () {
      const { marketplace } = await deployAndMint();

      await marketplace.write.listWatch([0n, parseEther("5")]);
      await viem.assertions.emit(
        marketplace.write.cancelListing([0n]),
        marketplace,
        "WatchDelisted",
      );
    });

    it("should revert if listing is not active", async function () {
      const { marketplace } = await deployAndMint();

      await viem.assertions.revertWithCustomError(
        marketplace.write.cancelListing([0n]),
        marketplace,
        "ListingNotActive",
      );
    });

    it("should revert if caller is not the seller", async function () {
      const { marketplace } = await deployAndMint();

      await marketplace.write.listWatch([0n, parseEther("5")]);

      const marketplaceAsBuyer = await viem.getContractAt(
        "WatchMarketplace",
        marketplace.address,
        { client: { wallet: buyer } },
      );

      await viem.assertions.revertWithCustomError(
        marketplaceAsBuyer.write.cancelListing([0n]),
        marketplace,
        "NotSeller",
      );
    });
  });

  describe("buyWatch", async function () {
    it("should transfer NFT to buyer and ETH to seller", async function () {
      const { nft, marketplace } = await deployAndMint();
      const price = parseEther("5");

      await marketplace.write.listWatch([0n, price]);

      const marketplaceAsBuyer = await viem.getContractAt(
        "WatchMarketplace",
        marketplace.address,
        { client: { wallet: buyer } },
      );

      const publicClient = await viem.getPublicClient();
      const sellerBalanceBefore = await publicClient.getBalance({
        address: owner.account.address,
      });

      await marketplaceAsBuyer.write.buyWatch([0n], { value: price });

      // NFT should belong to buyer
      assert.equal(
        (await nft.read.ownerOf([0n])).toLowerCase(),
        buyer.account.address.toLowerCase(),
      );

      // Listing should be inactive
      const listing = await marketplace.read.listings([0n]);
      assert.equal(listing[2], false);

      // Seller should have received ETH
      const sellerBalanceAfter = await publicClient.getBalance({
        address: owner.account.address,
      });
      assert.ok(sellerBalanceAfter > sellerBalanceBefore);

      // No active listings
      assert.equal(await marketplace.read.getActiveListingCount(), 0n);
    });

    it("should emit WatchSold event", async function () {
      const { marketplace } = await deployAndMint();
      const price = parseEther("5");

      await marketplace.write.listWatch([0n, price]);

      const marketplaceAsBuyer = await viem.getContractAt(
        "WatchMarketplace",
        marketplace.address,
        { client: { wallet: buyer } },
      );

      await viem.assertions.emit(
        marketplaceAsBuyer.write.buyWatch([0n], { value: price }),
        marketplace,
        "WatchSold",
      );
    });

    it("should revert if listing is not active", async function () {
      const { marketplace } = await deployAndMint();

      const marketplaceAsBuyer = await viem.getContractAt(
        "WatchMarketplace",
        marketplace.address,
        { client: { wallet: buyer } },
      );

      await viem.assertions.revertWithCustomError(
        marketplaceAsBuyer.write.buyWatch([0n], { value: parseEther("5") }),
        marketplace,
        "ListingNotActive",
      );
    });

    it("should revert if payment is incorrect", async function () {
      const { marketplace } = await deployAndMint();

      await marketplace.write.listWatch([0n, parseEther("5")]);

      const marketplaceAsBuyer = await viem.getContractAt(
        "WatchMarketplace",
        marketplace.address,
        { client: { wallet: buyer } },
      );

      // Too low
      await viem.assertions.revertWithCustomError(
        marketplaceAsBuyer.write.buyWatch([0n], { value: parseEther("1") }),
        marketplace,
        "IncorrectPayment",
      );

      // Too high
      await viem.assertions.revertWithCustomError(
        marketplaceAsBuyer.write.buyWatch([0n], { value: parseEther("10") }),
        marketplace,
        "IncorrectPayment",
      );
    });

    it("should revert if buyer is not KYC authorized", async function () {
      const { registry, marketplace } = await deployAndMint();

      await marketplace.write.listWatch([0n, parseEther("5")]);

      // Remove addr2 from whitelist
      await registry.write.removeFromWhitelist([addr2.account.address]);

      const marketplaceAsAddr2 = await viem.getContractAt(
        "WatchMarketplace",
        marketplace.address,
        { client: { wallet: addr2 } },
      );

      await viem.assertions.revertWithCustomError(
        marketplaceAsAddr2.write.buyWatch([0n], { value: parseEther("5") }),
        marketplace,
        "NotAuthorized",
      );
    });
  });

  describe("getActiveListings", async function () {
    it("should return active listing IDs with pagination", async function () {
      const { nft, marketplace } = await deployAndMint();

      // Mint more NFTs
      await nft.write.mint([owner.account.address, TEST_URI]);
      await nft.write.mint([owner.account.address, TEST_URI]);

      // List all 3
      await marketplace.write.listWatch([0n, parseEther("5")]);
      await marketplace.write.listWatch([1n, parseEther("10")]);
      await marketplace.write.listWatch([2n, parseEther("15")]);

      assert.equal(await marketplace.read.getActiveListingCount(), 3n);

      // Get first 2
      const page1 = await marketplace.read.getActiveListings([0n, 2n]);
      assert.equal(page1.length, 2);

      // Get last 1
      const page2 = await marketplace.read.getActiveListings([2n, 2n]);
      assert.equal(page2.length, 1);

      // Out of range
      const page3 = await marketplace.read.getActiveListings([10n, 5n]);
      assert.equal(page3.length, 0);
    });

    it("should update after buy and cancel", async function () {
      const { nft, marketplace } = await deployAndMint();

      await nft.write.mint([owner.account.address, TEST_URI]);

      await marketplace.write.listWatch([0n, parseEther("5")]);
      await marketplace.write.listWatch([1n, parseEther("10")]);

      assert.equal(await marketplace.read.getActiveListingCount(), 2n);

      // Buy #0
      const marketplaceAsBuyer = await viem.getContractAt(
        "WatchMarketplace",
        marketplace.address,
        { client: { wallet: buyer } },
      );
      await marketplaceAsBuyer.write.buyWatch([0n], { value: parseEther("5") });

      assert.equal(await marketplace.read.getActiveListingCount(), 1n);

      // Cancel #1
      await marketplace.write.cancelListing([1n]);

      assert.equal(await marketplace.read.getActiveListingCount(), 0n);
    });
  });

  describe("Edge cases", async function () {
    it("should allow re-listing after cancel", async function () {
      const { nft, marketplace } = await deployAndMint();

      await marketplace.write.listWatch([0n, parseEther("5")]);
      await marketplace.write.cancelListing([0n]);

      // Re-approve needed since NFT is back to owner
      await nft.write.setApprovalForAll([marketplace.address, true]);

      // Re-list at different price
      await marketplace.write.listWatch([0n, parseEther("8")]);

      const listing = await marketplace.read.listings([0n]);
      assert.equal(listing[1], parseEther("8"));
      assert.equal(listing[2], true);
      assert.equal(await marketplace.read.getActiveListingCount(), 1n);
    });

    it("should allow re-listing after someone buys and re-sells", async function () {
      const { registry, nft, marketplace } = await deployAndMint();

      await marketplace.write.listWatch([0n, parseEther("5")]);

      // Buyer buys
      const marketplaceAsBuyer = await viem.getContractAt(
        "WatchMarketplace",
        marketplace.address,
        { client: { wallet: buyer } },
      );
      await marketplaceAsBuyer.write.buyWatch([0n], { value: parseEther("5") });

      // Buyer re-lists
      const nftAsBuyer = await viem.getContractAt("WatchNFT", nft.address, {
        client: { wallet: buyer },
      });
      await nftAsBuyer.write.setApprovalForAll([marketplace.address, true]);
      await marketplaceAsBuyer.write.listWatch([0n, parseEther("10")]);

      const listing = await marketplace.read.listings([0n]);
      assert.equal(listing[0].toLowerCase(), buyer.account.address.toLowerCase());
      assert.equal(listing[1], parseEther("10"));
      assert.equal(listing[2], true);
    });
  });
});
