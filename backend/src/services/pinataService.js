import crypto from 'crypto';
import FormData from 'form-data';
import axios from 'axios'; 

// Pinata API configuration from environment variables
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;
const PINATA_JWT = process.env.PINATA_JWT;

const PINATA_API_URL = 'https://api.pinata.cloud';
export const PINATA_GATEWAY_URL = 'https://gateway.pinata.cloud/ipfs';
// NEW (no rate limits for reading):
//export const PINATA_GATEWAY_URL = 'https://ipfs.io/ipfs';



export const NETWORK_CONFIG = {
  timeout: 60000, // 60 seconds
  maxRetries: 15,
  retryDelay: 20000 // 20 seconds
};


if (!PINATA_JWT) {
  console.warn('⚠️ WARNING: PINATA_JWT environment variable is not set!');
} else {
  console.log('✅ PINATA_JWT is set, proceeding with upload.');
}

/**
 * Upload file to Pinata IPFS using Axios
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {string} fileName - The name of the file
 * @param {Object} metadata - Optional metadata
 * @returns {Promise<Object>} - Returns { success: boolean, cid: string, error?: string }
 */
export const uploadToPinata = async (fileBuffer, fileName, metadata = {}) => {
  try {
    const formData = new FormData();

    // Recreating the buffer and appending to FormData
    formData.append('file', Buffer.from(fileBuffer), {
      filename: fileName,
      contentType: 'application/octet-stream'
    });

    // --- CRITICAL FIX: Strictly filter and convert metadata values to strings or numbers ---
    const filteredMetadataKeyValues = {};
    for (const key in metadata) {
        const value = metadata[key];
        const type = typeof value;
        
        if (type === 'string' || type === 'number') {
            // Keep strings and numbers as is
            filteredMetadataKeyValues[key] = value;
        } else if (type === 'boolean') {
            // Safest way to ensure Pinata accepts booleans is to convert them to strings
            filteredMetadataKeyValues[key] = value.toString(); 
        } 
        // All other types (object, undefined, function, symbol) are automatically ignored
    }
    // --------------------------------------------------------------------------------------

    // Add metadata
    const pinataMetadata = {
      name: fileName,
      keyvalues: {
        ...filteredMetadataKeyValues, // Use the strictly filtered object here
        uploadedAt: new Date().toISOString(),
        source: 'DigiSewa'
      }
    };
    // Append JSON metadata as a string part
    formData.append('pinataMetadata', JSON.stringify(pinataMetadata));

    // Add pinata options
    const pinataOptions = {
      cidVersion: 1,
      wrapWithDirectory: false
    };
    // Append JSON options as a string part
    formData.append('pinataOptions', JSON.stringify(pinataOptions));
    
    // Get headers, specifically the Content-Type with boundary, from FormData
    const formHeaders = formData.getHeaders();
    
    // Using Axios for a stable multipart upload
    const response = await axios.post(`${PINATA_API_URL}/pinning/pinFileToIPFS`, formData, {
      maxBodyLength: Infinity, // Important for large files
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`,
        ...formHeaders // Include Content-Type with boundary
      },
    });

    const result = response.data;
    
    return {
      success: true,
      cid: result.IpfsHash,
      size: result.PinSize,
      timestamp: result.Timestamp
    };

  } catch (error) {
    // Axios error handling often nests the response in error.response
    const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error('Error uploading to Pinata:', errorMessage);
    
    return {
      success: false,
      error: errorMessage // Return the Pinata error message directly
    };
  }
};
/**
 * Download file from Pinata IPFS
 * @param {string} cid - The IPFS CID
 * @returns {Promise<Object>} - Returns { success: boolean, data?: Buffer, error?: string }
 */
export const downloadFromPinata = async (cid) => {
  try {
    console.log(`Downloading file from Pinata with CID: ${cid}`);
    
    const response = await axios.get(`${PINATA_GATEWAY_URL}/${cid}`, {
      timeout: NETWORK_CONFIG.timeout,
      responseType: 'arraybuffer',
      headers: {
        'Accept': 'application/octet-stream'
      }
    });

    if (response.status !== 200) {
      throw new Error(`Failed to download from IPFS: ${response.status} - ${response.statusText}`);
    }

    console.log(`Download successful for CID: ${cid}`);
    return {
      success: true,
      data: Buffer.from(response.data)
    };

  } catch (error) {
    console.error('Error downloading from Pinata:', error);
    
    let errorMessage = error.message;
    if (error.response?.status === 404) {
      errorMessage = `File not found on IPFS for CID: ${cid}`;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Get file metadata from Pinata using Axios
 * @param {string} cid - The IPFS CID
 * @returns {Promise<Object>} - Returns file metadata
 */
export const getFileMetadata = async (cid) => {
  try {
    const response = await axios.get(`${PINATA_API_URL}/data/pinList?hashContains=${cid}`, {
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`
      }
    });

    if (response.status !== 200) {
      throw new Error(`Failed to get metadata: ${response.status}`);
    }

    return response.data;

  } catch (error) {
    const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error('Error getting file metadata:', errorMessage);
    return null;
  }
};

/**
 * Generate AES-256 encryption key
 * @returns {string} - Base64 encoded encryption key
 */
export const generateAESKey = () => {
  return crypto.randomBytes(32).toString('base64');
};

/**
 * Encrypt data with AES-256-GCM (to match frontend)
 * @param {Buffer} data - Data to encrypt
 * @param {string} key - Base64 encoded encryption key
 * @returns {Object} - { encrypted: Buffer, iv: Buffer }
 */
export const encryptData = (data, key) => {
  const iv = crypto.randomBytes(12);  // ✅ GCM uses 12 bytes
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'base64'), iv);  // ✅ GCM
  
  let encrypted = cipher.update(data);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();  // ✅ GCM has authTag
  
  // ✅ Format: [IV (12 bytes)][Ciphertext][Auth Tag (16 bytes)]
  const combined = Buffer.concat([iv, encrypted, authTag]);
  
  return {
    encrypted: combined,
    iv
  };
};


/**
 * Decrypt data with AES-256-GCM
 * @param {Buffer} encryptedData - Encrypted data ([IV][Ciphertext][AuthTag])
 * @param {string} key - Base64 encoded encryption key
 * @param {Buffer} iv - Not used (IV is in encryptedData)
 * @returns {Buffer} - Decrypted data
 */
export const decryptData = (encryptedData, key, iv) => {
  // Extract components from combined data
  const extractedIV = encryptedData.slice(0, 12);
  const authTag = encryptedData.slice(encryptedData.length - 16);
  const ciphertext = encryptedData.slice(12, encryptedData.length - 16);
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key, 'base64'), extractedIV);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(ciphertext);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted;
};


/**
 * Generate document hash for verification
 * @param {Buffer} data - Document data
 * @returns {string} - SHA-256 hash
 */
export const generateDocumentHash = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Generate access code hash
 * @param {string} accessCode - The access code
 * @returns {string} - SHA-256 hash
 */
export const generateAccessCodeHash = (accessCode) => {
  return crypto.createHash('sha256').update(accessCode).digest('hex');
};

export default {
  uploadToPinata,
  downloadFromPinata,
  getFileMetadata,
  generateAESKey,
  encryptData,
  decryptData,
  generateDocumentHash,
  generateAccessCodeHash
};  