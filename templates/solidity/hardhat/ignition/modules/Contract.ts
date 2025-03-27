import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("CounterModule", (m) => {
  const counter = m.contract("Counter");
  console.log("🚀 Deploying Counter contract...");
  return { counter };
});
