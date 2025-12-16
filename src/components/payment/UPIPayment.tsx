import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Smartphone, QrCode, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UPIPaymentProps {
  amount: number;
  onPaymentSuccess: (transactionId: string) => void;
  onCancel: () => void;
}

export const UPIPayment = ({ amount, onPaymentSuccess, onCancel }: UPIPaymentProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'upi-id' | 'qr-code'>('upi-id');
  const [upiId, setUpiId] = useState('');

  const upiApps = [
    { name: 'Google Pay', color: 'bg-blue-500' },
    { name: 'PhonePe', color: 'bg-purple-500' },
    { name: 'Paytm', color: 'bg-blue-600' },
    { name: 'BHIM UPI', color: 'bg-orange-500' },
  ];

  const handlePayment = async () => {
    if (selectedMethod === 'upi-id' && !upiId) {
      toast({
        title: "Missing UPI ID",
        description: "Please enter your UPI ID",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    // Mock payment processing
    await new Promise(resolve => setTimeout(resolve, 3000));

    const transactionId = `UPI${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    toast({
      title: "Payment Successful!",
      description: `UPI Transaction ID: ${transactionId}`,
    });

    setIsProcessing(false);
    onPaymentSuccess(transactionId);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          UPI Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">Amount to Pay</p>
          <p className="text-2xl font-bold">₹{amount}</p>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-medium">Choose Payment Method:</p>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={selectedMethod === 'upi-id' ? 'default' : 'outline'}
              className="h-16 flex-col"
              onClick={() => setSelectedMethod('upi-id')}
            >
              <Smartphone className="h-6 w-6 mb-1" />
              <span className="text-xs">UPI ID</span>
            </Button>
            <Button
              variant={selectedMethod === 'qr-code' ? 'default' : 'outline'}
              className="h-16 flex-col"
              onClick={() => setSelectedMethod('qr-code')}
            >
              <QrCode className="h-6 w-6 mb-1" />
              <span className="text-xs">QR Code</span>
            </Button>
          </div>
        </div>

        {selectedMethod === 'upi-id' && (
          <div>
            <Label htmlFor="upiId">UPI ID</Label>
            <Input
              id="upiId"
              placeholder="yourname@paytm / yourname@oksbi"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter your UPI ID (e.g., 9876543210@paytm)
            </p>
          </div>
        )}

        {selectedMethod === 'qr-code' && (
          <div className="text-center space-y-4">
            <div className="w-48 h-48 mx-auto bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <QrCode className="h-16 w-16 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">QR Code</p>
                <p className="text-xs text-gray-400">₹{amount}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Scan this QR code with any UPI app to pay
            </p>
          </div>
        )}

        <div>
          <p className="text-xs font-medium mb-2">Supported UPI Apps:</p>
          <div className="flex flex-wrap gap-2">
            {upiApps.map((app) => (
              <Badge key={app.name} variant="secondary" className="text-xs">
                {app.name}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
          <Check className="h-4 w-4 text-green-600" />
          <p className="text-xs text-green-700">Secure UPI payment powered by NPCI</p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            className="flex-1" 
            onClick={handlePayment}
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : `Pay ₹${amount}`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};