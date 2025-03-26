const fs = require("fs");
const path = require("path");
const readline = require("readline");
const chalk = require("chalk");
const shell = require("shelljs");

async function getUserInput(question, required = false) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      if (required && !answer.trim()) {
        console.log(chalk.red("\n❌ This field is required!\n"));
        process.exit(1);
      }
      resolve(answer.trim());
    });
  });
}

async function deployContract() {
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
      `\n🚀 Deploying ${config.contractType} contract${
        config.framework ? ` using ${config.framework}` : ""
      }...\n`
    )
  );

  if (config.contractType === "Solidity (EVM)") {
    const privateKey = await getUserInput(
      chalk.yellow("\n🔑 Enter your private key: "),
      true
    );

    let constructorArgs = await getUserInput(
      chalk.yellow(
        "\n📜 Enter constructor arguments (space-separated, or press Enter to skip): "
      )
    );

    if (config.framework === "Hardhat") {
      shell.exec("npx hardhat ignition deploy --network pharos");
    } else if (config.framework === "Foundry") {
      let command = `forge create --private-key ${privateKey} src/contract.sol`;
      if (constructorArgs) {
        command += ` --constructor-args ${constructorArgs}`;
      }
      shell.exec(command);
    }
  } else if (config.contractType === "Rust (WASM)") {
    console.log(chalk.blue("\n📡 Deploying Rust WASM contract...\n"));

    if (!fs.existsSync("target/wasm32-unknown-unknown/release")) {
      console.log(
        chalk.red(
          "\n❌ Rust contract not compiled. Run `configure-pharos compile` first.\n"
        )
      );
      process.exit(1);
    }

    shell.exec("cargo contract deploy");
    console.log(
      chalk.green("\n✅ Rust WASM contract deployed successfully!\n")
    );
  } else {
    console.log(chalk.red("\n❌ Error: Unsupported contract type.\n"));
    process.exit(1);
  }
}

module.exports = { deployContract };
