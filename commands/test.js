const shell = require("shelljs");
const chalk = require("chalk");

function testContracts() {
  console.log(chalk.blue("\n🛠 Running smart contract tests...\n"));

  if (shell.test("-f", "hardhat.config.js")) {
    console.log(chalk.yellow("\n🔍 Testing Solidity (Hardhat)..."));
    shell.exec("npx hardhat test");
  } else if (shell.test("-f", "foundry.toml")) {
    console.log(chalk.yellow("\n🔍 Testing Solidity (Foundry)..."));
    shell.exec("forge test");
  } else if (shell.test("-f", "Cargo.toml")) {
    console.log(chalk.yellow("\n🔍 Testing Rust (WASM)..."));

    // Ensure contract is compiled before testing
    if (!shell.test("-d", "target/wasm32-unknown-unknown/release")) {
      console.log(
        chalk.red(
          "\n❌ Rust contract not compiled. Run `configure-pharos compile` first.\n"
        )
      );
      process.exit(1);
    }

    shell.exec("cargo test --all");
  } else {
    console.log(chalk.red("\n⚠️ No supported contract framework found!\n"));
    process.exit(1);
  }

  console.log(chalk.green("\n✅ All tests executed!\n"));
}

module.exports = { testContracts };
