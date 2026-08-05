"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ContaTipo } from "@/types/database";

export interface ActionState {
  error?: string;
  warning?: string;
}

export async function createAccount(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const nome = String(formData.get("nome") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "") as ContaTipo;
  const saldoInicial = Number(formData.get("saldo_inicial") ?? 0);
  const limite = formData.get("limite") ? Number(formData.get("limite")) : null;
  const diaFechamento = formData.get("dia_fechamento")
    ? Number(formData.get("dia_fechamento"))
    : null;
  const diaVencimento = formData.get("dia_vencimento")
    ? Number(formData.get("dia_vencimento"))
    : null;

  if (!nome || !tipo) {
    return { error: "Preencha nome e tipo da conta." };
  }

  const { error } = await supabase.from("accounts").insert({
    user_id: user.id,
    nome,
    tipo,
    saldo_inicial: saldoInicial,
    limite: tipo === "cartao" ? limite : null,
    dia_fechamento: tipo === "cartao" ? diaFechamento : null,
    dia_vencimento: tipo === "cartao" ? diaVencimento : null,
  });

  if (error) return { error: error.message };

  revalidatePath("/contas");
  return {};
}

export async function setAccountAtivo(id: string, ativo: boolean) {
  const supabase = await createClient();
  await supabase.from("accounts").update({ ativo }).eq("id", id);
  revalidatePath("/contas");
}
