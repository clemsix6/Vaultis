import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { parseEther } from "viem";

describe("SimpleDEX", async function () {
  const { viem } = await network.connect();
  const [owner, addr1, addr2] = await viem.getWalletClients();

  async function deploy() {
    const registry = await viem.deployContract("KYCRegistry", [
      owner.account.address,
    ]);

    // Deploy WETH mock
    const weth = await viem.deployContract("WETH", []);

    // Deploy WatchShareToken (KYC-gated ERC-20)
    await registry.write.whitelist([owner.account.address]);
    const shareToken = await viem.deployContract("WatchShareToken", [
      "Rolex Shares",
      "RSX",
      owner.account.address,
      registry.address,
      0n,
      parseEther("10000"),
    ]);

    // Deploy DEX
    const dex = await viem.deployContract("SimpleDEX", [
      shareToken.address,
      weth.address,
      registry.address,
      owner.account.address,
    ]);

    // Whitelist the DEX contract so it can receive KYC-gated tokens
    await registry.write.whitelist([dex.address]);

    return { registry, weth, shareToken, dex };
  }

  async function deployWithLiquidity() {
    const { registry, weth, shareToken, dex } = await deploy();

    // Whitelist users
    await registry.write.batchWhitelist([
      [addr1.account.address, addr2.account.address],
    ]);

    // Owner deposits ETH to get WETH
    await weth.write.deposit([], { value: parseEther("100") });

    // Approve DEX to spend tokens
    await shareToken.write.approve([dex.address, parseEther("5000")]);
    await weth.write.approve([dex.address, parseEther("50")]);

    // Add initial liquidity: 5000 shares / 50 WETH (price = 0.01 ETH per share)
    await dex.write.addLiquidity([parseEther("5000"), parseEther("50")]);

    return { registry, weth, shareToken, dex };
  }

  describe("Deployment", async function () {
    it("should set the correct tokens", async function () {
      const { shareToken, weth, dex } = await deploy();
      assert.equal(
        (await dex.read.tokenA()).toLowerCase(),
        shareToken.address.toLowerCase(),
      );
      assert.equal(
        (await dex.read.tokenB()).toLowerCase(),
        weth.address.toLowerCase(),
      );
    });

    it("should have zero reserves initially", async function () {
      const { dex } = await deploy();
      assert.equal(await dex.read.reserveA(), 0n);
      assert.equal(await dex.read.reserveB(), 0n);
    });
  });

  describe("Add Liquidity", async function () {
    it("should add initial liquidity and mint LP tokens", async function () {
      const { dex } = await deployWithLiquidity();
      assert.equal(await dex.read.reserveA(), parseEther("5000"));
      assert.equal(await dex.read.reserveB(), parseEther("50"));
      const lpBalance = await dex.read.balanceOf([owner.account.address]);
      assert.ok(lpBalance > 0n);
    });

    it("should emit LiquidityAdded event", async function () {
      const { weth, shareToken, dex } = await deploy();
      await weth.write.deposit([], { value: parseEther("10") });
      await shareToken.write.approve([dex.address, parseEther("1000")]);
      await weth.write.approve([dex.address, parseEther("10")]);
      await viem.assertions.emit(
        dex.write.addLiquidity([parseEther("1000"), parseEther("10")]),
        dex,
        "LiquidityAdded",
      );
    });

    it("should revert for non-authorized user", async function () {
      const { weth, shareToken, dex } = await deploy();
      const dexAsAddr1 = await viem.getContractAt("SimpleDEX", dex.address, {
        client: { wallet: addr1 },
      });
      await viem.assertions.revertWithCustomError(
        dexAsAddr1.write.addLiquidity([parseEther("100"), parseEther("1")]),
        dex,
        "NotAuthorized",
      );
    });

    it("should revert with zero amounts", async function () {
      const { dex } = await deploy();
      await viem.assertions.revertWithCustomError(
        dex.write.addLiquidity([0n, parseEther("1")]),
        dex,
        "ZeroAmount",
      );
    });
  });

  describe("Swap", async function () {
    it("should swap tokenA for tokenB", async function () {
      const { weth, shareToken, dex } = await deployWithLiquidity();

      // Give addr1 some share tokens
      await shareToken.write.transfer([
        addr1.account.address,
        parseEther("100"),
      ]);

      // addr1 approves DEX and swaps shares for WETH
      const shareAsAddr1 = await viem.getContractAt(
        "WatchShareToken",
        shareToken.address,
        { client: { wallet: addr1 } },
      );
      await shareAsAddr1.write.approve([dex.address, parseEther("100")]);

      const dexAsAddr1 = await viem.getContractAt("SimpleDEX", dex.address, {
        client: { wallet: addr1 },
      });

      const wethBefore = await weth.read.balanceOf([addr1.account.address]);
      await dexAsAddr1.write.swap([shareToken.address, parseEther("100"), 0n]);
      const wethAfter = await weth.read.balanceOf([addr1.account.address]);

      assert.ok(wethAfter > wethBefore);
    });

    it("should swap tokenB for tokenA", async function () {
      const { weth, shareToken, dex } = await deployWithLiquidity();

      // Give addr1 some WETH
      const wethAsAddr1 = await viem.getContractAt("WETH", weth.address, {
        client: { wallet: addr1 },
      });
      await wethAsAddr1.write.deposit([], { value: parseEther("1") });
      await wethAsAddr1.write.approve([dex.address, parseEther("1")]);

      const dexAsAddr1 = await viem.getContractAt("SimpleDEX", dex.address, {
        client: { wallet: addr1 },
      });

      const sharesBefore = await shareToken.read.balanceOf([
        addr1.account.address,
      ]);
      await dexAsAddr1.write.swap([weth.address, parseEther("1"), 0n]);
      const sharesAfter = await shareToken.read.balanceOf([
        addr1.account.address,
      ]);

      assert.ok(sharesAfter > sharesBefore);
    });

    it("should emit Swap event", async function () {
      const { weth, shareToken, dex } = await deployWithLiquidity();
      await shareToken.write.transfer([
        addr1.account.address,
        parseEther("100"),
      ]);
      const shareAsAddr1 = await viem.getContractAt(
        "WatchShareToken",
        shareToken.address,
        { client: { wallet: addr1 } },
      );
      await shareAsAddr1.write.approve([dex.address, parseEther("100")]);
      const dexAsAddr1 = await viem.getContractAt("SimpleDEX", dex.address, {
        client: { wallet: addr1 },
      });
      await viem.assertions.emit(
        dexAsAddr1.write.swap([shareToken.address, parseEther("100"), 0n]),
        dex,
        "Swap",
      );
    });

    it("should revert for non-authorized user", async function () {
      const { shareToken, dex } = await deployWithLiquidity();
      const dexAsAddr2 = await viem.getContractAt("SimpleDEX", dex.address, {
        client: { wallet: addr2 },
      });
      // addr2 is whitelisted but let's test with a fresh non-whitelisted
      // Actually addr2 IS whitelisted in deployWithLiquidity, let's create a new deploy
      const { dex: dex2, shareToken: shareToken2 } = await deploy();
      const weth2 = await viem.deployContract("WETH", []);
      const dex2AsAddr1 = await viem.getContractAt("SimpleDEX", dex2.address, {
        client: { wallet: addr1 },
      });
      await viem.assertions.revertWithCustomError(
        dex2AsAddr1.write.swap([shareToken2.address, parseEther("1"), 0n]),
        dex2,
        "NotAuthorized",
      );
    });

    it("should revert for invalid token address", async function () {
      const { dex } = await deployWithLiquidity();
      await viem.assertions.revertWithCustomError(
        dex.write.swap([owner.account.address, parseEther("1"), 0n]),
        dex,
        "InvalidToken",
      );
    });

    it("should revert when slippage exceeded", async function () {
      const { shareToken, dex } = await deployWithLiquidity();
      await shareToken.write.approve([dex.address, parseEther("100")]);
      await viem.assertions.revertWithCustomError(
        dex.write.swap([
          shareToken.address,
          parseEther("100"),
          parseEther("999"),
        ]),
        dex,
        "SlippageExceeded",
      );
    });
  });

  describe("Remove Liquidity", async function () {
    it("should remove liquidity and return tokens", async function () {
      const { weth, shareToken, dex } = await deployWithLiquidity();
      const lpBalance = await dex.read.balanceOf([owner.account.address]);

      // Remove half
      const half = lpBalance / 2n;
      const shareBefore = await shareToken.read.balanceOf([
        owner.account.address,
      ]);
      const wethBefore = await weth.read.balanceOf([owner.account.address]);

      await dex.write.removeLiquidity([half]);

      const shareAfter = await shareToken.read.balanceOf([
        owner.account.address,
      ]);
      const wethAfter = await weth.read.balanceOf([owner.account.address]);

      assert.ok(shareAfter > shareBefore);
      assert.ok(wethAfter > wethBefore);
    });

    it("should emit LiquidityRemoved event", async function () {
      const { dex } = await deployWithLiquidity();
      const lpBalance = await dex.read.balanceOf([owner.account.address]);
      await viem.assertions.emit(
        dex.write.removeLiquidity([lpBalance / 2n]),
        dex,
        "LiquidityRemoved",
      );
    });
  });

  describe("Get Amount Out", async function () {
    it("should return expected output amount", async function () {
      const { shareToken, dex } = await deployWithLiquidity();
      const amountOut = await dex.read.getAmountOut([
        shareToken.address,
        parseEther("100"),
      ]);
      assert.ok(amountOut > 0n);
      // With 0.3% fee, swapping 100 shares with 5000/50 reserves
      // should give less than 1 WETH
      assert.ok(amountOut < parseEther("1"));
    });
  });
});
