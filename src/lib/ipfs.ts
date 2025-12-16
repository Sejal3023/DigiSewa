import { create } from 'ipfs-http-client';

// Configuration for different IPFS services
const IPFS_CONFIG = {
  local: { 
    url: 'http://localhost:5001/api/v0',
    free: true 
  },
  infura: { 
    url: 'https://ipfs.infura.io:5001/api/v0',
    free: true,
    auth: {
      username: process.env.INFURA_IPFS_PROJECT_ID || '',
      password: process.env.INFURA_IPFS_PROJECT_SECRET || ''
    }
  }
};

const getIPFSClient = () => {
  try {
    // Try Infura first (more reliable for production)
    if (process.env.INFURA_IPFS_PROJECT_ID && process.env.INFURA_IPFS_PROJECT_SECRET) {
      return create({
        host: 'ipfs.infura.io',
        port: 5001,
        protocol: 'https',
        headers: {
          authorization: `Basic ${btoa(
            `${process.env.INFURA_IPFS_PROJECT_ID}:${process.env.INFURA_IPFS_PROJECT_SECRET}`
          )}`
        }
      });
    }
    
    // Fallback to local node
    return create({ url: IPFS_CONFIG.local.url });
  } catch (error) {
    console.warn('IPFS client creation failed:', error);
    throw new Error('IPFS client initialization failed');
  }
};

const ipfs = getIPFSClient();

export const uploadToIPFS = async (data: Uint8Array): Promise<string> => {
  try {
    // Ensure we have a Uint8Array (not ArrayBuffer)
    const dataToUpload = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
    
    const { cid } = await ipfs.add(dataToUpload);
    return cid.toString();
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw new Error(`IPFS upload failed: ${error.message}`);
  }
};

export const getIPFSGatewayURL = (cid: string): string => {
  return `https://ipfs.io/ipfs/${cid}`;
};

export const uploadEncryptedFile = async (
  encryptedData: ArrayBuffer, 
  iv: Uint8Array, 
  mimeType: string
): Promise<{ cid: string; iv: string; mimeType: string }> => {
  // Convert ArrayBuffer to Uint8Array for IPFS
  const encryptedArray = new Uint8Array(encryptedData);
  
  // Upload the encrypted data
  const dataCid = await uploadToIPFS(encryptedArray);
  
  return {
    cid: dataCid,
    iv: uint8ArrayToBase64(iv), // Use the helper function from utils.ts
    mimeType
  };
};