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

    // Determine contract directory (could be 'smart-contract' or 'contract')
    const possibleContractDirs = ["smart-contract", "contract"];
    let contractDir = null;

    for (const dir of possibleContractDirs) {
      const dirPath = path.join(process.cwd(), dir);
      if (fs.existsSync(dirPath)) {
        contractDir = dirPath;
        break;
      }
    }

    if (!contractDir) {
      console.log(
        chalk.red(
          "\n❌ Error: Could not find contract directory. Expected either 'smart-contract' or 'contract'.\n"
        )
      );
      process.exit(1);
    }

    const cargoTomlPath = path.join(contractDir, "Cargo.toml");
    if (!fs.existsSync(cargoTomlPath)) {
      console.log(
        chalk.red("\n❌ Error: Cargo.toml not found in contract directory.\n")
      );
      console.log(
        chalk.yellow("Please ensure you have a valid Rust contract setup.")
      );
      console.log(chalk.yellow(`Looked in: ${contractDir}`));
      process.exit(1);
    }

    // Install cargo-contract if not exists
    if (!shell.which("cargo-contract")) {
      console.log(chalk.blue("Installing cargo-contract..."));
      const { code } = shell.exec("cargo install cargo-contract --force");
      if (code !== 0) {
        console.log(chalk.red("\n❌ Failed to install cargo-contract\n"));
        console.log(
          chalk.yellow(
            "You may need to install Rust first: https://www.rust-lang.org/tools/install"
          )
        );
        process.exit(1);
      }
    }

    // Check and add required dependencies
    shell.cd(contractDir);
    console.log(chalk.blue("Checking dependencies..."));

    const cargoToml = fs.readFileSync("Cargo.toml", "utf-8");
    const requiredDeps = [
      { name: "ink", version: "4.2.0" },
      {
        name: "scale",
        package: "parity-scale-codec",
        version: "3",
        features: "derive",
      },
      { name: "scale-info", version: "2.6", features: "derive" },
    ];

    for (const dep of requiredDeps) {
      const depPattern = new RegExp(`${dep.name}\\s*=\\s*["']?${dep.version}`);
      if (!depPattern.test(cargoToml)) {
        console.log(
          chalk.yellow(`Adding missing dependency: ${dep.name}@${dep.version}`)
        );
        const addCmd = `cargo add ${dep.package || dep.name}@${
          dep.version
        } --no-default-features${
          dep.features ? ` --features ${dep.features}` : ""
        }${dep.name === "scale" ? " --rename scale" : ""}`;

        const { code } = shell.exec(addCmd);
        if (code !== 0) {
          console.log(
            chalk.red(`\n❌ Failed to add dependency: ${dep.name}\n`)
          );
          process.exit(1);
        }
      }
    }

    // Build the contract
    console.log(chalk.blue("\n🏗 Building contract..."));
    const { code: buildCode } = shell.exec("cargo contract build");
    if (buildCode !== 0) {
      console.log(chalk.red("\n❌ Rust compilation failed\n"));
      console.log(chalk.yellow("Try running these commands manually:"));
      console.log(chalk.yellow(`cd ${contractDir}`));
      console.log(chalk.yellow("cargo contract build"));
      process.exit(1);
    }

    console.log(chalk.green("\n✅ Rust WASM compilation complete!"));
    console.log(chalk.blue("Your .wasm file is in the target/ink/ directory"));
  } else {
    console.log(chalk.red("\n❌ Error: Unsupported contract type.\n"));
    process.exit(1);
  }
}

module.exports = { compileContracts };
