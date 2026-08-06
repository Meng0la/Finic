"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CategoriaTipo, GrupoOrcamentario } from "@/types/database";
import type { ActionState } from "@/lib/actions/accounts";

export async function createCategory(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const nome = String(formData.get("nome") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "") as CategoriaTipo;
  const cor = String(formData.get("cor") ?? "#64748b");
  const icone = String(formData.get("icone") ?? "circle");

  if (!nome || !tipo) {
    return { error: "Preencha nome e tipo da categoria." };
  }

  const { error } = await supabase
    .from("categories")
    .insert({ user_id: user.id, nome, tipo, cor, icone, is_padrao: false });

  if (error) {
    return {
      error: error.code === "23505" ? "Já existe uma categoria com esse nome." : error.message,
    };
  }

  revalidatePath("/categorias");
  return {};
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  await supabase.from("categories").delete().eq("id", id);
  revalidatePath("/categorias");
}

export async function updateCategoryGroup(id: string, grupo: GrupoOrcamentario | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("categories")
    .update({ grupo_orcamentario: grupo })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/categorias");
  revalidatePath("/orcamentos");
}
