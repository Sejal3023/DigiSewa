const fs = require('fs');
const path = require('path');

// Read the compiled contract artifact
const artifactPath = path.join(__dirname, '../artifacts/contracts/contract.sol/DigiSewaLicenses.json');
const abiPath = path.join(__dirname, '../src/blockchain/contractABI.json');

try {
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
  console.log('✅ Contract ABI updated successfully!');
  console.log('Updated file:', abiPath);
} catch (error) {
  console.error('❌ Error updating ABI:', error.message);
}

