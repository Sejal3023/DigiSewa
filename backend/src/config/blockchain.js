// backend/src/config/blockchain.js
// Blockchain Configuration - FIXED with default export

import dotenv from "dotenv";

// ✅ Load .env at the very beginning
dotenv.config();

// Debug blockchain environment variables
console.log('🔗 Blockchain Environment Variables:');
console.log('BLOCKCHAIN_RPC_URL:', process.env.BLOCKCHAIN_RPC_URL || 'not set');
console.log('CONTRACT_ADDRESS:', process.env.CONTRACT_ADDRESS || 'not set');
console.log('BLOCKCHAIN_PRIVATE_KEY:', process.env.BLOCKCHAIN_PRIVATE_KEY ? '*** (set)' : 'not set');
console.log('BLOCKCHAIN_CHAIN_ID:', process.env.BLOCKCHAIN_CHAIN_ID || 'not set');
console.log('---');

const blockchainConfig = {
  provider: process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545',
  contractAddress: process.env.CONTRACT_ADDRESS,
  privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY,
  chainId: process.env.BLOCKCHAIN_CHAIN_ID || 11155111, // Sepolia
};

// Add this line for default export
export default blockchainConfig;