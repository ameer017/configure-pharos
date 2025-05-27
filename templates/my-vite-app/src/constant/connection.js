import { createAppKit } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { defineChain } from "@reown/appkit/networks";

// 1. Get projectId
const projectId = "";

const pharosTestnet = defineChain({
  id: 688688,
  caipNetworkId: "eip155:688688",
  chainNamespace: "eip155",
  name: "Pharos Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Pharos Testnet",
    symbol: "PHRS",
  },
  rpcUrls: {
    default: {
      http: ["https://testnet.dplabs-internal.com/"],
    },
  },
  blockExplorers: {
    default: {
      name: "Pharos Scan",
      url: "https://testnet.pharosscan.xyz",
    },
  },
  contracts: {
    // Add the contracts here
  },
});
// 2. Set the networks
const networks = [pharosTestnet];

// 3. Create a metadata object - optional
const metadata = {
  name: "My Website",
  description: "My Website description",
  url: "https://mywebsite.com", // origin must match your domain & subdomain
  icons: ["https://avatars.mywebsite.com/"],
};

// 4. Create a AppKit instance
createAppKit({
  adapters: [new EthersAdapter()],
  networks,
  metadata,
  projectId,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
  },
});
