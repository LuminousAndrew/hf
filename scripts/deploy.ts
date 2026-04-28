import hre from "hardhat";
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { xdcTestnet } from "viem/chains";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🚀 Starting Manual Viem Deployment...");

  // 1. Setup Account & RPC
  const pKey = process.env.XDC_PRIVATE_KEY as `0x${string}`;
  if (!pKey) throw new Error("XDC_PRIVATE_KEY missing in .env");
  
  const account = privateKeyToAccount(pKey);
  const transport = http("https://erpc.apothem.network");

  const walletClient = createWalletClient({ account, chain: xdcTestnet, transport });
  const publicClient = createPublicClient({ chain: xdcTestnet, transport });

  const MY_XDC_ADDRESS = "0x215c2ff021637ebeb98ef836f097a0aef44216c9";
  console.log(`🏦 Treasury Address: ${MY_XDC_ADDRESS}`);
  console.log(`📡 Deploying from: ${account.address}\n`);

  // Helper function to deploy using Hardhat artifacts but Viem's core client
  async function deployRaw(contractName: string, args: any[] = []) {
    console.log(`🛠️  Deploying ${contractName}...`);
    const artifact = await hre.artifacts.readArtifact(contractName);
    
    const hash = await walletClient.deployContract({
      abi: artifact.abi,
      bytecode: artifact.bytecode as `0x${string}`,
      args
    });

    console.log(`⏳ Waiting for confirmation... (${hash})`);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    if (!receipt.contractAddress) throw new Error(`Failed to deploy ${contractName}`);
    console.log(`✅ ${contractName} at: ${receipt.contractAddress}\n`);
    return receipt.contractAddress;
  }

  try {
    // 1. Registry
    const registryAddr = await deployRaw("HardForkRegistry");

    // 2. Posts
    const postsAddr = await deployRaw("HardForkPosts", [MY_XDC_ADDRESS]);

    // 3. Splitter
    const splitterAddr = await deployRaw("HardForkSplitter", [
      MY_XDC_ADDRESS,
      postsAddr
    ]);

    console.log("-----------------------------------------");
    console.log("🎉 DEPLOYMENT COMPLETE");
    console.log(`NEXT_PUBLIC_REGISTRY_ADDR=${registryAddr}`);
    console.log(`NEXT_PUBLIC_POSTS_ADDR=${postsAddr}`);
    console.log(`NEXT_PUBLIC_SPLITTER_ADDR=${splitterAddr}`);
    console.log("-----------------------------------------\n");

  } catch (error) {
    console.error("❌ Deployment Failed:");
    console.error(error);
    process.exit(1);
  }
}

main();