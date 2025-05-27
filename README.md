<p align="center">

 <img width="500px" src="https://pbs.twimg.com/profile_banners/1785241793787043840/1736737016/1500x500" alt="Pharos" />
   <h1 align="center">🌟 pharos-config-cli</h1>

</p>

### 🏗️ Smart Contract SDK & Deployment Pipelines

**pharos-config-cli** is a robust command-line interface (CLI) designed to simplify the development, compilation, testing, and deployment of smart contracts. It supports both Solidity (EVM) and Rust (WASM) environments, offering seamless integration with leading frameworks like Hardhat, Foundry, and Cargo.

## 🎯 Key Features

- ✔ Multi-language support: Develop smart contracts in Solidity (EVM) and Rust (WASM)
- ✔ Framework flexibility: Choose between Hardhat or Foundry for Solidity
- ✔ Rust WASM ready: Full integration with Cargo contract
- ✔ One-command project setup: Initialize and configure your project effortlessly
- ✔ Automated compilation, testing, and deployment
- ✔ Cross-framework compatibility
- ✔ Frontend scaffolding: Automatically generate a frontend template based on the selected framework

## 📥 Installation

### Prerequisites

Ensure you have the following installed before using Pharos CLI:

1️⃣ **Node.js (v16 or later)** – Required for executing the CLI

2️⃣ **Rust (for WASM projects)** – Install Rust and Cargo using:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

3️⃣ **Solidity Frameworks (Only if working with EVM):**

```bash
# Hardhat
npm install -g hardhat

# Foundry
curl -L https://foundry.paradigm.xyz | bash
```

### Installing the SDK

You can install Pharos globally using NPM:

```bash
npm install -g pharos-config-cli
```

To verify that Pharos is installed correctly, run:

```bash
pharos --version
```

## Quick Start Guide

### 1️⃣ Initialize a New Project

```bash
pharos-config-cli init
```

📌 You will be prompted to choose:

- Contract Type: Solidity (EVM) or Rust (WASM)
- Development Framework (if Solidity): Hardhat or Foundry
- Frontend Framework (optional): React (Vite) or None

🔹 After initialization, Pharos will set up a structured project directory and generate a `pharos-config.json` file.

### 2️⃣ Compile Contracts

```bash
pharos-config-cli compile
```

💡 What happens?

- **Hardhat →** Runs `npx hardhat compile`
- **Foundry →** Runs `forge build`
- **Rust (WASM) →** Runs `cargo contract build`

If compilation is successful, the contract bytecode will be generated and stored in the respective artifacts directory.

### 3️⃣ Run Tests

```bash
pharos-config-cli test
```

🛠 Framework-Specific Test Execution:

- **Hardhat →** Runs `npx hardhat test`
- **Foundry →** Runs `forge test`
- **Rust (WASM) →** Runs `cargo test --all`

### 4️⃣ Deploy Your Contract

```bash
pharos-config-cli deploy
```

🚀 Deployment Process:

- **Hardhat →** Deploys using `npx hardhat run scripts/deploy.js --network localhost`
- **Foundry →** Uses `forge create --private-key $PRIVATE_KEY`
- **Rust (WASM) →** Uses `cargo contract deploy`

🔹 Ensure that your network configurations are properly set before deployment.

## 📁 Project Structure

After running `pharos-config-cli init`, your project will be structured as follows:

```bash
/project-root
│── /smart-contract
│   │── /src
│   │   ├── lib.rs           # Rust contract source (for Rust projects)
│   │   ├── contracts/       # Solidity contract files (for Hardhat/Foundry projects)
│   │   ├── scripts/         # Deployment scripts (for Hardhat projects)
│   │── Cargo.toml           # Rust package config (for Rust projects)
│   │── package.json         # Node dependencies (for Solidity projects)
│   │── pharos-config.json   # Stores project settings
│
│── /frontend                # Created if a frontend framework is chosen
│   │── /src
│   │   ├── App.jsx      # Reusable components
│   │   ├── main.jsx          # Static assets like images, styles
│   │── package.json         # Frontend dependencies
│   │── index.html           # Main HTML entry file (Vite projects)
│   │── vite.config.js       # Vite configuration (for React/Vue)
│
│── pharos-config.json       # Stores project-wide settings

```

📌 Note:

- The `contracts/` directory is used only for Hardhat projects.
- Foundry projects do not require a `contracts/` directory but instead use `.sol` files directly.
- Rust projects use `src/lib.rs` and `Cargo.toml` for configuration.

- If a frontend framework is selected, pharos-config-cli generates a basic template.
- Supports React (Vite) by default.

## ⚙️ Configuration File (pharos-config.json)

When a project is initialized, Pharos generates a `pharos-config.json` file to store project settings:

```json
{
  "contractType": "Solidity (EVM)",
  "framework": "Hardhat",
  "frontend": "React (Vite)"
}
```

This file helps Pharos determine how to handle compilation, testing, and deployment.

## 🔧 Advanced Configuration

### 1️⃣ Using Custom Networks for Deployment

For Hardhat:

```bash
npx hardhat run scripts/deploy.js --network rinkeby
```

For Foundry:

```bash
forge create --private-key $PRIVATE_KEY --rpc-url $RPC_URL
```

For Rust WASM:

```bash
cargo contract deploy --url ws://127.0.0.1:9944
```

## 🛠 Troubleshooting & Common Errors

| Error                                     | Solution                                               |
| ----------------------------------------- | ------------------------------------------------------ |
| ❌ No Pharos project found.               | Run `pharos-config-cli init` first.                 |
| ❌ Rust contract not compiled.            | Run `pharos-config-cli compile` before testing.     |
| ⚠️ No supported contract framework found! | Ensure you're inside a valid Pharos project directory. |
| Error: Cargo not found                    | Ensure Rust and Cargo are installed (`rustup show`).   |

## 🔄 Updating Pharos CLI

To update to the latest version of Pharos CLI:

```bash
npm update -g pharos-config-cli
```

## 📝 Contribution Guide

Pharos CLI is an open-source project, and contributions are welcome!

1️⃣ Fork the Repository

Clone the repo:

```bash
git clone https://github.com/ameer017/configure-pharos.git
```

Install dependencies:

```bash
npm install
```

Test changes locally:

```bash
node index.js
```

## 📄 License

**pharos-config-cli** is licensed under the MIT License.

## 🤝 Get Involved

🚀 Join the Pharos CLI community and contribute to the future of smart contract development!

- 📧 Email: [Raji Abdullahi](mailto:rajiabdullahi907@gmail.com)
- 🐦 Twitter: [@alAmeer170](https://twitter.com/alAmeer170)
- 📘 GitHub: [Pharos CLI Repo](https://github.com/ameer017/configure-pharos.git)

## 🔥 Ready to streamline your smart contract development?

- Run: 
```bash 
pharos-config-cli init
```
