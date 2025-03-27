const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const shell = require("shelljs");

async function compileContracts() {
  const configPath = path.join(process.cwd(), "pharos-config.json");

  if (!fs.existsSync(configPath)) {
    console.log(
      chalk.red(
        "\n❌ No Pharos project found. Run `configure-pharos init` first.\n"
      )
    );
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

  console.log(
    chalk.blue(
      `\n⚙️  Compiling ${config.contractType} contract${
        config.framework ? ` using ${config.framework}` : ""
      }...\n`
    )
  );

  if (config.contractType === "Solidity (EVM)") {
    if (config.framework === "Hardhat") {
      shell.exec("npx hardhat compile");
    } else if (config.framework === "Foundry") {
      shell.exec("forge build");
    }
  } else if (config.contractType === "Rust (WASM)") {
    console.log(chalk.blue("\n🔨 Building Rust WASM contract...\n"));

    // Install cargo-contract if not exists
    if (!shell.which("cargo-contract")) {
      console.log(chalk.blue("Installing cargo-contract..."));
      const { code } = shell.exec("cargo install cargo-contract --force");
      if (code !== 0) throw new Error("Failed to install cargo-contract");
    }

    // Build the contract
    const { code: buildCode } = shell.exec("cargo contract build");
    if (buildCode !== 0) throw new Error("Rust compilation failed");

    console.log(chalk.green("\n✅ Rust WASM compilation complete!"));
    console.log(chalk.blue("Your .wasm file is in the target/ink/ directory"));
  } else {
    console.log(chalk.red("\n❌ Error: Unsupported contract type.\n"));
    process.exit(1);
  }
}

module.exports = { compileContracts };
