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

    if (!fs.existsSync(contractDir)) {
      fs.mkdirSync(contractDir, { recursive: true });
    }

    const templatePath = path.join(
      __dirname,
      `../templates/solidity/${framework.toLowerCase()}`
    );

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found for ${framework}`);
    }

    console.log("Template path:", templatePath);
    console.log("Contract dir:", contractDir);
    shell.cp("-R", `${templatePath}/.`, contractDir);
    console.log(chalk.green(`✅ ${framework} template copied successfully!`));

    shell.cd(contractDir);
    if (framework === "Hardhat") {
      console.log(chalk.blue("\n📦 Installing Hardhat dependencies...\n"));
      const { code: installCode } = shell.exec("npm install");
      if (installCode !== 0) throw new Error("Dependency installation failed");
    } else if (framework === "Foundry") {
      console.log(chalk.blue("\n📦 Installing Foundry dependencies...\n"));

      // First initialize git if not already initialized
      if (!fs.existsSync(path.join(contractDir, ".git"))) {
        const { code: gitInitCode } = shell.exec("git init");
        if (gitInitCode !== 0) throw new Error("Git initialization failed");
      }

      // Install dependencies without --force flag
      const { code: installCode } = shell.exec("forge install");
      if (installCode !== 0) throw new Error("Dependency installation failed");

      // Install foundry-std separately if needed
      const { code: stdInstallCode } = shell.exec(
        "forge install foundry-rs/foundry-std --no-commit"
      );
      if (stdInstallCode !== 0)
        console.log(chalk.yellow("⚠️ Could not install foundry-std"));
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

async function setupRust(projectDir) {
  try {
    const contractDir = path.join(projectDir, "smart-contract");
    fs.mkdirSync(contractDir, { recursive: true });

    console.log(chalk.blue("\n🔥 Setting up Rust project...\n"));

    // Clone the specific branch/directory we need
    const repoUrl = "https://github.com/PharosNetwork/examples";
    const branch = "main";
    const targetDir = "token/rust/contract";

    shell.cd(contractDir);

    // Use sparse checkout to only get the needed directory
    console.log(chalk.blue("⏳ Cloning repository..."));
    const { code: cloneCode } = shell.exec(`
      git clone --filter=blob:none --no-checkout --depth 1 --branch ${branch} ${repoUrl} tmp-repo && 
      cd tmp-repo && 
      git sparse-checkout init --cone && 
      git sparse-checkout set ${targetDir} && 
      git checkout && 
      cd ..
    `);

    if (cloneCode !== 0) throw new Error("Git clone failed");

    // Move the contract files to the main contract directory
    const sourcePath = path.join(contractDir, "tmp-repo", targetDir);
    fs.readdirSync(sourcePath).forEach((file) => {
      fs.renameSync(path.join(sourcePath, file), path.join(contractDir, file));
    });

    // Clean up
    fs.rmSync(path.join(contractDir, "tmp-repo"), {
      recursive: true,
      force: true,
    });

    console.log(chalk.green("\n✅ Rust project configured successfully!"));
  } catch (error) {
    // Clean up in case of error
    if (fs.existsSync(path.join(contractDir, "tmp-repo"))) {
      fs.rmSync(path.join(contractDir, "tmp-repo"), {
        recursive: true,
        force: true,
      });
    }
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
