//reviewd by Derek W 07/04/2025

import { NextResponse } from "next/server"; // IMPORT NEXT RESPONSE, so it's possible to return a response to the client from the server
import { supabaseAdmin } from "../../../../lib/supabase"; // Import the admin key role from the supabase client
import Stripe from "stripe"; //import from stripe API

// Improved Stripe initialization with better error handling
let stripe: Stripe | null = null; //stripe is a variable that will be used to store the stripe instance

// Only initialize Stripe when the API is actually called (not during build)
const getStripeInstance = () => {
  if (!stripe) {
    const apiKey = process.env.STRIPE_SECRET_KEY; //stripe key is stored in the env
    if (!apiKey) {
      throw new Error("Missing STRIPE_SECRET_KEY environment variable"); //eerror if the variable is empty
    }
    //simple if else validation to check if the stripe key is valid or not.
    stripe = new Stripe(apiKey, {
      //initialize stripe with the key
      apiVersion: "2025-03-31.basil", // Use current stable version instead of future date
    });
  }
  return stripe; //return the stripe instance, so it can be used in the code
};

// Middleware para validar a assinatura do webhook
const validateStripeSignature = async (request: Request) => {
  //variable to validate the stripe API signnature
  const body = await request.text();
  const signature = request.headers.get("stripe-signature") as string;

  try {
    // Get Stripe instance only when needed
    const stripe = getStripeInstance();

    // Verificar se a requisição realmente veio do Stripe
    return stripe.webhooks.constructEvent(
      //verify the signature
      body, //body of stripe request
      signature, //variable of the stripe signature itself
      process.env.STRIPE_WEBHOOK_SECRET || "", //secret key of the stripe webhook
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err); //if the signature fail the error will be logged
    return null; //return null if the signature is not valid
  }
};

export async function POST(request: Request) {
  //function to handle the post request from the stripe API
  console.log("Webhook do Stripe recebido");
  
  // Validar a assinatura do webhook
  const event = await validateStripeSignature(request); //event is a variable that will be used to store the event from the stripe API

  if (!event) {
    //if the event is not valid, return an error
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    console.log(`Processando evento do Stripe: ${event.type}`);
    
    // Processar eventos de checkout bem-sucedido (INSCRIÇÃO INICIAL)
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Obter o ID do cliente que fez o pagamento
      const customerId = session.customer as string;
      const userId = session.client_reference_id; // ID from the user that is stored in the session in the browser

      if (!userId) {
        //if the user is not valid, return an error
        console.error("User ID não encontrado na sessão do Stripe");
        return NextResponse.json({ error: "User ID missing" }, { status: 400 });
      }

      // Calcular a data de término da assinatura (por exemplo, 1 mês a partir de agora)
      const subscriptionEndDate = new Date();
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1); //set the subscription end date to 1 month from now

      // Verificar se o registro existe
      const { data: existingUser, error: checkError } = await supabaseAdmin //metadata from supabase
        .from("user_metadata") //table from supabase
        .select("id") //method to select the id from the table
        .eq("id", userId) // need to check if the user is on database
        .single(); // method to get a single record from the table

      console.log("Verificação de usuário existente:", {
        // existingUser,
        checkError,
      });

      let updateResult; //variable to update the metada from the user in supabase
      if (existingUser) {
        // Existing user, update metadata
        console.log("Atualizando usuário existente:", userId); //log to print in the server terminal
        updateResult = await supabaseAdmin // the variable receive the supabase admin key access
          .from("user_metadata") //method to select the table from supabase
          .update({
            //method to start to update the metadata from the user
            is_trial_active: true, //validation in the supabase database to check if the trial is active or not
            trial_end_date: subscriptionEndDate.toISOString(), //get the date in the ISO format
            stripe_customer_id: customerId, // update the costumer id in the supabase database
            subscription_status: "active", // update the subscription status as a string in the supabase database.
            subscription_created_at: new Date().toISOString(), // Create a subscription date in the time that the user created the subscription
          })
          .eq("id", userId); //validate if the user is in the database, it need to be the same id as the one that is in the session in the browser
      } else {
        //otherwise
        // Insert method, but this will be deleted soon
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
        ); //if the update fail, the error will be logged in the server terminal
        return NextResponse.json(
          { error: "Database update failed" }, //custom error
          { status: 500 },
        );
      }

      return NextResponse.json({ success: true }); //if pass, return success
    }
    
    // Processar eventos de pagamento de fatura bem-sucedido (RENOVAÇÕES)
    else if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as any;
      
      // Verificar se esta fatura está relacionada a uma assinatura
      if (invoice.subscription && invoice.customer) {
        const customerId = invoice.customer as string;
        
        // Buscar o usuário pelo stripe_customer_id
        const { data: userData, error: userError } = await supabaseAdmin
          .from("user_metadata")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();
          
        if (userError || !userData) {
          console.error("Usuário não encontrado para o customer ID:", customerId);
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        
        // Obter detalhes da assinatura para saber a nova data de término
        const stripe = getStripeInstance();
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        
        // Atualizar os dados de assinatura no banco
        const updateResult = await supabaseAdmin
          .from("user_metadata")
          .update({
            subscription_status: subscription.status,
            trial_end_date: new Date((subscription as any).current_period_end * 1000).toISOString(),
            last_invoice_paid_at: new Date().toISOString(),
          })
          .eq("id", userData.id);
          
        if (updateResult.error) {
          console.error("Erro ao atualizar dados de renovação:", updateResult.error);
          return NextResponse.json({ error: "Database update failed" }, { status: 500 });
        }
        
        console.log(`Assinatura renovada com sucesso para o usuário: ${userData.id}`);
      }
    }
    
    // Processar alterações de status da assinatura
    else if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as any;
      const customerId = subscription.customer as string;
      
      // Buscar o usuário pelo stripe_customer_id
      const { data: userData, error: userError } = await supabaseAdmin
        .from("user_metadata")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single();
        
      if (userError || !userData) {
        console.error("Usuário não encontrado para o customer ID:", customerId);
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      
      // Atualizar o status e data de término da assinatura
      const updateResult = await supabaseAdmin
        .from("user_metadata")
        .update({
          subscription_status: subscription.status,
          trial_end_date: new Date((subscription.current_period_end as any) * 1000).toISOString(),
          subscription_id: subscription.id,  // Armazenar também o ID da assinatura
          updated_at: new Date().toISOString(),
        })
        .eq("id", userData.id);
        
      if (updateResult.error) {
        console.error("Erro ao atualizar status da assinatura:", updateResult.error);
        return NextResponse.json({ error: "Database update failed" }, { status: 500 });
      }
      
      console.log(`Status da assinatura atualizado para: ${subscription.status}`);
    }
    
    // Lidar com falhas de pagamento
    else if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as any;
      
      if (invoice.subscription && invoice.customer) {
        const customerId = invoice.customer as string;
        
        // Buscar o usuário pelo stripe_customer_id
        const { data: userData, } = await supabaseAdmin
          .from("user_metadata")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();
          
        if (userData) {
          // Atualizar o status para indicar falha no pagamento
          await supabaseAdmin
            .from("user_metadata")
            .update({
              subscription_status: "past_due",
              payment_failed_at: new Date().toISOString(),
            })
            .eq("id", userData.id);
            
          console.log(`Falha no pagamento registrada para o usuário: ${userData.id}`);
        }
      }
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
