// backend/src/config/index.js
//import IPFS_SERVICE from './ipfs.js';

// Since we can't use top-level await with regular imports,
// we'll use a function to handle the dynamic imports
async function loadConfig() {
  try {
    // Dynamic imports for CommonJS files
    const blockchain = (await import('./blockchain.js')).default;
    const database = (await import('../../config/database.js')).default;
    
    return {
      //ipfsServices: IPFS_SERVICE,
      blockchain,
      database,
    };
  } catch (error) {
    console.error('Error loading configuration:', error);
    throw error;
  }
}

// Export a promise that resolves to the config
export default loadConfig();
