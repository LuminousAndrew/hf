import hre from "hardhat";
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { xdcTestnet } from "viem/chains";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🚀 Starting HardFork V2 Deployment...");

  // 1. Setup Account & RPC
  const pKey = process.env.XDC_PRIVATE_KEY as `0x${string}`;
  if (!pKey) throw new Error("XDC_PRIVATE_KEY missing in .env");
  
  const account = privateKeyToAccount(pKey);
  const transport = http("https://erpc.apothem.network");

  const walletClient = createWalletClient({ account, chain: xdcTestnet, transport });
  const publicClient = createPublicClient({ chain: xdcTestnet, transport });

  // Your specific Treasury Address
  const TREASURY_ADDRESS = "0x215c2ff021637ebeb98ef836f097a0aef44216c9";
  
  console.log(`🏦 Target Treasury: ${TREASURY_ADDRESS}`);
  console.log(`📡 Deploying from: ${account.address}\n`);

  /**
   * Helper to deploy and return address + ABI for linking
   */
  async function deployContract(contractName: string, args: any[] = []) {
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
    
    return { address: receipt.contractAddress, abi: artifact.abi };
  }

  try {
    // 1. Deploy Registry
    const registry = await deployContract("HardForkRegistry");

    // 2. Deploy Posts (Takes Treasury in constructor)
    const posts = await deployContract("HardForkPosts", [TREASURY_ADDRESS]);

    // 3. Deploy Splitter (Takes Posts address in constructor)
    // Note: The Splitter contract you provided has Treasury as a constant, 
    // so we only pass the posts address here.
    const splitter = await deployContract("HardForkSplitter", [posts.address]);

    // 4. LINKING STEP
    // We must tell the Posts contract which Splitter address is allowed 
    // to call 'updatePostInvestment'
    console.log("🔗 Linking Posts to Splitter...");
    const linkHash = await walletClient.writeContract({
      address: posts.address as `0x${string}`,
      abi: posts.abi,
      functionName: 'setSplitter',
      args: [splitter.address],
      account
    });

    await publicClient.waitForTransactionReceipt({ hash: linkHash });
    console.log("✅ Authorization Complete: Posts now accepts updates from Splitter.\n");

    console.log("-----------------------------------------");
    console.log("🎉 DEPLOYMENT SUCCESSFUL");
    console.log(`NEXT_PUBLIC_REGISTRY_ADDR=${registry.address}`);
    console.log(`NEXT_PUBLIC_POSTS_ADDR=${posts.address}`);
    console.log(`NEXT_PUBLIC_SPLITTER_ADDR=${splitter.address}`);
    console.log("-----------------------------------------\n");
    console.log("Copy these to your .env.local file in the frontend.");

  } catch (error) {
    console.error("❌ Deployment Failed:");
    console.error(error);
    process.exit(1);
  }
}

main();