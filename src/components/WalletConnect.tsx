import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, Copy, ExternalLink, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    ethereum?: any;
  }
}

const WalletConnect = () => {
  const { toast } = useToast();
  const [account, setAccount] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [balance, setBalance] = useState<string>("");
  const [chainId, setChainId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWalletFromBackend();
  }, []);

  const loadWalletFromBackend = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('wallet-proxy', {
        method: 'GET',
      });

      if (error) {
        console.error('Error loading wallet:', error);
        setIsLoading(false);
        return;
      }

      if (data?.wallet) {
        setAccount(data.wallet.wallet_address);
        setBalance(data.wallet.balance || '0');
        setChainId(data.wallet.chain_id);
      }
    } catch (error) {
      console.error('Error loading wallet from backend:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast({
        title: "MetaMask not found",
        description: "Please install MetaMask to connect your wallet",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    
    try {
      // Get wallet address from MetaMask
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const walletAddress = accounts[0];
      
      // Get chain ID
      const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
      
      // Get balance
      const balanceHex = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [walletAddress, 'latest']
      });
      const balanceEth = (parseInt(balanceHex, 16) / Math.pow(10, 18)).toFixed(4);

      // Store wallet info in backend
      const { data, error } = await supabase.functions.invoke('wallet-proxy', {
        body: {
          walletAddress,
          chainId: chainIdHex,
          balance: balanceEth,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to connect wallet to backend');
      }

      setAccount(walletAddress);
      setBalance(balanceEth);
      setChainId(chainIdHex);
      
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to MetaMask via backend proxy",
      });
    } catch (error: any) {
      console.error('Connect wallet error:', error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      const { error } = await supabase.functions.invoke('wallet-proxy', {
        method: 'DELETE',
      });

      if (error) {
        throw new Error(error.message);
      }

      setAccount("");
      setBalance("");
      setChainId("");
      
      toast({
        title: "Wallet Disconnected",
        description: "Successfully disconnected from backend",
      });
    } catch (error: any) {
      console.error('Disconnect wallet error:', error);
      toast({
        title: "Disconnection Failed",
        description: error.message || "Failed to disconnect wallet",
        variant: "destructive"
      });
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(account);
    toast({
      title: "Address Copied",
      description: "Wallet address copied to clipboard",
    });
  };

  const getChainName = (chainId: string) => {
    switch (chainId) {
      case '0x1':
        return 'Ethereum Mainnet';
      case '0x5':
        return 'Goerli Testnet';
      case '0xaa36a7':
        return 'Sepolia Testnet';
      case '0x89':
        return 'Polygon Mainnet';
      default:
        return 'Unknown Network';
    }
  };

  return (
    <Card className="shadow-corporate">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          Blockchain Wallet (Backend Proxy)
        </CardTitle>
        <CardDescription>
          Connect your MetaMask wallet - managed securely through backend proxy
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading wallet...</p>
          </div>
        ) : !account ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Connect Your Wallet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connect your MetaMask wallet - all data is securely stored in the backend
              </p>
              <Button 
                onClick={connectWallet} 
                disabled={isConnecting}
                className="w-full"
              >
                <Wallet className="h-4 w-4 mr-2" />
                {isConnecting ? "Connecting..." : "Connect via Backend"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span className="font-semibold">Connected</span>
              </div>
              <Button variant="outline" size="sm" onClick={disconnectWallet}>
                Disconnect
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Wallet Address</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={copyAddress}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => window.open(`https://etherscan.io/address/${account}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium">Balance</p>
                  <p className="text-xs text-muted-foreground">{balance} ETH</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium">Network</p>
                  <Badge variant="outline" className="text-xs">
                    {getChainName(chainId)}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground text-center">
                🔒 Wallet data secured via backend proxy - certificates verified on blockchain
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WalletConnect;