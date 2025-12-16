import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize provider and signer
const provider = new ethers.JsonRpcProvider(
  process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545'
);

const wallet = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY, provider);

// Load contract ABI
const contractArtifact = JSON.parse(
  readFileSync(
    join(__dirname, '../../artifacts/contracts/contract.sol/DigiSewaLicenses.json'),
    'utf-8'
  )
);

const contractABI = contractArtifact.abi;
const contractAddress = process.env.CONTRACT_ADDRESS;

// Create contract instance
const contract = new ethers.Contract(contractAddress, contractABI, wallet);

/**
 * Record approval/rejection on blockchain
 * @param {Object} approvalData - { applicationId, department, officerId, action, remarks }
 */
export async function recordApprovalOnBlockchain(approvalData) {
  try {
    const { applicationId, department, officerId, action, remarks } = approvalData;
    
    console.log(`⛓️ [Blockchain] Recording ${action} for application ${applicationId}`);

    // Create approval hash
    const approvalHash = ethers.keccak256(
      ethers.toUtf8Bytes(
        JSON.stringify({
          applicationId,
          department,
          officerId,
          action,
          remarks: remarks || '',
          timestamp: Date.now()
        })
      )
    );

    // Call smart contract function
    const tx = await contract.recordApproval(
      applicationId,
      department,
      approvalHash,
      action
    );

    console.log(`⏳ [Blockchain] Transaction sent: ${tx.hash}`);

    // Wait for confirmation
    const receipt = await tx.wait();

    console.log(`✅ [Blockchain] Confirmed in block ${receipt.blockNumber}`);

    return {
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      approvalHash: approvalHash
    };

  } catch (error) {
    console.error('❌ [Blockchain] Error:', error.message);
    throw new Error(`Blockchain recording failed: ${error.message}`);
  }
}

export default { recordApprovalOnBlockchain };
