import { ethers } from "ethers";
import hre from "hardhat";

async function main() {
  console.log("🚀 Deploying SimpleEscrow...");

  const developerAddress = ethers.getAddress("0x5aF0F3A905AC7Edcd494F56f7D2C5C4a89de9b98");
  const escrowAmount = ethers.parseEther("0.0001");

  const artifact = await hre.artifacts.readArtifact("SimpleEscrow");
  
  // ВРЕМЕННО: явно укажи RPC и private key
  const provider = new ethers.JsonRpcProvider("https://eth-sepolia.g.alchemy.com/v2/a1b61Bj6uVJh285KWxvAc");
  
  // ЗАМЕНИ на свой РЕАЛЬНЫЙ приватный ключ (с 0x или без)
  const privateKey = "df33e81f5cd65976aa88cf541aef508062668626ca72d86b0f9abe3fea9aa78e";
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log("Deploying from:", wallet.address);
  console.log("Balance:", ethers.formatEther(await provider.getBalance(wallet.address)), "ETH");
  
  const SimpleEscrow = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  
  const escrow = await SimpleEscrow.deploy(developerAddress, {
    value: escrowAmount
  });

  await escrow.waitForDeployment();
  const address = await escrow.getAddress();

  console.log("✅ SimpleEscrow deployed to:", address);
  console.log("\n🔗 View on Etherscan:");
  console.log(`https://sepolia.etherscan.io/address/${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});