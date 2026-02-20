import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { parseEther } from "viem";

describe("WatchPriceOracle", async function () {
  const { viem } = await network.connect();
  const [owner, addr1] = await viem.getWalletClients();

  async function deploy() {
    return viem.deployContract("WatchPriceOracle", [owner.account.address]);
  }

  describe("Deployment", async function () {
    it("should set the correct owner", async function () {
      const oracle = await deploy();
      assert.equal(
        (await oracle.read.owner()).toLowerCase(),
        owner.account.address.toLowerCase(),
      );
    });
  });

  describe("Set Price", async function () {
    it("should set a price for a token", async function () {
      const oracle = await deploy();
      await oracle.write.setPrice([0n, parseEther("10")]);
      const [price, updatedAt] = await oracle.read.getPrice([0n]);
      assert.equal(price, parseEther("10"));
      assert.ok(updatedAt > 0n);
    });

    it("should emit PriceUpdated event", async function () {
      const oracle = await deploy();
      await viem.assertions.emit(
        oracle.write.setPrice([0n, parseEther("10")]),
        oracle,
        "PriceUpdated",
      );
    });

    it("should revert on zero price", async function () {
      const oracle = await deploy();
      await viem.assertions.revertWithCustomError(
        oracle.write.setPrice([0n, 0n]),
        oracle,
        "ZeroPrice",
      );
    });

    it("should revert when non-owner tries to set price", async function () {
      const oracle = await deploy();
      const oracleAsAddr1 = await viem.getContractAt(
        "WatchPriceOracle",
        oracle.address,
        { client: { wallet: addr1 } },
      );
      await viem.assertions.revertWithCustomError(
        oracleAsAddr1.write.setPrice([0n, parseEther("10")]),
        oracle,
        "OwnableUnauthorizedAccount",
      );
    });

    it("should update an existing price", async function () {
      const oracle = await deploy();
      await oracle.write.setPrice([0n, parseEther("10")]);
      await oracle.write.setPrice([0n, parseEther("15")]);
      const [price] = await oracle.read.getPrice([0n]);
      assert.equal(price, parseEther("15"));
    });
  });

  describe("Batch Set Prices", async function () {
    it("should set multiple prices at once", async function () {
      const oracle = await deploy();
      await oracle.write.batchSetPrices([
        [0n, 1n, 2n],
        [parseEther("10"), parseEther("20"), parseEther("30")],
      ]);
      const [price0] = await oracle.read.getPrice([0n]);
      const [price1] = await oracle.read.getPrice([1n]);
      const [price2] = await oracle.read.getPrice([2n]);
      assert.equal(price0, parseEther("10"));
      assert.equal(price1, parseEther("20"));
      assert.equal(price2, parseEther("30"));
    });

    it("should revert batch with zero price", async function () {
      const oracle = await deploy();
      await viem.assertions.revertWithCustomError(
        oracle.write.batchSetPrices([[0n, 1n], [parseEther("10"), 0n]]),
        oracle,
        "ZeroPrice",
      );
    });
  });

  describe("Get Price", async function () {
    it("should revert for unset price", async function () {
      const oracle = await deploy();
      await viem.assertions.revertWithCustomError(
        oracle.read.getPrice([99n]),
        oracle,
        "PriceNotSet",
      );
    });
  });
});
