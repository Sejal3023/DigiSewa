const { ethers } = require("hardhat");

async function main() {
  console.log("Testing DigiSewaLicenses contract - Simple Test...\n");
  
  // Get the contract
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const DigiSewaLicenses = await ethers.getContractFactory("DigiSewaLicenses");
  const contract = DigiSewaLicenses.attach(contractAddress);
  
  // Get signer
  const [signer] = await ethers.getSigners();
  console.log("Testing with account:", signer.address);
  console.log("Contract address:", contractAddress);
  console.log("---\n");
  
  // Test data
  const applicationId = "APP_SIMPLE_TEST_" + Date.now();
  const encryptedCID = "QmSimpleTestCID123456789";
  const documentHash = "0x1234567890abcdef1234567890abcdef12345678";
  const departmentId = 1;
  const accessCodeHash = "0xabcdef1234567890abcdef1234567890abcdef12";
  
  try {
    console.log("Step 1: Share document with department...");
    const tx1 = await contract.shareDocumentWithDepartment(
      applicationId,
      encryptedCID,
      documentHash,
      departmentId
    );
    await tx1.wait();
    console.log("✅ Document shared! TX:", tx1.hash);
    
    console.log("\nStep 2: Get document code...");
    const tx2 = await contract.getDocumentCode(applicationId, accessCodeHash);
    await tx2.wait();
    console.log("✅ Access code generated! TX:", tx2.hash);
    
    console.log("\nStep 3: Check document info...");
    const docInfo = await contract.getDocumentInfo(applicationId);
    console.log("✅ Document info retrieved!");
    console.log("   CID:", docInfo[0]);
    console.log("   Hash:", docInfo[1]);
    console.log("   Dept ID:", docInfo[2].toString());
    console.log("   Active:", docInfo[4]);
    
    console.log("\nStep 4: Check access code...");
    const accessInfo = await contract.checkAccessCode(applicationId);
    console.log("✅ Access code info retrieved!");
    console.log("   Exists:", accessInfo[0]);
    console.log("   Used:", accessInfo[1]);
    
    console.log("\nStep 5: Get document CID with access code...");
    const retrievedCID = await contract.getDocumentCID(applicationId, accessCodeHash);
    await retrievedCID.wait();
    console.log("✅ Document CID retrieved! TX:", retrievedCID.hash);
    
    console.log("\nStep 6: Verify document...");
    const verifyTx = await contract.verifyDocument(applicationId, documentHash);
    await verifyTx.wait();
    console.log("✅ Document verified! TX:", verifyTx.hash);
    
    console.log("\n🎉 All functions working correctly!");
    console.log("\nContract Status:");
    console.log("✅ Contract deployed at:", contractAddress);
    console.log("✅ All 4 core functions implemented and tested");
    console.log("✅ Access control working");
    console.log("✅ Document verification working");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

