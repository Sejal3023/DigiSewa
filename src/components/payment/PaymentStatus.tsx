import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

interface PaymentStatusProps {
  status: 'success' | 'failed' | 'pending';
  transactionId: string;
  amount: number;
  method: 'card' | 'upi';
  timestamp?: string;
}

export const PaymentStatus = ({ 
  status, 
  transactionId, 
  amount, 
  method, 
  timestamp 
}: PaymentStatusProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          icon: CheckCircle2,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          badgeVariant: 'default' as const,
          title: 'Payment Successful',
        };
      case 'failed':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          badgeVariant: 'destructive' as const,
          title: 'Payment Failed',
        };
      case 'pending':
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          badgeVariant: 'secondary' as const,
          title: 'Payment Pending',
        };
      default:
        return {
          icon: Clock,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          badgeVariant: 'secondary' as const,
          title: 'Unknown Status',
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  return (
    <Card className={`${config.borderColor} ${config.bgColor}`}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <StatusIcon className={`h-6 w-6 ${config.color}`} />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <p className={`font-semibold ${config.color}`}>{config.title}</p>
              <Badge variant={config.badgeVariant}>
                {method.toUpperCase()}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Amount:</span>
                <p className="font-medium">₹{amount}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Transaction ID:</span>
                <p className="font-mono text-xs">{transactionId}</p>
              </div>
              {timestamp && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Time:</span>
                  <p className="text-xs">{new Date(timestamp).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};