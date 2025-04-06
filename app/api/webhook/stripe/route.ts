import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import Stripe from 'stripe';

// Inicializar o Stripe com sua chave secreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-03-31.basil',
});

// Middleware para validar a assinatura do webhook
const validateStripeSignature = async (request: Request) => {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature') as string;
  
  try {
    // Verificar se a requisição realmente veio do Stripe
    return stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return null;
  }
};

export async function POST(request: Request) {
  // Validar a assinatura do webhook
  const event = await validateStripeSignature(request);
  
  if (!event) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    // Processar eventos de checkout bem-sucedido
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Obter o ID do cliente que fez o pagamento
      const customerId = session.customer as string;
      const userId = session.client_reference_id; // Você enviará isso do frontend
      
      if (!userId) {
        console.error('User ID não encontrado na sessão do Stripe');
        return NextResponse.json({ error: 'User ID missing' }, { status: 400 });
      }
      
      // Calcular a data de término da assinatura (por exemplo, 1 mês a partir de agora)
      const subscriptionEndDate = new Date();
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
      
      // Atualizar o metadata do usuário no Supabase
      const { error } = await supabase
        .from('user_metadata')
        .upsert({
          id: userId,
          is_trial_active: true,
          trial_end_date: subscriptionEndDate.toISOString(),
          stripe_customer_id: customerId,
          subscription_status: 'active',
          subscription_created_at: new Date().toISOString()
        }, { onConflict: 'id' });
      
      if (error) {
        console.error('Erro ao atualizar metadata do usuário:', error);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }
      
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}