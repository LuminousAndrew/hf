import { configVariable, defineConfig } from "hardhat/config";
import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";

export default defineConfig({
  // Register the plugin here for Hardhat 3
  plugins: [hardhatToolboxViemPlugin],
  solidity: "0.8.28",
  networks: {
    apothem: {
      type: "http",
      chainType: "l1",
      // Hardcode the URL for now to avoid the configVariable 'HHE7' error
      url: "https://rpc.ankr.com/xdc", 
      accounts: [configVariable("XDC_PRIVATE_KEY")],
    },
  },
});