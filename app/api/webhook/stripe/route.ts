import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase"; // Import the admin client
import Stripe from "stripe";

// Improved Stripe initialization with better error handling
let stripe: Stripe | null = null;

// Only initialize Stripe when the API is actually called (not during build)
const getStripeInstance = () => {
  if (!stripe) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error("Missing STRIPE_SECRET_KEY environment variable");
    }

    stripe = new Stripe(apiKey, {
      apiVersion: "2025-03-31.basil", // Use current stable version instead of future date
    });
  }
  return stripe;
};

// Middleware para validar a assinatura do webhook
const validateStripeSignature = async (request: Request) => {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature") as string;

  try {
    // Get Stripe instance only when needed
    const stripe = getStripeInstance();

    // Verificar se a requisição realmente veio do Stripe
    return stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || "",
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return null;
  }
};

export async function POST(request: Request) {
  // Validar a assinatura do webhook
  const event = await validateStripeSignature(request);

  if (!event) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    // Processar eventos de checkout bem-sucedido
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Obter o ID do cliente que fez o pagamento
      const customerId = session.customer as string;
      const userId = session.client_reference_id; // Você enviará isso do frontend

      if (!userId) {
        console.error("User ID não encontrado na sessão do Stripe");
        return NextResponse.json({ error: "User ID missing" }, { status: 400 });
      }

      // Calcular a data de término da assinatura (por exemplo, 1 mês a partir de agora)
      const subscriptionEndDate = new Date();
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);

      // Em vez de upsert, tente uma verificação + update/insert

      // Verificar se o registro existe
      const { data: existingUser, error: checkError } = await supabaseAdmin
        .from("user_metadata")
        .select("id")
        .eq("id", userId)
        .single();

    //   console.log("Verificação de usuário existente:", {
    //     existingUser,
    //     checkError,
    //   });

      let updateResult;
      if (existingUser) {
        // Usuário existe, usar update
        console.log("Atualizando usuário existente:", userId);
        updateResult = await supabaseAdmin
          .from("user_metadata")
          .update({
            is_trial_active: true,
            trial_end_date: subscriptionEndDate.toISOString(),
            stripe_customer_id: customerId,
            subscription_status: "active",
            subscription_created_at: new Date().toISOString(),
          })
          .eq("id", userId);
      } else {
        // Usuário não existe, usar insert
        console.log("Inserindo novo usuário:", userId);
        updateResult = await supabaseAdmin.from("user_metadata").insert({
          id: userId,
          is_trial_active: true,
          trial_end_date: subscriptionEndDate.toISOString(),
          stripe_customer_id: customerId,
          subscription_status: "active",
          subscription_created_at: new Date().toISOString(),
        });
      }

    //   console.log("Resultado da operação:", updateResult);

      if (updateResult.error) {
        console.error(
          "Erro ao atualizar metadata do usuário:",
          updateResult.error,
        );
        return NextResponse.json(
          { error: "Database update failed" },
          { status: 500 },
        );
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erro ao processar webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
