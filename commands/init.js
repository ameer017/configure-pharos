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

    // Prompt for project name
    const projectNameResponse = await prompt({
      type: "text",
      name: "projectName",
      message: "Enter a name for your directory:",
      validate: (input) =>
        input.trim() !== "" || "directory name cannot be empty!",
    });
    answers.projectName = projectNameResponse.projectName.trim();

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

    const frontendResponse = await prompt({
      type: "select",
      name: "frontend",
      message: "Choose a frontend framework:",
      choices: ["React (Vite)", "Vue.js", "None"],
    });
    answers.frontend = frontendResponse.frontend;

    console.log(
      chalk.blue(
        `\n📁 Setting up ${answers.contractType} project with name "${answers.projectName}"...\n`
      )
    );

    // Use the custom project name
    const projectDir = path.join(process.cwd(), answers.projectName);
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }

    if (answers.frontend !== "None") {
      await setupFrontend(answers.frontend, projectDir);
    }

    if (answers.contractType === "Solidity (EVM)") {
      await checkPrerequisites(answers.framework);
    }

    // Setup the smart contract project
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
          chalk.blue(`cd ${answers.projectName}\n`) +
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
    const contractDir = path.join(projectDir, "smart-contract");

    // Create the smart-contract directory if it doesn't exist
    if (!fs.existsSync(contractDir)) {
      fs.mkdirSync(contractDir, { recursive: true });
    }

    // Copy the entire template folder for the selected framework
    const templatePath = path.join(
      __dirname,
      `../templates/solidity/${framework.toLowerCase()}`
    );

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found for ${framework}`);
    }

    console.log("Template path:", templatePath);
    console.log("Contract dir:", contractDir);
    // Copy all files from template to contract directory
    shell.cp("-R", `${templatePath}/.`, contractDir);
    console.log(chalk.green(`✅ ${framework} template copied successfully!`));

    // Install dependencies
    shell.cd(contractDir);
    if (framework === "Hardhat") {
      console.log(chalk.blue("\n📦 Installing Hardhat dependencies...\n"));
      const { code: installCode } = shell.exec("npm install");
      if (installCode !== 0) throw new Error("Dependency installation failed");
    } else if (framework === "Foundry") {
      console.log(chalk.blue("\n📦 Installing Foundry dependencies...\n"));
      const { code: installCode } = shell.exec("forge install");
      if (installCode !== 0) throw new Error("Dependency installation failed");
    }

    // Create .env file if it doesn't exist
    const envPath = path.join(contractDir, ".env");
    if (!fs.existsSync(envPath)) {
      const envContent = `
RPC_URL = https://devnet.dplabs-internal.com/
WALLET_PRIVATE_KEY = YOUR_WALLET_PRIVATE_KEY
PHAROS_EXPLORER_API= 
      `.trim();
      fs.writeFileSync(envPath, envContent);
      console.log(chalk.green("✅ .env file created!"));
    } else {
      console.log(
        chalk.yellow("⚠️ .env file already exists, skipping creation.")
      );
    }

    console.log(chalk.green(`\n✅ ${framework} setup completed successfully!`));
  } catch (error) {
    throw new Error(`Solidity setup failed: ${error.message}`);
  }
}

// Remove the old setupHardhat and setupFoundry functions since we're using templates

async function setupRust(projectDir) {
  try {
    const contractDir = path.join(projectDir, "smart-contract");
    fs.mkdirSync(contractDir, { recursive: true });

    console.log(chalk.blue("\n🔥 Setting up Rust project...\n"));

    const templatePath = path.join(__dirname, "../templates/rust/lib.rs");
    const rustSrcDir = path.join(contractDir, "src");

    fs.mkdirSync(rustSrcDir, { recursive: true });
    fs.copyFileSync(templatePath, path.join(rustSrcDir, "lib.rs"));
    console.log(chalk.green("✅ Rust contract template copied!"));

    shell.cd(contractDir);
    const { code } = shell.exec("cargo init --lib");
    if (code !== 0) throw new Error("Cargo initialization failed");

    console.log(chalk.green("\n✅ Rust project configured successfully!"));
  } catch (error) {
    throw new Error(`Rust setup failed: ${error.message}`);
  }
}

async function setupFrontend(frontend, projectDir) {
  try {
    console.log(chalk.blue(`\n🚀 Setting up ${frontend} frontend...\n`));

    const templatesDir = path.join(__dirname, "../templates");
    const frontendDir = path.join(projectDir, "frontend");

    let sourceDir;

    if (frontend === "React (Vite)") {
      sourceDir = path.join(templatesDir, "my-vite-app");
    } else if (frontend === "Vue.js") {
      sourceDir = path.join(templatesDir, "my-vue-app");
    }

    if (sourceDir && fs.existsSync(sourceDir)) {
      shell.cp("-R", sourceDir, frontendDir);
      console.log(
        chalk.green(`✅ ${frontend} template copied successfully!\n`)
      );
    } else {
      console.log(chalk.red(`❌ Error: ${frontend} template not found!`));
    }
  } catch (error) {
    throw new Error(`Frontend setup failed: ${error.message}`);
  }
}

module.exports = { initProject };
