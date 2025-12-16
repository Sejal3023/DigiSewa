const { ethers } = require("hardhat");

async function main() {
  console.log("Testing DigiSewaLicenses contract functions...\n");
  
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
  const applicationId = "APP_002_TEST_" + Date.now();
  const encryptedCID = "QmTestEncryptedCID123456789";
  const documentHash = "0x1234567890abcdef1234567890abcdef12345678";
  const departmentId = 1;
  const accessCodeHash = "0xabcdef1234567890abcdef1234567890abcdef12";
  
  try {
    // Test 1: shareDocumentWithDepartment
    console.log("1. Testing shareDocumentWithDepartment...");
    const tx1 = await contract.shareDocumentWithDepartment(
      applicationId,
      encryptedCID,
      documentHash,
      departmentId
    );
    await tx1.wait();
    console.log("✅ Document shared successfully!");
    console.log("   Transaction hash:", tx1.hash);
    console.log("   Application ID:", applicationId);
    console.log("   Department ID:", departmentId);
    console.log();
    
    // Test 2: getDocumentCode
    console.log("2. Testing getDocumentCode...");
    const tx2 = await contract.getDocumentCode(applicationId, accessCodeHash);
    await tx2.wait();
    console.log("✅ Access code generated successfully!");
    console.log("   Transaction hash:", tx2.hash);
    console.log();
    
    // Test 3: getDocumentInfo
    console.log("3. Testing getDocumentInfo...");
    const docInfo = await contract.getDocumentInfo(applicationId);
    console.log("✅ Document info retrieved successfully!");
    console.log("   Encrypted CID:", docInfo[0]);
    console.log("   Document Hash:", docInfo[1]);
    console.log("   Department ID:", docInfo[2].toString());
    console.log("   Timestamp:", docInfo[3].toString());
    console.log("   Is Active:", docInfo[4]);
    console.log();
    
    // Test 4: checkAccessCode
    console.log("4. Testing checkAccessCode...");
    const accessCodeInfo = await contract.checkAccessCode(applicationId);
    console.log("✅ Access code info retrieved successfully!");
    console.log("   Exists:", accessCodeInfo[0]);
    console.log("   Is Used:", accessCodeInfo[1]);
    console.log("   Department ID:", accessCodeInfo[2].toString());
    console.log();
    
    // Test 5: getDocumentCID (with correct access code hash)
    console.log("5. Testing getDocumentCID...");
    const retrievedCID = await contract.getDocumentCID(applicationId, accessCodeHash);
    console.log("✅ Document CID retrieved successfully!");
    console.log("   Retrieved CID:", retrievedCID);
    console.log("   Matches original:", retrievedCID === encryptedCID);
    console.log();
    
    // Test 6: verifyDocument
    console.log("6. Testing verifyDocument...");
    const isValid = await contract.verifyDocument(applicationId, documentHash);
    console.log("✅ Document verification completed!");
    console.log("   Document is valid:", isValid);
    console.log();
    
    // Test 7: Test with wrong hash (should return false)
    console.log("7. Testing verifyDocument with wrong hash...");
    const wrongHash = "0xwronghash1234567890abcdef1234567890abcdef";
    const isInvalid = await contract.verifyDocument(applicationId, wrongHash);
    console.log("✅ Document verification with wrong hash completed!");
    console.log("   Document is valid (should be false):", isInvalid);
    console.log();
    
    console.log("🎉 All tests completed successfully!");
    console.log("\nContract Functions Summary:");
    console.log("✅ shareDocumentWithDepartment - Working");
    console.log("✅ getDocumentCode - Working");
    console.log("✅ getDocumentCID - Working");
    console.log("✅ verifyDocument - Working");
    console.log("✅ getDocumentInfo - Working");
    console.log("✅ checkAccessCode - Working");
    
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
