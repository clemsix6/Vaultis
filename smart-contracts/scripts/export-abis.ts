import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ARTIFACTS_DIR = join(ROOT, "artifacts", "contracts");
const OUTPUT_DIR = process.env.ABI_OUTPUT_DIR ?? join(ROOT, "..", "frontend", "src", "contracts");

const CONTRACTS = ["KYCRegistry", "WatchNFT"] as const;

function extractABI(contractName: string): unknown[] {
  const contractDir = join(ARTIFACTS_DIR, `${contractName}.sol`);
  const files = readdirSync(contractDir);
  const artifactFile = files.find(
    (f) => f === `${contractName}.json` && !f.includes(".dbg.")
  );
  if (!artifactFile) {
    throw new Error(`Artifact not found for ${contractName}`);
  }
  const artifact = JSON.parse(
    readFileSync(join(contractDir, artifactFile), "utf-8")
  );
  return artifact.abi;
}

function writeABIFile(contractName: string, abi: unknown[]) {
  const content = `export const ${contractName}ABI = ${JSON.stringify(abi, null, 2)} as const;\n`;
  writeFileSync(join(OUTPUT_DIR, `${contractName}ABI.ts`), content);
  console.log(`✓ ${contractName}ABI.ts`);
}

function writeBarrel() {
  const exports = CONTRACTS.map(
    (name) => `export { ${name}ABI } from "./${name}ABI";`
  ).join("\n");
  writeFileSync(join(OUTPUT_DIR, "index.ts"), exports + "\n");
  console.log("✓ index.ts (barrel)");
}

function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Exporting ABIs to ${OUTPUT_DIR}\n`);

  for (const contractName of CONTRACTS) {
    const abi = extractABI(contractName);
    writeABIFile(contractName, abi);
  }

  writeBarrel();
  console.log("\nDone!");
}

main();
