const { prompt } = require("enquirer");
const chalk = require("chalk");
const shell = require("shelljs");
const path = require("path");
const fs = require("fs");
const { promisify } = require("util");
const exec = promisify(require("child_process").exec);

async function initProject() {
  try {
    console.log(
      chalk.blue("\n🛠 Initializing a new smart contract project...\n")
    );

    const answers = {};

    const contractResponse = await prompt({
      type: "select",
      name: "contractType",
      message: "Choose a contract type:",
      choices: ["Solidity (EVM)", "Rust (WASM)"],
    });
    answers.contractType = contractResponse.contractType;

    if (answers.contractType === "Solidity (EVM)") {
      const frameworkResponse = await prompt({
        type: "select",
        name: "framework",
        message: "Select a development framework:",
        choices: ["Hardhat", "Foundry"],
      });
      answers.framework = frameworkResponse.framework;
    }

    console.log(
      chalk.blue(
        `\n📁 Setting up ${answers.contractType} project${
          answers.framework ? ` with ${answers.framework}` : ""
        }...\n`
      )
    );

    // Create project directory
    const projectDir = path.join(process.cwd(), "smart-contract");
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }

    if (answers.contractType === "Solidity (EVM)") {
      await checkPrerequisites(answers.framework);
    }

    // Setup project
    if (answers.contractType === "Solidity (EVM)") {
      await setupSolidity(answers.framework, projectDir, answers);
    } else if (answers.contractType === "Rust (WASM)") {
      await setupRust(projectDir);
    }

    // Write config file
    const configPath = path.join(process.cwd(), "pharos-config.json");
    fs.writeFileSync(configPath, JSON.stringify(answers, null, 2));
    console.log(chalk.green("\n✅ Configuration saved to pharos-config.json"));

    console.log(
      chalk.green(
        `\n✅ Project initialized! Run the following commands 👇🏽\n\n` +
          chalk.blue("cd smart-contract\n") +
          chalk.blue("configure-pharos-sdk compile\n\n") +
          "to compile your contract."
      )
    );
  } catch (error) {
    console.error(chalk.red(`\n❌ Error: ${error.message}`));
    process.exit(1);
  }
}

async function checkPrerequisites(framework) {
  const checks = {
    Hardhat: async () => {
      if (!shell.which("node") || !shell.which("npm")) {
        throw new Error("Node.js and npm are required for Hardhat");
      }
    },
    Foundry: async () => {
      if (!shell.which("cargo")) {
        throw new Error(
          "Rust toolchain required for Foundry. Install from https://rustup.rs/"
        );
      }
      try {
        await exec("forge --version");
      } catch {
        throw new Error(`Foundry not installed. Install with:
          For Linux/Mac:
          curl -L https://foundry.paradigm.xyz | bash
          source ~/.bashrc  # or restart your terminal
          foundryup
          
          For Windows (PowerShell):
          iex (irm https://foundry.paradigm.xyz)
          foundryup
          
          Then restart your terminal and verify with 'forge --version'`);
      }
    },
  };

  if (!checks[framework])
    throw new Error(`Unsupported framework: ${framework}`);
  await checks[framework]();
}

async function setupSolidity(framework, projectDir, answers) {
  try {
    const templatePath = path.join(
      __dirname,
      "../templates/solidity/contract.sol"
    );

    if (framework === "Hardhat") {
      const destinationPath = path.join(
        projectDir,
        "contracts",
        "contract.sol"
      );
      fs.mkdirSync(path.join(projectDir, "contracts"), { recursive: true });
      fs.copyFileSync(templatePath, destinationPath);
      console.log(
        chalk.green(`✅ Solidity contract template copied for Hardhat!`)
      );
      await setupHardhat(projectDir, answers);
    } else if (framework === "Foundry") {
      const destinationPath = path.join(projectDir, "src", "Contract.sol");
      fs.mkdirSync(path.join(projectDir, "src"), { recursive: true });
      fs.copyFileSync(templatePath, destinationPath);
      console.log(
        chalk.green(`✅ Solidity contract template copied for Foundry!`)
      );
      await setupFoundry(projectDir, "src");
    }
  } catch (error) {
    throw new Error(`Solidity setup failed: ${error.message}`);
  }
}

async function setupHardhat(projectDir, answers) {
  try {
    console.log(chalk.blue("\n🔨 Setting up Hardhat environment...\n"));

    shell.cd(projectDir);

    // Manually create Hardhat project files instead of running `npx hardhat`
    const isTypeScript = answers.scriptType === "TypeScript";
    const configFile = `hardhat.config.${isTypeScript ? "ts" : "js"}`;

    console.log(chalk.blue("\n📦 Installing Hardhat dependencies...\n"));
    const installCmd = `npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox${
      isTypeScript
        ? " typescript ts-node @types/node @nomicfoundation/hardhat-ethers"
        : ""
    }`;

    const { code: installCode } = shell.exec(installCmd);
    if (installCode !== 0) throw new Error("Dependency installation failed");

    // Generate Hardhat config manually
    const hardhatConfig = generateHardhatConfig(isTypeScript);
    fs.writeFileSync(path.join(projectDir, configFile), hardhatConfig);
    console.log(chalk.green(`✅ Hardhat configured (${configFile})!`));

    // Create sample folders
    shell.mkdir("-p", "contracts", "scripts", "test");

    // Create a sample Solidity contract
    const contractTemplate = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
    constructor(uint256 initialSupply) ERC20("Token", "MTK") {
        _mint(msg.sender, initialSupply);
    }
}`;

    fs.writeFileSync(
      path.join(projectDir, "contracts/Token.sol"),
      contractTemplate
    );
    console.log(chalk.green("✅ Sample Solidity contract created!"));

    // Create a .env file only if it doesn't exist
    const envPath = path.join(projectDir, ".env");
    if (!fs.existsSync(envPath)) {
      const envContent = `
RPC_URL=YOUR_ALCHEMY_URL_HERE
PRIVATE_KEY=YOUR_WALLET_PRIVATE_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
      `.trim();
      fs.writeFileSync(envPath, envContent);
      console.log(chalk.green("✅ .env file created!"));
    } else {
      console.log(
        chalk.yellow("⚠️ .env file already exists, skipping creation.")
      );
    }

    console.log(chalk.blue("\n🚀 Hardhat setup complete! Next steps:"));
    console.log(chalk.blue("➡️ Run `npx hardhat compile` to verify setup"));
    console.log(
      chalk.blue("➡️ Run `npx hardhat test` to execute sample tests")
    );
  } catch (error) {
    console.log(chalk.red(`❌ Hardhat setup failed: ${error.message}`));
  }
}

async function setupFoundry(projectDir) {
  try {
    console.log(chalk.blue("\n🔥 Setting up Foundry...\n"));
    shell.cd(projectDir);

    const { code } = shell.exec("forge init --no-commit --force");
    if (code !== 0) throw new Error("Foundry initialization failed");

    const foundryConfig = `[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc_version = "0.8.20"
optimizer = true
optimizer_runs = 200`;

    fs.writeFileSync(path.join(projectDir, "foundry.toml"), foundryConfig);
    console.log(chalk.green("✅ Foundry configured!"));
  } catch (error) {
    throw new Error(`Foundry setup failed: ${error.message}`);
  }
}

async function setupRust(projectDir) {
  try {
    console.log(chalk.blue("\n🔥 Setting up Rust project...\n"));

    const templatePath = path.join(__dirname, "../templates/rust/lib.rs");
    const rustDir = path.join(projectDir, "src");

    fs.mkdirSync(rustDir, { recursive: true });
    fs.copyFileSync(templatePath, path.join(rustDir, "lib.rs"));
    console.log(chalk.green("✅ Rust contract template copied!"));

    // Initialize Cargo project
    shell.cd(projectDir);
    const { code } = shell.exec("cargo init --lib");
    if (code !== 0) throw new Error("Cargo initialization failed");

    // Basic Cargo.toml configuration
    const cargoConfig = `[package]
name = "rust_project"
version = "0.1.0"
edition = "2021"

[dependencies]
stylus-sdk = "0.1.0"
alloy-primitives = "0.2.0"
ferris-says = "0.3.1"
`;

    fs.writeFileSync(path.join(projectDir, "Cargo.toml"), cargoConfig);

    console.log(chalk.green("\n✅ Rust project configured successfully!"));
  } catch (error) {
    throw new Error(`Rust setup failed: ${error.message}`);
  }
}

function generateHardhatConfig(isTypeScript) {
  const commonConfig = `solidity: "0.8.18",
networks: {
    pharos: {
      url: "<PHAROS_RPC_URL>",
      accounts: [vars.get("PRIVATE_KEY")],
    },
  },
etherscan: {
  apiKey: process.env.ETHERSCAN_API_KEY
}`;

  return isTypeScript
    ? `import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  ${commonConfig}
};

export default config;`
    : `require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  ${commonConfig}
};`;
}

module.exports = { initProject };
