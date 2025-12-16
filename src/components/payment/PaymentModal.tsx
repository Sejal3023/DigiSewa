import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CardPayment } from "./CardPayment";
import { UPIPayment } from "./UPIPayment";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentMethod: 'card' | 'upi' | null;
  amount: number;
  onPaymentSuccess: (transactionId: string) => void;
}

export const PaymentModal = ({ 
  isOpen, 
  onClose, 
  paymentMethod, 
  amount, 
  onPaymentSuccess 
}: PaymentModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
        </DialogHeader>
        {paymentMethod === 'card' && (
          <CardPayment
            amount={amount}
            onPaymentSuccess={onPaymentSuccess}
            onCancel={onClose}
          />
        )}
        {paymentMethod === 'upi' && (
          <UPIPayment
            amount={amount}
            onPaymentSuccess={onPaymentSuccess}
            onCancel={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};