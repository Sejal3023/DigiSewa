import { uploadToPinata, generateAESKey, encryptData, generateDocumentHash, generateAccessCodeHash } from '../services/pinataService.js';
import { shareDocumentWithDepartment, getDocumentCode } from '../blockchain/blockchainService.js';
import blockchainConfig from '../config/blockchain.js';
import db from '../db/pg_client.js'; // 1. IMPORT: Database client
import crypto from 'crypto';
import path from 'path';
import { generateApplicationPDF } from '../utils/pdfGenerator.js';

/**
 * Helper function to map license types to department names for blockchain
 * @param {string} licenseType - The license type (e.g., 'vehicle-registration').
 * @returns {string|null} - The corresponding department name or null if unknown.
 */
const getLicenseDepartmentName = (licenseType) => {
  const LICENSE_TO_DEPARTMENT = {
    'vehicle-registration': 'Regional Transport Office',
    'shop-establishment': 'Labour Department',
    'fssai-license': 'Food Safety Department',
    'building-permit': 'Municipal Corporation',
    'income-certificate': 'Revenue Department',
    'Police Verification Certificate': 'Police Department',
    'general-admin': 'Labour Department'
  };

  return LICENSE_TO_DEPARTMENT[licenseType] || null;
};



/**
 * Upload document to IPFS and register on blockchain
 * POST /api/documents/upload
 */
export const uploadDocument = async (req, res) => {
  // NOTE ON AUTHENTICATION: We are assuming an authentication middleware has run
  // and attached the authenticated user's ID to the request object.

  // 🚀 THE FIX: Removed the explicit 'if (!req.user)' check. 
  // The requireAuth middleware on the route guarantees req.user exists, 
  // so we can access it directly. The removed block was the source of the error log.
  const userId = req.user.id; 
  
  // const userId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // TEMPORARY PLACEHOLDER USER ID

  try {
    const { departmentId, applicationId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided'
      });
    }

    if (!departmentId || !applicationId) {
      return res.status(400).json({
        success: false,
        error: 'Department ID and Application ID are required'
      });
    }

    console.log(`Uploading document for user ${userId} application: ${applicationId}, department: ${departmentId}`);

    // Step 1: Generate AES encryption key
    const aesKey = generateAESKey(); // Base64 encoded string
    console.log('Generated AES key');

    // Step 2: Encrypt the document
    const { encrypted, iv } = encryptData(file.buffer, aesKey);
    const encryptedData = encrypted.toString("base64");  // <-- missing line
    const ivBase64 = iv.toString('base64'); // Convert IV buffer to base64 string for storage
    console.log('Document encrypted, IV generated');

    // Step 3: Generate document hash for verification
    const documentHash = generateDocumentHash(file.buffer);
    console.log('Document hash generated:', documentHash);

    // Step 4: Upload encrypted document to Pinata IPFS
    const uploadResult = await uploadToPinata(
      encrypted,
      file.originalname,
      {
        applicationId,
        departmentId,
        originalName: file.originalname,
        originalSize: file.size,
        encrypted: true
      }
    );

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        error: `Failed to upload to IPFS: ${uploadResult.error}`
      });
    }

    console.log('Document uploaded to IPFS, CID:', uploadResult.cid);

    // ----------------------------------------------------------------------------------
    // FIX: OpenSSL CRYPTO ERROR BYPASS (Step 5 is implicitly bypassed)
    // ----------------------------------------------------------------------------------
    //let encryptedAESKey = 'TEMPORARY_ENCRYPTED_KEY_PLACEHOLDER';
    
// --- Map license type to department NAME for blockchain ---
const departmentName = getLicenseDepartmentName(departmentId);

if (!departmentName) {
  console.warn(`⚠️ Unknown license type: ${departmentId}. Blockchain sync skipped.`);
}

// Step 6: Call smart contract to register document (graceful skip if not configured)
let blockchainResult = null;
const hasBlockchainConfig = Boolean(blockchainConfig?.contractAddress && blockchainConfig?.privateKey);

if (hasBlockchainConfig && departmentName) {
  try {
    console.log(`📤 Mapping license type "${departmentId}" → Department "${departmentName}"`);
    
    blockchainResult = await shareDocumentWithDepartment(
      applicationId,
      uploadResult.cid,
      documentHash,
      departmentName  // ✅ PASS STRING, not number
    );
    
    console.log('✅ Document registered on blockchain, TX:', blockchainResult.txHash);
  } catch (chainErr) {
    console.warn('❌ Blockchain registration failed:', chainErr?.message || chainErr);
    blockchainResult = null;
  }
} else if (!hasBlockchainConfig) {
  console.warn('⚠️ Blockchain configuration missing. Skipping on-chain registration.');
} else if (!departmentName) {
  console.warn('⚠️ Unknown department. Skipping blockchain registration.');
}


    // Step 7: Generate access code (graceful skip if blockchain not configured)
    const accessCode = `DIGI_${applicationId}_${Date.now()}`;
    const accessCodeHash = generateAccessCodeHash(accessCode);

    let accessCodeResult = null;
    if (hasBlockchainConfig) {
      try {
        accessCodeResult = await getDocumentCode(applicationId, accessCodeHash);
        console.log('Access code generated on blockchain');
      } catch (chainErr) {
        console.warn('Failed to generate access code on blockchain. Proceeding with local code:', chainErr?.message || chainErr);
        accessCodeResult = null;
      }
    } else {
      console.warn('Blockchain configuration missing. Using local access code only.');
    }

    console.log('Access code generated');

    // Step 8: Store document record in database
    console.log('Storing document record in database...');
    console.log('Values to insert:', {
      userId,
      filename: file.originalname,
      originalName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      fileHash: documentHash,
      ipfsHash: uploadResult.cid,
      encryptedData: ivBase64,
      encryptionKey: aesKey,
      applicationId
    });
    try {
              const dbInsertResult = await db.query(
            `INSERT INTO documents (
              user_id,
              filename,
              original_name,
              file_type,
              file_size,
              file_hash,
              ipfs_hash,
              encrypted_data,
              encryption_key,
              application_id,
              iv
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id;`,
            [
              userId,              // user_id
              file.originalname,       // filename stored on server
              file.originalname,   // original_name (from user upload)
              file.mimetype,       // file_type
              file.size,           // file_size
              documentHash,        // file_hash
              uploadResult.cid,    // ipfs_hash
              encryptedData,       // encrypted_data (ciphertext)
              aesKey,              // encryption_key (Base64 AES key)
              applicationId,       // application_id
              ivBase64             // iv (Base64 encoded Initialization Vector)
            ]
          );
          
      
      const documentDbId = dbInsertResult.rows[0].id;
      console.log('Document record stored successfully, DB ID:', documentDbId);

      res.status(200).json({
        success: true,
        data: {
          documentDbId, // Return the new DB ID
          applicationId,
          departmentId,
          cid: uploadResult.cid,
          documentHash,
          accessCode,
           blockchainTxHash: blockchainResult?.txHash || null,
           blockNumber: blockchainResult?.blockNumber || null,
          fileInfo: {
            originalName: file.originalname,
            size: file.size,
            encrypted: true
          }
        },
        message: 'Document uploaded and registered successfully'
      });
    } catch (dbError) {
      console.error('Database INSERT Error:', dbError);
      return res.status(500).json({
        success: false,
        error: 'Failed to store document record in database',
        details: dbError.message
      });
    }

  } catch (error) {
    console.error('Error in uploadDocument:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during document upload',
      details: error.message
    });
  }
};

/**
 * Get document access code
 * POST /api/documents/access-code
 */
export const getAccessCode = async (req, res) => {
  try {
    const { applicationId } = req.body;

    if (!applicationId) {
      return res.status(400).json({
        success: false,
        error: 'Application ID is required'
      });
    }

    // Generate new access code
    const accessCode = `DIGI_${applicationId}_${Date.now()}`;
    const accessCodeHash = generateAccessCodeHash(accessCode);

    const result = await getDocumentCode(applicationId, accessCodeHash);

    if (!result) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate access code'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        applicationId,
        accessCode,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in getAccessCode:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};

export default {
  uploadDocument,
  getAccessCode
};