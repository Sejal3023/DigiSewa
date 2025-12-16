import { ethers } from 'ethers';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const artifactPath = path.resolve(__dirname, '../../artifacts/contracts/contract.sol/DigiSewaLicenses.json');
const raw = fs.readFileSync(artifactPath, 'utf8');
const DigiSewaLicensesArtifact = JSON.parse(raw);

// ---------------- Department mapping ---------------- //
//const DEPARTMENT_IDS = {
  //'municipal corporation': 1n,
  //'police department': 2n,
  //'revenue department': 3n,
  //'food safety department': 4n,
  //'regional transport office': 5n,
  //'labour department': 6n
//};
// ---------------- Department mapping: Name → Smart Contract ID ---------------- //
const DEPARTMENT_IDS = {
  'municipal corporation': 1n,
  'food safety department': 2n,
  'labour department': 3n,
  'police department': 4n,
  'revenue department': 5n,
  'regional transport office': 6n
};



// ---------------- Load environment variables ---------------- //
import dotenv from 'dotenv';
dotenv.config();

const { BLOCKCHAIN_RPC_URL, BLOCKCHAIN_PRIVATE_KEY, CONTRACT_ADDRESS } = process.env;
if (!BLOCKCHAIN_RPC_URL || !BLOCKCHAIN_PRIVATE_KEY || !CONTRACT_ADDRESS) {
  throw new Error("Blockchain env variables missing: BLOCKCHAIN_RPC_URL, BLOCKCHAIN_PRIVATE_KEY, CONTRACT_ADDRESS");
}

// ---------------- Provider & wallet ---------------- //
const provider = new ethers.JsonRpcProvider(BLOCKCHAIN_RPC_URL);
const wallet = new ethers.Wallet(BLOCKCHAIN_PRIVATE_KEY, provider);
export const signerAddress = wallet?.address || "";

// ---------------- Transaction queue with nonce management ---------------- //
let transactionQueue = Promise.resolve();
let currentNonce = null;

const executeTransaction = async (txFunction) => {
  // Queue this transaction after the previous ones complete
  const result = await (transactionQueue = transactionQueue.then(async () => {
    // Get fresh nonce for this transaction
    if (currentNonce === null) {
      currentNonce = await provider.getTransactionCount(wallet.address, 'pending');
    }

    try {
      const result = await txFunction(currentNonce);
      currentNonce++; // Increment nonce for next transaction
      return result;
    } catch (error) {
      // If nonce error, reset and retry
      if (error.code === 'NONCE_EXPIRED' || error.code === 'REPLACEMENT_UNDERPRICED') {
        console.log('Transaction failed due to nonce issue, resetting nonce...');
        currentNonce = null; // Reset nonce to refetch
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
          // Retry with fresh nonce
          if (currentNonce === null) {
            currentNonce = await provider.getTransactionCount(wallet.address, 'pending');
          }
          const result = await txFunction(currentNonce);
          currentNonce++;
          return result;
        } catch (retryError) {
          console.error('Retry failed:', retryError.message);
          currentNonce = null; // Reset on failure
          throw retryError;
        }
      }
      currentNonce = null; // Reset on other errors
      throw error;
    }
  }));

  return result;
};

export const getNextNonce = async () => {
  // For compatibility, still provide this function
  return await provider.getTransactionCount(wallet.address, 'pending');
};

// ---------------- Contract helper ---------------- //
const getContract = () => new ethers.Contract(CONTRACT_ADDRESS, DigiSewaLicensesArtifact.abi, wallet);

// ------------------ Blockchain functions ------------------ //

// 1️⃣ Share document with department (applicant side)
//export const shareDocumentWithDepartment = async (applicationId, encryptedCID, documentHash, departmentName) => {
  //return transactionLock = transactionLock.then(async () => {
    //try {
      //const contract = getContract();
      //const deptId = DEPARTMENT_IDS[departmentName.toLowerCase()];
      //if (!deptId) throw new Error(`Unknown department: ${departmentName}`);

      //const nonce = await getNextNonce();
      //const formattedHash = `0x${documentHash.startsWith('0x') ? documentHash.slice(2) : documentHash}`;

      //const tx = await contract.shareDocumentWithDepartment(applicationId, encryptedCID, formattedHash, deptId, { nonce, gasLimit: 1000000 });
      //const receipt = await tx.wait();
      //return { success: true, txHash: receipt.hash, blockNumber: receipt.blockNumber };
    //} catch (error) {
      //if (error.code === 'NONCE_EXPIRED' || error.code === 'REPLACEMENT_UNDERPRICED') currentNonce = null;
      //throw new Error(`Blockchain share failed: ${error.message}`);
    //}
  //});
//};


// 1️⃣ Share document with department (applicant side)
export const shareDocumentWithDepartment = async (applicationId, encryptedCID, documentHash, departmentName) => {
  return executeTransaction(async (nonce) => {
    // Validate input type
    if (typeof departmentName !== 'string') {
      throw new Error(`Department name must be a string, received: ${typeof departmentName}`);
    }

    const contract = getContract();
    const deptId = DEPARTMENT_IDS[departmentName.toLowerCase()];

    if (!deptId) {
      throw new Error(`Unknown department: "${departmentName}". Valid departments: ${Object.keys(DEPARTMENT_IDS).join(', ')}`);
    }

    console.log(`🔗 Blockchain: Mapping "${departmentName}" → ID ${deptId}`);

    const formattedHash = `0x${documentHash.startsWith('0x') ? documentHash.slice(2) : documentHash}`;

    // Convert BigInt to Number for Solidity uint256
    const tx = await contract.shareDocumentWithDepartment(
      applicationId,
      encryptedCID,
      formattedHash,
      Number(deptId),  // ✅ Convert BigInt to Number
      { nonce, gasLimit: 1000000 }
    );

    const receipt = await tx.wait();
    return { success: true, txHash: receipt.hash, blockNumber: receipt.blockNumber };
  });
};


// 2️⃣ Generate access code for document
export const getDocumentCode = async (applicationId, accessCodeHash) => {
  return executeTransaction(async (nonce) => {
    const contract = getContract();
    const tx = await contract.getDocumentCode(applicationId, accessCodeHash, { nonce, gasLimit: 1000000 });
    const receipt = await tx.wait();
    return { success: true, txHash: receipt.hash };
  });
};

// 3️⃣ Fetch encrypted CID (department side)
export const getDocumentCID = async (applicationId, providedAccessCodeHash) => {
  try {
    const contract = getContract();
    return await contract.getDocumentCID(applicationId, providedAccessCodeHash);
  } catch (error) {
    throw new Error(`Blockchain getDocumentCID failed: ${error.message}`);
  }
};

// 4️⃣ Verify document integrity
export const verifyDocument = async (applicationId, providedDocumentHash) => {
  try {
    const contract = getContract();
    return await contract.verifyDocument(applicationId, providedDocumentHash);
  } catch (error) {
    console.error('Blockchain verification failed', error);
    return false;
  }
};

// 5️⃣ Get document metadata
export const getDocumentInfo = async (applicationId) => {
  try {
    const contract = getContract();
    const info = await contract.getDocumentInfo(applicationId);
    return {
      encryptedCID: info[0],
      documentHash: info[1],
      departmentId: info[2].toString(),
      timestamp: info[3].toString(),
      isActive: info[4]
    };
  } catch (error) {
    throw error;
  }
};

// 6️⃣ Check access code
export const checkAccessCode = async (applicationId) => {
  try {
    const contract = getContract();
    const info = await contract.checkAccessCode(applicationId);
    return { exists: info[0], isUsed: info[1], departmentId: info[2].toString() };
  } catch {
    return { exists: false, isUsed: false, departmentId: "0" };
  }
};

// 7️⃣ Deactivate document
export const deactivateDocument = async (applicationId) => {
  return executeTransaction(async (nonce) => {
    const contract = getContract();
    const tx = await contract.deactivateDocument(applicationId, { nonce, gasLimit: 1000000 });
    const receipt = await tx.wait();
    return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
  });
};

// 8️⃣ Legacy functions (record issuance & revocation)
export const recordIssuanceOnChain = async ({ licenseId, payloadHash, issuerPubKey, timestamp }) => {
  return executeTransaction(async (nonce) => {
    const contract = getContract();
    const tx = await contract.recordIssuance(licenseId, payloadHash, issuerPubKey, BigInt(timestamp), { nonce, gasLimit: 1000000 });
    const receipt = await tx.wait();
    return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
  });
};

export const recordRevocationOnChain = async ({ licenseId, reason, timestamp }) => {
  return executeTransaction(async (nonce) => {
    const contract = getContract();
    const tx = await contract.revokeLicense(licenseId, reason, BigInt(timestamp), { nonce, gasLimit: 1000000 });
    const receipt = await tx.wait();
    return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
  });
};

// 9️⃣ Get transaction info
export const getTransaction = async (txHash) => await provider.getTransaction(txHash);

// ------------------ Export all ------------------ //
export {
  provider,
  wallet,
  
 

};
