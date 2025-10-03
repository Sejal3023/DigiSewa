import { supabase } from "@/integrations/supabase/client";

export interface UserRole {
  role: 'citizen' | 'department' | 'admin' | 'super_admin';
  department?: string;
}

class AuthService {
  async getUserRole(userId: string): Promise<UserRole | null> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, department')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('role', { ascending: true })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }

      return data as UserRole;
    } catch (error) {
      console.error('Error in getUserRole:', error);
      return null;
    }
  }

  async connectWalletToUser(userId: string, walletAddress: string): Promise<boolean> {
    try {
      // Check if wallet is already connected to another user
      const { data: existing } = await supabase
        .from('wallet_connections')
        .select('user_id')
        .eq('wallet_address', walletAddress)
        .eq('is_active', true)
        .single();

      if (existing && existing.user_id !== userId) {
        throw new Error('Wallet already connected to another account');
      }

      // Connect wallet via backend proxy
      const { error } = await supabase.functions.invoke('wallet-proxy', {
        method: 'POST',
        body: { walletAddress }
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();
