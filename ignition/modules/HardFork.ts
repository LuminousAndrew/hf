import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const HardForkModule = buildModule("HardForkModule", (m) => {
  // This tells Ignition to deploy the contract named "HardForkPosts"
  const posts = m.contract("HardForkPosts");

  return { posts };
});

export default HardForkModule;