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

    shell.exec("cargo build --release --target wasm32-unknown-unknown");

    console.log(
      chalk.green(
        "\n✅ Rust WASM compilation complete! Your .wasm file is in the `target/wasm32-unknown-unknown/release/` directory.\n"
      )
    );
  } else {
    console.log(chalk.red("\n❌ Error: Unsupported contract type.\n"));
    process.exit(1);
  }
}

module.exports = { compileContracts };
