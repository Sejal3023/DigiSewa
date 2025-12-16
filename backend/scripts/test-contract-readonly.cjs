const { ethers } = require("hardhat");

async function main() {
  console.log("Testing DigiSewaLicenses contract READ-ONLY functions...\n");
  
  // Get the contract
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const DigiSewaLicenses = await ethers.getContractFactory("DigiSewaLicenses");
  const contract = DigiSewaLicenses.attach(contractAddress);
  
  // Get signer
  const [signer] = await ethers.getSigners();
  console.log("Testing with account:", signer.address);
  console.log("Contract address:", contractAddress);
  console.log("---\n");
  
  // Test data - using the application ID from previous test
  const applicationId = "APP_002_TEST_1757775744000"; // Use a known application ID
  
  try {
    // Test 1: getDocumentInfo (read-only)
    console.log("1. Testing getDocumentInfo (read-only)...");
    const docInfo = await contract.getDocumentInfo(applicationId);
    console.log("✅ Document info retrieved successfully!");
    console.log("   Encrypted CID:", docInfo[0]);
    console.log("   Document Hash:", docInfo[1]);
    console.log("   Department ID:", docInfo[2].toString());
    console.log("   Timestamp:", docInfo[3].toString());
    console.log("   Is Active:", docInfo[4]);
    console.log();
    
    // Test 2: checkAccessCode (read-only)
    console.log("2. Testing checkAccessCode (read-only)...");
    const accessCodeInfo = await contract.checkAccessCode(applicationId);
    console.log("✅ Access code info retrieved successfully!");
    console.log("   Exists:", accessCodeInfo[0]);
    console.log("   Is Used:", accessCodeInfo[1]);
    console.log("   Department ID:", accessCodeInfo[2].toString());
    console.log();
    
    // Test 3: documentExists (read-only)
    console.log("3. Testing documentExists (read-only)...");
    const exists = await contract.documentExists(applicationId);
    console.log("✅ Document exists check completed!");
    console.log("   Document exists:", exists);
    console.log();
    
    // Test 4: accessCodeExists (read-only)
    console.log("4. Testing accessCodeExists (read-only)...");
    const accessExists = await contract.accessCodeExists(applicationId);
    console.log("✅ Access code exists check completed!");
    console.log("   Access code exists:", accessExists);
    console.log();
    
    console.log("🎉 All read-only tests completed successfully!");
    console.log("\nRead-Only Functions Summary:");
    console.log("✅ getDocumentInfo - Working");
    console.log("✅ checkAccessCode - Working");
    console.log("✅ documentExists - Working");
    console.log("✅ accessCodeExists - Working");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Full error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

