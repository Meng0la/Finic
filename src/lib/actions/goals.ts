"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/actions/accounts";

export async function createGoal(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const nome = String(formData.get("nome") ?? "").trim();
  const valorAlvo = Number(formData.get("valor_alvo") ?? 0);
  const dataAlvo = formData.get("data_alvo") ? String(formData.get("data_alvo")) : null;

  if (!nome || !valorAlvo || valorAlvo <= 0) {
    return { error: "Preencha nome e valor alvo." };
  }

  const { error } = await supabase.from("goals").insert({
    user_id: user.id,
    nome,
    valor_alvo: valorAlvo,
    data_alvo: dataAlvo,
  });

  if (error) return { error: error.message };

  revalidatePath("/metas");
  return {};
}

export async function addContribution(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const id = String(formData.get("id") ?? "");
  const aporte = Number(formData.get("aporte") ?? 0);
  if (!id || !aporte || aporte <= 0) return { error: "Informe um valor de aporte válido." };

  const { data: goal } = await supabase
    .from("goals")
    .select("valor_atual, valor_alvo")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!goal) return { error: "Meta não encontrada." };

  const novoValor = goal.valor_atual + aporte;
  const status = novoValor >= goal.valor_alvo ? "concluida" : "ativa";

  const { error } = await supabase
    .from("goals")
    .update({ valor_atual: novoValor, status })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/metas");
  return {};
}

export async function deleteGoal(id: string) {
  const supabase = await createClient();
  await supabase.from("goals").delete().eq("id", id);
  revalidatePath("/metas");
}
