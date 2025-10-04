import { useState, useCallback } from 'react';
import { blockchainService } from '@/services/blockchainService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function useBlockchain() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const issueCertificateOnChain = useCallback(async (
    applicationId: string,
    licenseType: string,
    ipfsHash?: string
  ): Promise<{ success: boolean; txHash?: string }> => {
    setLoading(true);
    try {
      // Initialize blockchain connection
      const initialized = await blockchainService.initialize();
      if (!initialized) {
        throw new Error('Failed to connect to MetaMask');
      }

      // Use existing IPFS hash or generate a placeholder
      const certIpfsHash = ipfsHash || `ipfs://placeholder-${applicationId}`;

      // Issue certificate on blockchain
      const result = await blockchainService.issueCertificate(
        applicationId,
        certIpfsHash,
        licenseType
      );

      if (result.success) {
        // Update application with blockchain transaction hash
        const { error } = await supabase
          .from('applications')
          .update({ 
            blockchain_tx_hash: result.txHash,
            ipfs_hash: certIpfsHash
          })
          .eq('id', applicationId);

        if (error) {
          console.error('Error updating application with tx hash:', error);
        }

        toast({
          title: "Blockchain Transaction Successful",
          description: "Certificate has been recorded on the blockchain.",
        });

        return { success: true, txHash: result.txHash };
      }

      return { success: false };
    } catch (error: any) {
      console.error('Blockchain error:', error);
      toast({
        title: "Blockchain Error",
        description: error.message || "Failed to record on blockchain",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const verifyCertificateOnChain = useCallback(async (applicationId: string) => {
    setLoading(true);
    try {
      const result = await blockchainService.verifyCertificate(applicationId);
      
      if (result && result.isValid) {
        toast({
          title: "Certificate Verified",
          description: "Certificate is valid on the blockchain.",
        });
        return result;
      } else {
        toast({
          title: "Not Found",
          description: "Certificate not found on blockchain.",
          variant: "destructive",
        });
        return null;
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify certificate",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const revokeCertificateOnChain = useCallback(async (applicationId: string) => {
    setLoading(true);
    try {
      const result = await blockchainService.revokeCertificate(applicationId);
      
      if (result.success) {
        toast({
          title: "Certificate Revoked",
          description: "Certificate has been revoked on the blockchain.",
        });
        return true;
      }
      return false;
    } catch (error: any) {
      toast({
        title: "Revocation Failed",
        description: error.message || "Failed to revoke certificate",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    loading,
    issueCertificateOnChain,
    verifyCertificateOnChain,
    revokeCertificateOnChain
  };
}
