import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { blockchainService } from '@/services/blockchainService';
import { Blocks, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

interface BlockchainStatusProps {
  applicationId?: string;
  txHash?: string;
  ipfsHash?: string;
}

export function BlockchainStatus({ applicationId, txHash, ipfsHash }: BlockchainStatusProps) {
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (applicationId) {
      verifyOnChain();
    }
  }, [applicationId]);

  const verifyOnChain = async () => {
    if (!applicationId) return;

    setLoading(true);
    try {
      const result = await blockchainService.verifyCertificate(applicationId);
      setVerificationStatus(result);
    } catch (error) {
      console.error('Verification error:', error);
      toast({
        title: "Verification Failed",
        description: "Could not verify certificate on blockchain.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getExplorerUrl = (hash: string, type: 'tx' | 'address') => {
    // This should be configured based on the network
    // For Sepolia testnet:
    return `https://sepolia.etherscan.io/${type}/${hash}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Blocks className="h-5 w-5" />
          Blockchain Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {txHash && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Transaction Hash</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-muted rounded text-xs break-all">
                {txHash}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(getExplorerUrl(txHash, 'tx'), '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {ipfsHash && (
          <div className="space-y-2">
            <p className="text-sm font-medium">IPFS Hash</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-muted rounded text-xs break-all">
                {ipfsHash}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(`https://ipfs.io/ipfs/${ipfsHash}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {verificationStatus && (
          <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">On-Chain Status</span>
              {verificationStatus.isValid ? (
                <Badge className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Valid
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Invalid/Not Found
                </Badge>
              )}
            </div>

            {verificationStatus.isValid && (
              <>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium">{verificationStatus.certificateType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Issued By:</span>
                    <span className="font-mono text-xs">
                      {verificationStatus.issuedBy.slice(0, 6)}...{verificationStatus.issuedBy.slice(-4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Issued At:</span>
                    <span>{new Date(verificationStatus.issuedAt * 1000).toLocaleDateString()}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {applicationId && !verificationStatus && (
          <Button
            onClick={verifyOnChain}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? 'Verifying...' : 'Verify on Blockchain'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
