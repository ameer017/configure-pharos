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
    if (config.framework === "Hardhat") {
      console.log(chalk.blue("\nInitializing Hardhat deployment\n"));

      // Get deployment script path from user
      const defaultScriptPath = "ignition/modules/Contract.ts";
      const scriptPath =
        (await getUserInput(
          chalk.yellow(
            `\n📜 Enter path to deployment script [${defaultScriptPath}]: `
          )
        )) || defaultScriptPath;

      // Verify script exists
      if (!fs.existsSync(scriptPath)) {
        console.log(
          chalk.red(`\n❌ Deployment script not found at: ${scriptPath}\n`)
        );
        process.exit(1);
      }

      // Get deployment ID from user
      const deploymentId =
        (await getUserInput(
          chalk.yellow("\n🆔 Enter deployment ID [pharos-deployment]: ")
        )) || "pharos-deployment";

      // Get confirmation
      const confirm = await getUserInput(
        chalk.yellow("\n⚠️ Confirm deploy to network pharos (50002)? [y/N]: ")
      );

      if (confirm.toLowerCase() !== "y") {
        console.log(chalk.yellow("\n🚫 Deployment cancelled by user\n"));
        process.exit(0);
      }

      console.log(chalk.blue("\n🔧 Starting deployment...\n"));

      // Execute deployment
      const command = `npx hardhat ignition deploy ${scriptPath} --network pharos --deployment-id ${deploymentId}`;
      console.log(chalk.blue(`\n⚙️ Running: ${command}\n`));
      const result = shell.exec(command);

      if (result.code !== 0) {
        console.log(
          chalk.red("\n❌ Deployment failed! See above for errors.\n")
        );
        process.exit(1);
      }
    } else if (config.framework === "Foundry") {
      const privateKey = await getUserInput(
        chalk.yellow("\n🔑 Enter your private key: "),
        true
      );

      const contractPath = await getUserInput(
        chalk.yellow("\n📜 Enter path to contract (e.g., src/Contract.sol): "),
        true
      );

      const constructorArgs = await getUserInput(
        chalk.yellow(
          "\n📜 Enter constructor arguments (space-separated, or press Enter to skip): "
        )
      );

      let command = `forge create --private-key ${privateKey} ${contractPath} --rpc-url https://devnet.dplabs-internal.com/`;
      if (constructorArgs) {
        command += ` --constructor-args ${constructorArgs}`;
      }

      console.log(chalk.blue(`\n⚙️ Running: ${command}\n`));
      const result = shell.exec(command);

      if (result.code !== 0) {
        console.log(
          chalk.red("\n❌ Deployment failed! See above for errors.\n")
        );
        process.exit(1);
      }
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

    const result = shell.exec("cargo contract deploy");
    if (result.code !== 0) {
      console.log(chalk.red("\n❌ Deployment failed! See above for errors.\n"));
      process.exit(1);
    }

    console.log(
      chalk.green("\n✅ Rust WASM contract deployed successfully!\n")
    );
  } else {
    console.log(chalk.red("\n❌ Error: Unsupported contract type.\n"));
    process.exit(1);
  }
}

module.exports = { deployContract };
