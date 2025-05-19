import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "../../../../lib/supabase";

// Stripe initialization
const getStripeInstance = () => {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable");
  }
  return new Stripe(apiKey, {
    apiVersion: "2025-03-31.basil",
  });
};

export async function POST(request: Request) {
  try {
    // Obter o ID do usuário do corpo da solicitação
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Buscar o stripe_customer_id associado ao usuário
    const { data: userData, error: userError } = await supabaseAdmin
      .from("user_metadata")
      .select("stripe_customer_id")
      .eq("id", userId)
      .single();

    if (userError || !userData?.stripe_customer_id) {
      console.error("Erro ao buscar informações do usuário:", userError);
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const stripe = getStripeInstance();

    // Criar uma sessão do portal de clientes
    const session = await stripe.billingPortal.sessions.create({
      customer: userData.stripe_customer_id,
      return_url: `${request.headers.get("origin")}/settings`,
    });

    // Retornar o URL da sessão do portal
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Erro ao criar sessão do portal de clientes:", error);
    return NextResponse.json(
      { error: "Failed to create customer portal session" },
      { status: 500 }
    );
  }
}
