// Mock Payment Service
export interface PaymentDetails {
  transactionId: string;
  amount: number;
  method: 'card' | 'upi';
  status: 'success' | 'failed' | 'pending';
  timestamp: string;
}

export interface PaymentRequest {
  amount: number;
  method: 'card' | 'upi';
  serviceId: string;
  userId?: string;
}

class PaymentService {
  private payments: Map<string, PaymentDetails> = new Map();

  async processPayment(request: PaymentRequest): Promise<PaymentDetails> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock success rate of 95%
    const isSuccess = Math.random() > 0.05;

    const transactionId = this.generateTransactionId(request.method);
    
    const payment: PaymentDetails = {
      transactionId,
      amount: request.amount,
      method: request.method,
      status: isSuccess ? 'success' : 'failed',
      timestamp: new Date().toISOString(),
    };

    this.payments.set(transactionId, payment);
    
    if (!isSuccess) {
      throw new Error('Payment failed. Please try again.');
    }

    return payment;
  }

  async getPaymentStatus(transactionId: string): Promise<PaymentDetails | null> {
    return this.payments.get(transactionId) || null;
  }

  private generateTransactionId(method: 'card' | 'upi'): string {
    const prefix = method === 'card' ? 'TXN' : 'UPI';
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  }

  // Get all payments (for admin/debugging)
  getAllPayments(): PaymentDetails[] {
    return Array.from(this.payments.values());
  }

  // Calculate total amount for a service
  calculateTotal(baseAmount: string): number {
    // Extract numeric value from amount string like "₹500 - ₹2000"
    const numericAmount = baseAmount.replace(/[₹,\s-]/g, '').split(/[₹-]/)[0];
    const base = parseInt(numericAmount) || 500;
    const processingFee = 50;
    const platformFee = 25;
    return base + processingFee + platformFee;
  }
}

export const paymentService = new PaymentService();