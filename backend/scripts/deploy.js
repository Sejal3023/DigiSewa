import pkg from "hardhat";
const { ethers } = pkg;
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("Deploying DigiSewaLicenses contract...");
  
  // Get the contract factory
  const DigiSewaLicenses = await ethers.getContractFactory("DigiSewaLicenses");
  
  // Deploy the contract
  const digiSewa = await DigiSewaLicenses.deploy();
  
  // Wait for deployment to complete - use waitForDeployment() instead of deployed()
  await digiSewa.waitForDeployment();
  
  // Get the contract address - use getAddress() instead of .address
  const contractAddress = await digiSewa.getAddress();
  
  console.log("DigiSewaLicenses contract deployed to:", contractAddress);
  
  // Also update the .env file
  const envPath = path.resolve(__dirname, "../.env");
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  
  // Update or add CONTRACT_ADDRESS
  if (envContent.includes("CONTRACT_ADDRESS=")) {
    envContent = envContent.replace(
      /CONTRACT_ADDRESS=.*/,
      `CONTRACT_ADDRESS=${contractAddress}`
    );
  } else {
    envContent += `\nCONTRACT_ADDRESS=${contractAddress}`;
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log("Updated .env file with contract address");
  
  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });