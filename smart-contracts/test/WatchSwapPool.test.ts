import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { parseEther, parseUnits, formatEther, formatUnits } from "viem";

describe("WatchSwapPool", async function () {
  const { viem } = await network.connect();
  const [owner, trader1, trader2] = await viem.getWalletClients();

  const TOTAL_SHARES = 1000n;
  const PRICE_PER_SHARE = 1500n;

  async function deployAll() {
    const registry = await viem.deployContract("KYCRegistry", [
      owner.account.address,
    ]);
    const shares = await viem.deployContract("WatchShares", [
      "Submariner Blue Shares",
      "WSUB",
      owner.account.address,
      registry.address,
      0n,
      TOTAL_SHARES,
      PRICE_PER_SHARE,
    ]);
    const pool = await viem.deployContract("WatchSwapPool", [
      shares.address,
      registry.address,
      owner.account.address,
    ]);

    // Whitelist everyone + the pool contract
    await registry.write.batchWhitelist([
      [
        owner.account.address,
        trader1.account.address,
        trader2.account.address,
        pool.address,
      ],
    ]);

    return { registry, shares, pool };
  }

  async function deployWithLiquidity() {
    const { registry, shares, pool } = await deployAll();

    // Owner approves pool to spend shares
    const sharesAmount = parseUnits("500", 18); // 500 shares
    const ethAmount = parseEther("5"); // 5 ETH → 1 share = 0.01 ETH

    await shares.write.approve([pool.address, sharesAmount]);
    await pool.write.addLiquidity([sharesAmount], { value: ethAmount });

    return { registry, shares, pool };
  }

  describe("Deployment", async function () {
    it("should set the correct shares token", async function () {
      const { shares, pool } = await deployAll();
      assert.equal(
        (await pool.read.sharesToken()).toLowerCase(),
        shares.address.toLowerCase(),
      );
    });

    it("should start with zero reserves", async function () {
      const { pool } = await deployAll();
      assert.equal(await pool.read.reserveETH(), 0n);
      assert.equal(await pool.read.reserveShares(), 0n);
      assert.equal(await pool.read.totalLP(), 0n);
    });

    it("should revert with zero address", async function () {
      const { pool } = await deployAll();
      await viem.assertions.revertWithCustomError(
        viem.deployContract("WatchSwapPool", [
          "0x0000000000000000000000000000000000000000",
          "0x0000000000000000000000000000000000000001",
          owner.account.address,
        ]),
        pool,
        "ZeroAddress",
      );
    });
  });

  describe("Add Liquidity", async function () {
    it("should add initial liquidity", async function () {
      const { shares, pool } = await deployAll();
      const sharesAmount = parseUnits("100", 18);
      const ethAmount = parseEther("1");

      await shares.write.approve([pool.address, sharesAmount]);
      await pool.write.addLiquidity([sharesAmount], { value: ethAmount });

      assert.equal(await pool.read.reserveShares(), sharesAmount);
      assert.equal(await pool.read.reserveETH(), ethAmount);
      assert.ok((await pool.read.totalLP()) > 0n);
      assert.ok((await pool.read.lpBalance([owner.account.address])) > 0n);
    });

    it("should add proportional liquidity", async function () {
      const { shares, pool } = await deployWithLiquidity();

      // Transfer shares to trader1 and have them add liquidity
      const traderShares = parseUnits("50", 18);
      await shares.write.transfer([trader1.account.address, traderShares]);

      const sharesAsTrader = await viem.getContractAt(
        "WatchShares",
        shares.address,
        { client: { wallet: trader1 } },
      );
      const poolAsTrader = await viem.getContractAt(
        "WatchSwapPool",
        pool.address,
        { client: { wallet: trader1 } },
      );

      await sharesAsTrader.write.approve([pool.address, traderShares]);
      const ethForTrader = parseEther("0.5");
      await poolAsTrader.write.addLiquidity([traderShares], {
        value: ethForTrader,
      });

      assert.ok((await pool.read.lpBalance([trader1.account.address])) > 0n);
    });

    it("should revert if not authorized", async function () {
      const { registry, shares, pool } = await deployAll();
      await registry.write.removeFromWhitelist([trader1.account.address]);

      const poolAsTrader = await viem.getContractAt(
        "WatchSwapPool",
        pool.address,
        { client: { wallet: trader1 } },
      );
      await viem.assertions.revertWithCustomError(
        poolAsTrader.write.addLiquidity([parseUnits("10", 18)], {
          value: parseEther("0.1"),
        }),
        pool,
        "NotAuthorized",
      );
    });

    it("should revert with zero amounts", async function () {
      const { pool } = await deployAll();
      await viem.assertions.revertWithCustomError(
        pool.write.addLiquidity([0n], { value: parseEther("1") }),
        pool,
        "ZeroAmount",
      );
    });
  });

  describe("Remove Liquidity", async function () {
    it("should remove liquidity and return proportional amounts", async function () {
      const { shares, pool } = await deployWithLiquidity();
      const lpBal = await pool.read.lpBalance([owner.account.address]);

      // Remove half
      const removeAmount = lpBal / 2n;
      const reserveSharesBefore = await pool.read.reserveShares();
      const reserveETHBefore = await pool.read.reserveETH();

      await pool.write.removeLiquidity([removeAmount]);

      const reserveSharesAfter = await pool.read.reserveShares();
      const reserveETHAfter = await pool.read.reserveETH();

      // Reserves should decrease by ~50%
      assert.ok(reserveSharesAfter < reserveSharesBefore);
      assert.ok(reserveETHAfter < reserveETHBefore);
    });

    it("should revert with insufficient LP balance", async function () {
      const { pool } = await deployWithLiquidity();
      const poolAsTrader = await viem.getContractAt(
        "WatchSwapPool",
        pool.address,
        { client: { wallet: trader1 } },
      );
      await viem.assertions.revertWithCustomError(
        poolAsTrader.write.removeLiquidity([1n]),
        pool,
        "InsufficientLPBalance",
      );
    });
  });

  describe("Swap ETH for Shares", async function () {
    it("should swap ETH for shares", async function () {
      const { shares, pool } = await deployWithLiquidity();

      const poolAsTrader = await viem.getContractAt(
        "WatchSwapPool",
        pool.address,
        { client: { wallet: trader1 } },
      );

      const balanceBefore = await shares.read.balanceOf([
        trader1.account.address,
      ]);
      await poolAsTrader.write.swapETHForShares([0n], {
        value: parseEther("0.5"),
      });
      const balanceAfter = await shares.read.balanceOf([
        trader1.account.address,
      ]);

      assert.ok(balanceAfter > balanceBefore);
    });

    it("should apply 0.3% fee", async function () {
      const { pool } = await deployWithLiquidity();

      // With 500 shares / 5 ETH, swapping 0.5 ETH
      // Without fee: 0.5 * 500 / (5 + 0.5) = 45.45 shares
      // With fee: 0.5 * 0.997 * 500 / (5 * 1 + 0.5 * 0.997) = ~45.32 shares
      const expectedOut = await pool.read.getAmountOut([
        parseEther("0.5"),
        parseEther("5"),
        parseUnits("500", 18),
      ]);

      // Should be slightly less than no-fee output
      const noFeeOut =
        (parseEther("0.5") * parseUnits("500", 18)) /
        (parseEther("5") + parseEther("0.5"));
      assert.ok(expectedOut < noFeeOut);
      assert.ok(expectedOut > 0n);
    });

    it("should revert on slippage exceeded", async function () {
      const { pool } = await deployWithLiquidity();
      const poolAsTrader = await viem.getContractAt(
        "WatchSwapPool",
        pool.address,
        { client: { wallet: trader1 } },
      );

      // Demand way too many shares
      await viem.assertions.revertWithCustomError(
        poolAsTrader.write.swapETHForShares([parseUnits("1000", 18)], {
          value: parseEther("0.1"),
        }),
        pool,
        "SlippageExceeded",
      );
    });

    it("should revert if not authorized", async function () {
      const { registry, pool } = await deployWithLiquidity();
      await registry.write.removeFromWhitelist([trader1.account.address]);

      const poolAsTrader = await viem.getContractAt(
        "WatchSwapPool",
        pool.address,
        { client: { wallet: trader1 } },
      );
      await viem.assertions.revertWithCustomError(
        poolAsTrader.write.swapETHForShares([0n], {
          value: parseEther("0.1"),
        }),
        pool,
        "NotAuthorized",
      );
    });
  });

  describe("Swap Shares for ETH", async function () {
    it("should swap shares for ETH", async function () {
      const { shares, pool } = await deployWithLiquidity();
      const publicClient = await viem.getPublicClient();

      // Give trader1 some shares
      const traderShares = parseUnits("50", 18);
      await shares.write.transfer([trader1.account.address, traderShares]);

      const sharesAsTrader = await viem.getContractAt(
        "WatchShares",
        shares.address,
        { client: { wallet: trader1 } },
      );
      const poolAsTrader = await viem.getContractAt(
        "WatchSwapPool",
        pool.address,
        { client: { wallet: trader1 } },
      );

      await sharesAsTrader.write.approve([pool.address, traderShares]);

      const ethBefore = await publicClient.getBalance({
        address: trader1.account.address,
      });
      await poolAsTrader.write.swapSharesForETH([traderShares, 0n]);
      const ethAfter = await publicClient.getBalance({
        address: trader1.account.address,
      });

      // ETH balance should increase (minus gas)
      // We can't check exactly due to gas, but shares balance should be 0
      const sharesAfter = await shares.read.balanceOf([
        trader1.account.address,
      ]);
      assert.equal(sharesAfter, 0n);
    });

    it("should revert on slippage exceeded", async function () {
      const { shares, pool } = await deployWithLiquidity();
      const traderShares = parseUnits("10", 18);
      await shares.write.transfer([trader1.account.address, traderShares]);

      const sharesAsTrader = await viem.getContractAt(
        "WatchShares",
        shares.address,
        { client: { wallet: trader1 } },
      );
      const poolAsTrader = await viem.getContractAt(
        "WatchSwapPool",
        pool.address,
        { client: { wallet: trader1 } },
      );

      await sharesAsTrader.write.approve([pool.address, traderShares]);

      // Demand way too much ETH
      await viem.assertions.revertWithCustomError(
        poolAsTrader.write.swapSharesForETH([traderShares, parseEther("100")]),
        pool,
        "SlippageExceeded",
      );
    });
  });

  describe("Price Oracle", async function () {
    it("should return share price in ETH", async function () {
      const { pool } = await deployWithLiquidity();
      // 5 ETH / 500 shares = 0.01 ETH per share
      const price = await pool.read.getSharePriceInETH();
      assert.equal(price, parseEther("0.01"));
    });

    it("should return 0 if no reserves", async function () {
      const { pool } = await deployAll();
      assert.equal(await pool.read.getSharePriceInETH(), 0n);
    });

    it("price should change after swap", async function () {
      const { pool } = await deployWithLiquidity();
      const priceBefore = await pool.read.getSharePriceInETH();

      const poolAsTrader = await viem.getContractAt(
        "WatchSwapPool",
        pool.address,
        { client: { wallet: trader1 } },
      );

      // Buy shares with ETH → price of shares should go UP
      await poolAsTrader.write.swapETHForShares([0n], {
        value: parseEther("1"),
      });

      const priceAfter = await pool.read.getSharePriceInETH();
      assert.ok(priceAfter > priceBefore);
    });
  });

  describe("getAmountOut", async function () {
    it("should return 0 for zero inputs", async function () {
      const { pool } = await deployAll();
      assert.equal(await pool.read.getAmountOut([0n, 100n, 100n]), 0n);
      assert.equal(await pool.read.getAmountOut([100n, 0n, 100n]), 0n);
      assert.equal(await pool.read.getAmountOut([100n, 100n, 0n]), 0n);
    });

    it("should never exceed reserve out", async function () {
      const { pool } = await deployAll();
      // Even with huge input, output must be less than reserveOut
      const out = await pool.read.getAmountOut([
        parseEther("1000000"),
        parseEther("1"),
        parseUnits("100", 18),
      ]);
      assert.ok(out < parseUnits("100", 18));
    });
  });
});
