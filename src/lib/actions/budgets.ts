"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/actions/accounts";

export async function createBudget(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const categoryId = String(formData.get("category_id") ?? "");
  const limiteMensal = Number(formData.get("limite_mensal") ?? 0);
  const mesReferencia = String(formData.get("mes_referencia") ?? "");

  if (!categoryId || !limiteMensal || limiteMensal <= 0 || !mesReferencia) {
    return { error: "Preencha categoria, limite e mês de referência." };
  }

  const { error } = await supabase.from("budgets").insert({
    user_id: user.id,
    category_id: categoryId,
    limite_mensal: limiteMensal,
    mes_referencia: `${mesReferencia}-01`,
  });

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Já existe um orçamento para essa categoria neste mês."
          : error.message,
    };
  }

  revalidatePath("/orcamentos");
  return {};
}

export async function deleteBudget(id: string) {
  const supabase = await createClient();
  await supabase.from("budgets").delete().eq("id", id);
  revalidatePath("/orcamentos");
}
