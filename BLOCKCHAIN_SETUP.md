# Blockchain Integration Setup Guide

This guide explains how to deploy and configure the smart contract for the Government Digital Services Platform.

## Prerequisites

1. **MetaMask Wallet**: Install MetaMask browser extension
2. **Test ETH**: Get testnet ETH from a faucet (for Sepolia testnet)
3. **Node.js & npm**: For running deployment scripts

## Smart Contract Deployment

### Option 1: Deploy using Remix IDE (Recommended for beginners)

1. **Open Remix IDE**: Go to https://remix.ethereum.org/

2. **Create Contract File**:
   - Create a new file named `CertificateRegistry.sol`
   - Copy the contract code from `src/contracts/CertificateRegistry.sol`

3. **Compile the Contract**:
   - Go to the "Solidity Compiler" tab
   - Select compiler version `0.8.0` or higher
   - Click "Compile CertificateRegistry.sol"

4. **Deploy the Contract**:
   - Go to the "Deploy & Run Transactions" tab
   - Select "Injected Provider - MetaMask" as the environment
   - Make sure you're connected to Sepolia testnet in MetaMask
   - Click "Deploy"
   - Confirm the transaction in MetaMask
   - **Save the deployed contract address**

5. **Authorize Issuers** (Optional):
   - After deployment, you can authorize additional wallet addresses to issue certificates
   - Call the `authorizeIssuer` function with the wallet address

### Option 2: Deploy using Hardhat

```bash
# Install dependencies
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

# Initialize Hardhat project
npx hardhat

# Create deployment script
# scripts/deploy.js
const hre = require("hardhat");

async function main() {
  const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
  const registry = await CertificateRegistry.deploy();
  await registry.deployed();
  
  console.log("CertificateRegistry deployed to:", registry.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

# Deploy to Sepolia testnet
npx hardhat run scripts/deploy.js --network sepolia
```

## Configuration

### 1. Update Contract Address

After deploying, update the contract address in `src/services/blockchainService.ts`:

```typescript
const CONTRACT_ADDRESS = 'YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE';
```

### 2. Network Configuration

The current implementation is configured for Sepolia testnet. For other networks:

1. Update the RPC endpoints in the blockchain service
2. Update the explorer URLs in `BlockchainStatus.tsx`

Supported networks:
- **Sepolia Testnet** (Recommended for testing)
  - Chain ID: 11155111
  - Explorer: https://sepolia.etherscan.io/
  - Faucet: https://sepoliafaucet.com/

- **Ethereum Mainnet** (Production)
  - Chain ID: 1
  - Explorer: https://etherscan.io/

- **Polygon Mumbai** (Alternative testnet)
  - Chain ID: 80001
  - Explorer: https://mumbai.polygonscan.com/

### 3. Get Test ETH

For Sepolia testnet:
1. Go to https://sepoliafaucet.com/
2. Enter your wallet address
3. Request test ETH (you'll need it for gas fees)

## Usage

### Issue Certificate on Blockchain

When an admin approves an application, they can optionally issue it on the blockchain:

```typescript
import { useBlockchain } from '@/hooks/useBlockchain';

const { issueCertificateOnChain, loading } = useBlockchain();

// Issue certificate
const result = await issueCertificateOnChain(
  applicationId,
  'Business License',
  ipfsHash // optional
);
```

### Verify Certificate

```typescript
const { verifyCertificateOnChain } = useBlockchain();

const certData = await verifyCertificateOnChain(applicationId);
if (certData?.isValid) {
  console.log('Certificate is valid!', certData);
}
```

### Revoke Certificate

```typescript
const { revokeCertificateOnChain } = useBlockchain();

const success = await revokeCertificateOnChain(applicationId);
```

## Smart Contract Functions

### Public Functions

1. **issueCertificate(applicationId, ipfsHash, certificateType)**
   - Issues a new certificate
   - Only authorized issuers can call
   - Emits `CertificateIssued` event

2. **verifyCertificate(applicationId)**
   - Verifies a certificate
   - Returns certificate details
   - Anyone can call (view function)

3. **revokeCertificate(applicationId)**
   - Revokes a certificate
   - Only authorized issuers can call
   - Emits `CertificateRevoked` event

### Admin Functions (Owner Only)

1. **authorizeIssuer(address)**
   - Authorize a new wallet to issue certificates

2. **revokeIssuer(address)**
   - Remove issuer authorization

## Security Considerations

1. **Private Keys**: Never share or commit private keys
2. **Gas Fees**: Always have sufficient ETH for gas
3. **Network**: Test thoroughly on testnet before mainnet
4. **Authorization**: Only authorize trusted wallets as issuers
5. **Verification**: Always verify transactions on the blockchain explorer

## Troubleshooting

### MetaMask Not Connecting
- Ensure MetaMask is installed
- Check you're on the correct network
- Refresh the page and try reconnecting

### Transaction Failed
- Check you have enough ETH for gas
- Verify you're on the correct network
- Check if the wallet is authorized (for issuing)

### Contract Not Found
- Verify the contract address is correct
- Ensure you're on the same network as deployment
- Check the contract was successfully deployed

## Additional Resources

- [Ethereum Documentation](https://ethereum.org/developers)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [MetaMask Documentation](https://docs.metamask.io/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Remix IDE Documentation](https://remix-ide.readthedocs.io/)

## Cost Estimates (Sepolia Testnet)

- Deploy Contract: ~0.01 ETH (testnet - FREE)
- Issue Certificate: ~0.0001 - 0.0005 ETH per transaction
- Verify Certificate: FREE (read-only operation)
- Revoke Certificate: ~0.0001 - 0.0005 ETH per transaction

**Note**: Mainnet costs will be significantly higher. Consider using Layer 2 solutions (Polygon, Arbitrum, Optimism) for lower gas fees in production.
