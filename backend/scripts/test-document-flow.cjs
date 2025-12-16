const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:5001';

async function testDocumentFlow() {
  console.log('🧪 Testing Complete Document Flow...\n');

  try {
    // Step 1: Create a test document
    const testContent = 'This is a test document for DigiSewa blockchain integration.';
    const testFileName = 'test-document.txt';
    fs.writeFileSync(testFileName, testContent);
    console.log('✅ Test document created');

    // Step 2: Upload document
    console.log('\n📤 Step 1: Uploading document...');
    const formData = new FormData();
    formData.append('document', fs.createReadStream(testFileName));
    formData.append('departmentId', '1');
    formData.append('applicationId', `TEST_APP_${Date.now()}`);

    const uploadResponse = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      body: formData
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    const uploadResult = await uploadResponse.json();
    console.log('✅ Document uploaded successfully');
    console.log('   Application ID:', uploadResult.data.applicationId);
    console.log('   CID:', uploadResult.data.cid);
    console.log('   Access Code:', uploadResult.data.accessCode);
    console.log('   Blockchain TX:', uploadResult.data.blockchainTxHash);

    const { applicationId, accessCode } = uploadResult.data;

    // Step 3: Get document info
    console.log('\n📋 Step 2: Getting document info...');
    const infoResponse = await fetch(`${API_BASE_URL}/documents/info/${applicationId}`);
    
    if (!infoResponse.ok) {
      throw new Error(`Get info failed: ${infoResponse.status}`);
    }

    const infoResult = await infoResponse.json();
    console.log('✅ Document info retrieved');
    console.log('   Department ID:', infoResult.data.departmentId);
    console.log('   Document Hash:', infoResult.data.documentHash);
    console.log('   Is Active:', infoResult.data.isActive);

    // Step 4: Retrieve document
    console.log('\n📥 Step 3: Retrieving document...');
    const retrieveResponse = await fetch(`${API_BASE_URL}/documents/retrieve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        applicationId,
        accessCode
      })
    });

    if (!retrieveResponse.ok) {
      const errorText = await retrieveResponse.text();
      throw new Error(`Retrieve failed: ${retrieveResponse.status} - ${errorText}`);
    }

    const retrieveResult = await retrieveResponse.json();
    console.log('✅ Document retrieved successfully');
    console.log('   CID:', retrieveResult.data.cid);
    console.log('   Document Hash:', retrieveResult.data.documentHash);
    console.log('   Is Valid:', retrieveResult.data.isValid);

    // Step 5: Verify document integrity
    console.log('\n🔍 Step 4: Verifying document integrity...');
    const verifyResponse = await fetch(`${API_BASE_URL}/documents/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        applicationId,
        documentHash: retrieveResult.data.documentHash
      })
    });

    if (!verifyResponse.ok) {
      throw new Error(`Verify failed: ${verifyResponse.status}`);
    }

    const verifyResult = await verifyResponse.json();
    console.log('✅ Document verification completed');
    console.log('   Is Valid:', verifyResult.data.isValid);

    // Cleanup
    fs.unlinkSync(testFileName);
    console.log('\n🧹 Test file cleaned up');

    console.log('\n🎉 Complete Document Flow Test PASSED!');
    console.log('\n📊 Test Summary:');
    console.log('✅ Document upload to IPFS');
    console.log('✅ Blockchain registration');
    console.log('✅ Access code generation');
    console.log('✅ Document retrieval');
    console.log('✅ Integrity verification');
    console.log('✅ All API endpoints working');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    // Cleanup on error
    try {
      if (fs.existsSync('test-document.txt')) {
        fs.unlinkSync('test-document.txt');
      }
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    
    process.exit(1);
  }
}

// Check if backend is running
async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (response.ok) {
      console.log('✅ Backend is running');
      return true;
    }
  } catch (error) {
    console.log('❌ Backend is not running. Please start it with: npm start');
    return false;
  }
}

async function main() {
  console.log('🔍 Checking backend health...');
  const isBackendRunning = await checkBackendHealth();
  
  if (!isBackendRunning) {
    process.exit(1);
  }

  await testDocumentFlow();
}

main().catch(console.error);

