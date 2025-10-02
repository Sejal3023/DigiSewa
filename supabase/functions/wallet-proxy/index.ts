import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WalletConnectRequest {
  walletAddress: string;
  chainId: string;
  balance?: string;
}

interface WalletUpdateRequest {
  balance?: string;
  chainId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    // GET /wallet-proxy - Get user's wallet connection
    if (req.method === 'GET') {
      console.log('Fetching wallet for user:', user.id);
      
      const { data, error } = await supabaseClient
        .from('wallet_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching wallet:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ wallet: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /wallet-proxy - Connect a new wallet
    if (req.method === 'POST') {
      const body: WalletConnectRequest = await req.json();
      console.log('Connecting wallet for user:', user.id, body);

      if (!body.walletAddress || !body.chainId) {
        return new Response(
          JSON.stringify({ error: 'walletAddress and chainId are required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Deactivate any existing wallet connections for this user
      await supabaseClient
        .from('wallet_connections')
        .update({ is_active: false })
        .eq('user_id', user.id);

      // Create new wallet connection
      const { data, error } = await supabaseClient
        .from('wallet_connections')
        .insert({
          user_id: user.id,
          wallet_address: body.walletAddress,
          chain_id: body.chainId,
          balance: body.balance || '0',
          is_active: true,
          last_connected_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error connecting wallet:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ wallet: data, success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PUT /wallet-proxy - Update wallet info
    if (req.method === 'PUT') {
      const body: WalletUpdateRequest = await req.json();
      console.log('Updating wallet for user:', user.id, body);

      const updateData: any = {
        last_connected_at: new Date().toISOString(),
      };

      if (body.balance !== undefined) {
        updateData.balance = body.balance;
      }
      if (body.chainId !== undefined) {
        updateData.chain_id = body.chainId;
      }

      const { data, error } = await supabaseClient
        .from('wallet_connections')
        .update(updateData)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .select()
        .single();

      if (error) {
        console.error('Error updating wallet:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ wallet: data, success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE /wallet-proxy - Disconnect wallet
    if (req.method === 'DELETE') {
      console.log('Disconnecting wallet for user:', user.id);

      const { error } = await supabaseClient
        .from('wallet_connections')
        .update({ is_active: false })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error disconnecting wallet:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in wallet-proxy function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
