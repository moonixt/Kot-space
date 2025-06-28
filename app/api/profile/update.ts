import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const { userId, full_name, email } = await req.json();

    if (!userId || (!full_name && !email)) {
      return NextResponse.json({ error: "Dados insuficientes." }, { status: 400 });
    }

    // Atualiza o perfil ou cria se não existir (upsert)
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: userId, full_name, email }, { onConflict: 'id' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
