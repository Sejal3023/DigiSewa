import { ethers } from 'ethers';
import contractABI from '@/contracts/CertificateRegistry.json';

// Contract address - this should be set after deploying the smart contract
// For development, you can deploy to a testnet (Sepolia, Goerli, etc.)
const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000'; // Replace with actual deployed contract address

class BlockchainService {
  private provider: ethers.BrowserProvider | null = null;
  private contract: ethers.Contract | null = null;
  private signer: ethers.Signer | null = null;

  /**
   * Initialize the blockchain connection
   */
  async initialize(): Promise<boolean> {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      
      // Initialize contract with signer for write operations
      this.contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        contractABI.abi,
        this.signer
      );

      return true;
    } catch (error) {
      console.error('Failed to initialize blockchain service:', error);
      return false;
    }
  }

  /**
   * Get connected wallet address
   */
  async getWalletAddress(): Promise<string | null> {
    try {
      if (!this.signer) {
        await this.initialize();
      }
      return this.signer ? await this.signer.getAddress() : null;
    } catch (error) {
      console.error('Error getting wallet address:', error);
      return null;
    }
  }

  /**
   * Issue a certificate on the blockchain
   */
  async issueCertificate(
    applicationId: string,
    ipfsHash: string,
    certificateType: string
  ): Promise<{ txHash: string; success: boolean }> {
    try {
      if (!this.contract) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Failed to initialize blockchain connection');
        }
      }

      // Call the smart contract function
      const tx = await this.contract!.issueCertificate(
        applicationId,
        ipfsHash,
        certificateType
      );

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      return {
        txHash: receipt.hash,
        success: receipt.status === 1
      };
    } catch (error: any) {
      console.error('Error issuing certificate:', error);
      throw new Error(error.message || 'Failed to issue certificate on blockchain');
    }
  }

  /**
   * Verify a certificate on the blockchain
   */
  async verifyCertificate(applicationId: string): Promise<{
    isValid: boolean;
    ipfsHash: string;
    certificateType: string;
    issuedBy: string;
    issuedAt: number;
  } | null> {
    try {
      if (!this.contract) {
        await this.initialize();
      }

      const result = await this.contract!.verifyCertificate(applicationId);

      return {
        isValid: result[0],
        ipfsHash: result[1],
        certificateType: result[2],
        issuedBy: result[3],
        issuedAt: Number(result[4])
      };
    } catch (error) {
      console.error('Error verifying certificate:', error);
      return null;
    }
  }

  /**
   * Revoke a certificate on the blockchain
   */
  async revokeCertificate(applicationId: string): Promise<{ txHash: string; success: boolean }> {
    try {
      if (!this.contract) {
        await this.initialize();
      }

      const tx = await this.contract!.revokeCertificate(applicationId);
      const receipt = await tx.wait();

      return {
        txHash: receipt.hash,
        success: receipt.status === 1
      };
    } catch (error: any) {
      console.error('Error revoking certificate:', error);
      throw new Error(error.message || 'Failed to revoke certificate');
    }
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string) {
    try {
      if (!this.provider) {
        await this.initialize();
      }

      return await this.provider!.getTransactionReceipt(txHash);
    } catch (error) {
      console.error('Error getting transaction receipt:', error);
      return null;
    }
  }

  /**
   * Listen to certificate issued events
   */
  onCertificateIssued(callback: (applicationId: string, ipfsHash: string, issuedBy: string) => void) {
    if (!this.contract) {
      console.error('Contract not initialized');
      return;
    }

    this.contract.on('CertificateIssued', (applicationId, ipfsHash, certificateType, issuedBy) => {
      callback(applicationId, ipfsHash, issuedBy);
    });
  }

  /**
   * Check if wallet is authorized issuer
   */
  async isAuthorizedIssuer(address: string): Promise<boolean> {
    try {
      if (!this.contract) {
        await this.initialize();
      }

      return await this.contract!.authorizedIssuers(address);
    } catch (error) {
      console.error('Error checking issuer authorization:', error);
      return false;
    }
  }
}

export const blockchainService = new BlockchainService();
