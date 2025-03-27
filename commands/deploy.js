const fs = require("fs");
const path = require("path");
const readline = require("readline");
const chalk = require("chalk");
const shell = require("shelljs");
const { spawn } = require("child_process");

// Timeout configuration (30 minutes)
const DEPLOYMENT_TIMEOUT = 30 * 60 * 1000;

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

async function checkHardhatInstallation(cwd) {
  try {
    const result = shell.exec("npx hardhat --version", { silent: true, cwd });
    if (result.code !== 0) {
      console.log(
        chalk.red("\n❌ Hardhat is not installed in this project.\n")
      );
      console.log(
        chalk.yellow("Please install it with: npm install --save-dev hardhat\n")
      );
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
}

async function checkNetworkAvailability() {
  try {
    console.log(chalk.blue("\n🌐 Checking network availability..."));
    const result = shell.exec(
      `curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"net_version","params":[],"id":1}' https://devnet.dplabs-internal.com/`,
      { silent: true }
    );
    if (result.code !== 0) {
      throw new Error("Network unreachable");
    }
    const response = JSON.parse(result.stdout);
    if (response.error) {
      throw new Error(response.error.message);
    }
    console.log(chalk.green("✅ Network is available"));
    return true;
  } catch (error) {
    console.log(chalk.red(`\n❌ Network error: ${error.message}\n`));
    return false;
  }
}

async function deployHardhat(scriptPath, deploymentId) {
  return new Promise((resolve, reject) => {
    console.log(chalk.blue(`\n⚙️ Starting deployment...`));

    const args = [
      "hardhat",
      "ignition",
      "deploy",
      scriptPath,
      "--network",
      "pharos",
      "--deployment-id",
      deploymentId,
    ];

    const contractDir = path.join(process.cwd(), "smart-contract");
    const cwd = fs.existsSync(contractDir) ? contractDir : process.cwd();

    // Add deployment timeout
    const timeout = setTimeout(() => {
      console.log(chalk.red("\n❌ Deployment timed out after 30 minutes"));
      reject(new Error("Deployment timeout"));
    }, DEPLOYMENT_TIMEOUT);

    const deployProcess = spawn("npx", args, {
      stdio: "inherit",
      cwd: cwd,
    });

    // Simple progress indicator
    const progressInterval = setInterval(() => {
      process.stdout.write(".");
    }, 1000);

    deployProcess.on("error", (err) => {
      clearTimeout(timeout);
      clearInterval(progressInterval);
      console.log(chalk.red(`\n❌ Deployment error: ${err.message}\n`));
      reject(err);
    });

    deployProcess.on("close", (code) => {
      clearTimeout(timeout);
      clearInterval(progressInterval);
      process.stdout.write("\n");
      if (code !== 0) {
        reject(new Error(`Deployment failed with code ${code}`));
      } else {
        resolve();
      }
    });
  });
}

async function deployContract() {
  try {
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

        // Verify Hardhat installation
        const contractDir = path.join(process.cwd(), "smart-contract");
        const cwd = fs.existsSync(contractDir) ? contractDir : process.cwd();
        if (!(await checkHardhatInstallation(cwd))) {
          process.exit(1);
        }

        // Verify network availability
        if (!(await checkNetworkAvailability())) {
          process.exit(1);
        }

        // Get deployment script path
        const defaultScriptPath = "ignition/modules/Contract.ts";
        const scriptPath =
          (await getUserInput(
            chalk.yellow(
              `\n📜 Enter path to deployment script [${defaultScriptPath}]: `
            )
          )) || defaultScriptPath;

        if (!fs.existsSync(path.join(cwd, scriptPath))) {
          console.log(
            chalk.red(`\n❌ Deployment script not found at: ${scriptPath}\n`)
          );
          process.exit(1);
        }

        // Get deployment ID
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

        // Execute deployment
        try {
          await deployHardhat(scriptPath, deploymentId);
          console.log(chalk.green("\n✅ Contract deployed successfully!\n"));
        } catch (error) {
          console.log(chalk.red(`\n❌ Deployment failed: ${error.message}\n`));
          process.exit(1);
        }
      } else if (config.framework === "Foundry") {
        const privateKey = await getUserInput(
          chalk.yellow("\n🔑 Enter your private key: "),
          true
        );

        // Get contract file path
        const contractPath = await getUserInput(
          chalk.yellow(
            "\n📜 Enter path to contract file (e.g., src/Counter.sol): "
          ),
          true
        );

        // Extract contract name from file (defaults to filename without extension)
        let contractName = path.basename(contractPath, ".sol");

        // Allow override of contract name
        contractName =
          (await getUserInput(
            chalk.yellow(`\n📜 Enter contract name [${contractName}]: `)
          )) || contractName;

        // Format the contract identifier correctly
        const contractIdentifier = `${contractPath}:${contractName}`;

        let command = `forge create --private-key ${privateKey} ${contractIdentifier} --rpc-url https://devnet.dplabs-internal.com/`;

        const constructorArgs = await getUserInput(
          chalk.yellow(
            "\n📜 Enter constructor arguments (space-separated, or press Enter to skip): "
          )
        );

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
        console.log(
          chalk.red("\n❌ Deployment failed! See above for errors.\n")
        );
        process.exit(1);
      }

      console.log(
        chalk.green("\n✅ Rust WASM contract deployed successfully!\n")
      );
    } else {
      console.log(chalk.red("\n❌ Error: Unsupported contract type.\n"));
      process.exit(1);
    }
  } catch (error) {
    console.log(chalk.red(`\n❌ Unexpected error: ${error.message}\n`));
    process.exit(1);
  }
}

module.exports = { deployContract };
