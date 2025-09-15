import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CardPaymentProps {
  amount: number;
  onPaymentSuccess: (transactionId: string) => void;
  onCancel: () => void;
}

export const CardPayment = ({ amount, onPaymentSuccess, onCancel }: CardPaymentProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    holderName: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = cleaned.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return cleaned;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.length <= 19) { // 16 digits + 3 spaces
      handleInputChange('cardNumber', formatted);
    }
  };

  const handlePayment = async () => {
    if (!formData.cardNumber || !formData.expiryMonth || !formData.expiryYear || !formData.cvv || !formData.holderName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all card details",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    // Mock payment processing
    await new Promise(resolve => setTimeout(resolve, 3000));

    const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    toast({
      title: "Payment Successful!",
      description: `Transaction ID: ${transactionId}`,
    });

    setIsProcessing(false);
    onPaymentSuccess(transactionId);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Card Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">Amount to Pay</p>
          <p className="text-2xl font-bold">₹{amount}</p>
        </div>

        <div>
          <Label htmlFor="cardNumber">Card Number</Label>
          <Input
            id="cardNumber"
            placeholder="1234 5678 9123 4567"
            value={formData.cardNumber}
            onChange={handleCardNumberChange}
            maxLength={19}
          />
        </div>

        <div>
          <Label htmlFor="holderName">Cardholder Name</Label>
          <Input
            id="holderName"
            placeholder="John Doe"
            value={formData.holderName}
            onChange={(e) => handleInputChange('holderName', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="expiryMonth">Month</Label>
            <Select onValueChange={(value) => handleInputChange('expiryMonth', value)}>
              <SelectTrigger>
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i} value={String(i + 1).padStart(2, '0')}>
                    {String(i + 1).padStart(2, '0')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="expiryYear">Year</Label>
            <Select onValueChange={(value) => handleInputChange('expiryYear', value)}>
              <SelectTrigger>
                <SelectValue placeholder="YY" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => (
                  <SelectItem key={i} value={String(new Date().getFullYear() + i).slice(-2)}>
                    {String(new Date().getFullYear() + i).slice(-2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="cvv">CVV</Label>
            <Input
              id="cvv"
              placeholder="123"
              value={formData.cvv}
              onChange={(e) => {
                if (e.target.value.length <= 4) {
                  handleInputChange('cvv', e.target.value.replace(/[^0-9]/g, ''));
                }
              }}
              maxLength={4}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
          <Lock className="h-4 w-4 text-green-600" />
          <p className="text-xs text-green-700">Your payment information is secure and encrypted</p>
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