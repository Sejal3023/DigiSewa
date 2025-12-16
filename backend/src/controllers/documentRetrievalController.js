import { downloadFromPinata, decryptData } from '../services/pinataService.js';
import { getDocumentCID, verifyDocument } from '../blockchain/blockchainService.js';
import crypto from 'crypto';

/**
 * Retrieve document using access code
 * POST /api/documents/retrieve
 */
export const retrieveDocument = async (req, res) => {
  try {
    const { applicationId, accessCode } = req.body;

    if (!applicationId || !accessCode) {
      return res.status(400).json({
        success: false,
        error: 'Application ID and access code are required'
      });
    }

    console.log(`Retrieving document for application: ${applicationId}`);

    // Step 1: Generate access code hash
    const accessCodeHash = crypto.createHash('sha256').update(accessCode).digest('hex');

    // Step 2: Call smart contract to get encrypted CID
    const encryptedCID = await getDocumentCID(applicationId, accessCodeHash);

    if (!encryptedCID) {
      return res.status(403).json({
        success: false,
        error: 'Invalid access code or document not found'
      });
    }

    console.log('Retrieved encrypted CID from blockchain:', encryptedCID);

    // Step 3: Download encrypted document from IPFS
    const downloadResult = await downloadFromPinata(encryptedCID);

    if (!downloadResult.success) {
      return res.status(500).json({
        success: false,
        error: `Failed to download from IPFS: ${downloadResult.error}`
      });
    }

    console.log('Document downloaded from IPFS');

    // Step 4: Decrypt the document
    // In a real implementation, you would:
    // 1. Get the encrypted AES key from database
    // 2. Decrypt it with department's private key
    // 3. Use the AES key to decrypt the document
    
    // For now, we'll return the encrypted data and let the frontend handle decryption
    // or implement a simplified decryption process

    // Step 5: Verify document integrity (optional)
    const documentHash = crypto.createHash('sha256').update(downloadResult.data).digest('hex');
    const isValid = await verifyDocument(applicationId, documentHash);

    res.status(200).json({
      success: true,
      data: {
        applicationId,
        cid: encryptedCID,
        documentData: downloadResult.data.toString('base64'),
        documentHash,
        isValid,
        retrievedAt: new Date().toISOString()
      },
      message: 'Document retrieved successfully'
    });

  } catch (error) {
    console.error('Error in retrieveDocument:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during document retrieval',
      details: error.message
    });
  }
};

/**
 * Verify document integrity
 * POST /api/documents/verify
 */
export const verifyDocumentIntegrity = async (req, res) => {
  try {
    const { applicationId, documentHash } = req.body;

    if (!applicationId || !documentHash) {
      return res.status(400).json({
        success: false,
        error: 'Application ID and document hash are required'
      });
    }

    const isValid = await verifyDocument(applicationId, documentHash);

    res.status(200).json({
      success: true,
      data: {
        applicationId,
        documentHash,
        isValid,
        verifiedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in verifyDocumentIntegrity:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during verification',
      details: error.message
    });
  }
};

/**
 * Get document information
 * GET /api/documents/info/:applicationId
 */
export const getDocumentInfo = async (req, res) => {
  try {
    const { applicationId } = req.params;

    if (!applicationId) {
      return res.status(400).json({
        success: false,
        error: 'Application ID is required'
      });
    }

    // Get document info from blockchain
    const { getDocumentInfo: getDocInfo } = await import('../blockchain/blockchainService.js');
    const docInfo = await getDocInfo(applicationId);

    if (!docInfo) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        applicationId,
        encryptedCID: docInfo.encryptedCID,
        documentHash: docInfo.documentHash,
        departmentId: docInfo.departmentId,
        timestamp: docInfo.timestamp,
        isActive: docInfo.isActive
      }
    });

  } catch (error) {
    console.error('Error in getDocumentInfo:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};

/**
 * Decrypt document data (for departments with proper keys)
 * POST /api/documents/decrypt
 */
export const decryptDocument = async (req, res) => {
  try {
    const { encryptedData, aesKey, iv } = req.body;

    if (!encryptedData || !aesKey) {
      return res.status(400).json({
        success: false,
        error: 'Encrypted data and AES key are required'
      });
    }

    // Decrypt the document
    const decryptedData = decryptData(
      Buffer.from(encryptedData, 'base64'),
      aesKey,
      iv ? Buffer.from(iv, 'base64') : null
    );

    res.status(200).json({
      success: true,
      data: {
        decryptedData: decryptedData.toString('base64'),
        size: decryptedData.length
      }
    });

  } catch (error) {
    console.error('Error in decryptDocument:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to decrypt document',
      details: error.message
    });
  }
};

export const getDocumentsForUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT 
        id,
        original_name,
        ipfs_hash,
        file_size,
        created_at,
        application_id,
        status,
        CASE WHEN encryption_key IS NOT NULL THEN true ELSE false END as encrypted
      FROM documents
      WHERE user_id = $1
      ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        documents: result.rows
      }
    });
  } catch (error) {
    console.error('Error fetching user documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documents'
    });
  }
};

export default {
  retrieveDocument,
  verifyDocumentIntegrity,
  getDocumentInfo,
  decryptDocument,
  getDocumentsForUser
};

