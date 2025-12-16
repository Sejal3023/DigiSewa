// backend/scripts/check-balance.cjs
const { ethers } = require("ethers");
require("dotenv").config();

async function checkBalance() {
  const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
  const wallet = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY, provider);
  
  const balance = await provider.getBalance(wallet.address);
  console.log("Wallet address:", wallet.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
}

checkBalance().catch(console.error);