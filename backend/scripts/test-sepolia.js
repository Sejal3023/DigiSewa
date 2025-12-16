// backend/scripts/test-sepolia.cjs
const { ethers } = require("hardhat");

async function main() {
  // Connect to the deployed contract
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const DigiSewaLicenses = await ethers.getContractFactory("DigiSewaLicenses");
  const contract = DigiSewaLicenses.attach(contractAddress);
  
  // Test a simple function
  const testTx = await contract.recordIssuance(
    "test-license-123",
    "abc123hash",
    "test-pub-key",
    Math.floor(Date.now() / 1000)
  );
  
  console.log("Test transaction sent:", testTx.hash);
  await testTx.wait();
  console.log("Test transaction confirmed!");
}

main().catch(console.error);