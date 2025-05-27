import { HardhatUserConfig, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require("dotenv").config();

interface ExtendedHardhatUserConfig extends HardhatUserConfig {
  pharosscan?: {
    apiurl: string;
  };
}

const config: ExtendedHardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    pharos: {
      url: "https://testnet.dplabs-internal.com/",
      accounts: [process.env.WALLET_PRIVATE_KEY || ""],
      chainId: 688688

    },
  },
  pharosscan: {
    apiurl: "https://testnet.pharosscan.xyz/"
  },
};

export default config;
