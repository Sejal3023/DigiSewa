// backend/src/config/ipfs.js
import axios from 'axios';

const IPFS_SERVICE = {
  // Upload endpoints (anonymous, no auth)
  UPLOAD_ENDPOINTS: [
    'https://ipfs.infura.io:5001',
    'https://api.web3.storage',
    'https://pin.crustcode.com/psa'
  ],
  
  // Download gateways
  DOWNLOAD_GATEWAYS: [
    'https://ipfs.io',
    'https://gateway.ipfs.io', 
    'https://dweb.link',
    'https://cf-ipfs.com'
  ],
  
  /**
   * Store file on IPFS using public endpoints
   */
  storeFile: async function(fileBuffer, fileName) {
    // Dynamic import for FormData (ES modules compatible)
    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    formData.append('file', fileBuffer, fileName);
    
    // Try each endpoint until one works
    for (const endpoint of this.UPLOAD_ENDPOINTS) {
      try {
        const response = await axios.post(`${endpoint}/api/v0/add`, formData, {
          headers: formData.getHeaders(),
          timeout: 10000
        });
        
        if (response.data && response.data.Hash) {
          console.log(`Upload successful via ${endpoint}, CID: ${response.data.Hash}`);
          return response.data.Hash;
        }
      } catch (error) {
        console.warn(`Endpoint ${endpoint} failed:`, error.message);
        continue;
      }
    }
    
    throw new Error('All IPFS upload endpoints failed');
  },
  
  /**
   * Retrieve file from IPFS using public gateways
   */
  retrieveFile: async function(cid) {
    // Try each gateway until one works
    for (const gateway of this.DOWNLOAD_GATEWAYS) {
      try {
        const response = await axios.get(`${gateway}/ipfs/${cid}`, {
          responseType: 'arraybuffer',
          timeout: 10000
        });
        
        console.log(`Download successful via ${gateway}, CID: ${cid}`);
        return Buffer.from(response.data);
      } catch (error) {
        console.warn(`Gateway ${gateway} failed:`, error.message);
        continue;
      }
    }
    
    throw new Error('All IPFS gateways failed');
  }
};

export default IPFS_SERVICE;