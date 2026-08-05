"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/actions/accounts";
import type { Database, Recorrencia, TransacaoTipo } from "@/types/database";
import { formatBRL } from "@/lib/finance";

type TransactionInsert = Database["public"]["Tables"]["transactions"]["Insert"];
type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const FIXA_MENSAL_OCORRENCIAS = 12;

function addMonths(dateStr: string, months: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

async function checkBudgetAlert(
  supabase: SupabaseServerClient,
  userId: string,
  categoryId: string,
  data: string
): Promise<string | undefined> {
  const mesReferencia = `${data.slice(0, 7)}-01`;
  const { data: budget } = await supabase
    .from("budgets")
    .select("limite_mensal")
    .eq("user_id", userId)
    .eq("category_id", categoryId)
    .eq("mes_referencia", mesReferencia)
    .maybeSingle();

  if (!budget) return undefined;

  const [{ data: categoria }, { data: gastos }] = await Promise.all([
    supabase.from("categories").select("nome").eq("id", categoryId).maybeSingle(),
    supabase
      .from("transactions")
      .select("valor")
      .eq("user_id", userId)
      .eq("category_id", categoryId)
      .eq("tipo", "despesa")
      .eq("status", "ativo")
      .gte("data", `${data.slice(0, 7)}-01`)
      .lte("data", data.slice(0, 7) + "-31"),
  ]);

  const totalGasto = (gastos ?? []).reduce((sum, t) => sum + t.valor, 0);
  const percentual = Math.round((totalGasto / budget.limite_mensal) * 100);
  const nomeCategoria = categoria?.nome ?? "categoria";

  if (percentual >= 100) {
    return `Atenção: você atingiu ${percentual}% do orçamento de "${nomeCategoria}" este mês (${formatBRL(totalGasto)} de ${formatBRL(budget.limite_mensal)}).`;
  }
  if (percentual >= 80) {
    return `Você já usou ${percentual}% do orçamento de "${nomeCategoria}" este mês (${formatBRL(totalGasto)} de ${formatBRL(budget.limite_mensal)}).`;
  }
  return undefined;
}

export async function createTransaction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const accountId = String(formData.get("account_id") ?? "");
  const contaDestinoId = formData.get("conta_destino_id")
    ? String(formData.get("conta_destino_id"))
    : null;
  const categoryId = formData.get("category_id") ? String(formData.get("category_id")) : null;
  const valor = Number(formData.get("valor") ?? 0);
  const tipo = String(formData.get("tipo") ?? "") as TransacaoTipo;
  const data = String(formData.get("data") ?? "");
  const descricao = String(formData.get("descricao") ?? "").trim() || null;
  const formaPagamento = String(formData.get("forma_pagamento") ?? "").trim() || null;
  const recorrencia = String(formData.get("recorrencia") ?? "unica") as Recorrencia;
  const parcelasTotal = formData.get("parcelas_total")
    ? Number(formData.get("parcelas_total"))
    : null;

  if (!accountId || !valor || valor <= 0 || !tipo || !data) {
    return { error: "Preencha conta, valor, tipo e data." };
  }
  if (tipo === "transferencia" && !contaDestinoId) {
    return { error: "Selecione a conta de destino da transferência." };
  }
  if (recorrencia === "parcelada" && (!parcelasTotal || parcelasTotal < 2)) {
    return { error: "Informe o número de parcelas (mínimo 2)." };
  }

  const base = {
    user_id: user.id,
    account_id: accountId,
    conta_destino_id: tipo === "transferencia" ? contaDestinoId : null,
    category_id: categoryId,
    valor,
    tipo,
    descricao,
    forma_pagamento: formaPagamento,
    recorrencia,
    origem: "web" as const,
    status: "ativo" as const,
  };

  let rows: TransactionInsert[];

  if (recorrencia === "parcelada" && parcelasTotal) {
    const grupoId = randomUUID();
    rows = Array.from({ length: parcelasTotal }, (_, i) => ({
      ...base,
      data: addMonths(data, i),
      parcela_atual: i + 1,
      parcelas_total: parcelasTotal,
      grupo_recorrencia_id: grupoId,
    }));
  } else if (recorrencia === "fixa_mensal") {
    const grupoId = randomUUID();
    rows = Array.from({ length: FIXA_MENSAL_OCORRENCIAS }, (_, i) => ({
      ...base,
      data: addMonths(data, i),
      grupo_recorrencia_id: grupoId,
    }));
  } else {
    rows = [{ ...base, data }];
  }

  const { error } = await supabase.from("transactions").insert(rows);
  if (error) return { error: error.message };

  revalidatePath("/transacoes");
  revalidatePath("/dashboard");

  const warning =
    tipo === "despesa" && categoryId
      ? await checkBudgetAlert(supabase, user.id, categoryId, data)
      : undefined;

  return warning ? { warning } : {};
}

export async function reverseTransaction(id: string) {
  const supabase = await createClient();
  await supabase.from("transactions").update({ status: "estornado" }).eq("id", id);
  revalidatePath("/transacoes");
  revalidatePath("/dashboard");
}

export async function updateTransaction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const id = String(formData.get("id") ?? "");
  const accountId = String(formData.get("account_id") ?? "");
  const contaDestinoId = formData.get("conta_destino_id")
    ? String(formData.get("conta_destino_id"))
    : null;
  const categoryId = formData.get("category_id") ? String(formData.get("category_id")) : null;
  const valor = Number(formData.get("valor") ?? 0);
  const tipo = String(formData.get("tipo") ?? "") as TransacaoTipo;
  const data = String(formData.get("data") ?? "");
  const descricao = String(formData.get("descricao") ?? "").trim() || null;
  const formaPagamento = String(formData.get("forma_pagamento") ?? "").trim() || null;

  if (!id || !accountId || !valor || valor <= 0 || !tipo || !data) {
    return { error: "Preencha conta, valor, tipo e data." };
  }
  if (tipo === "transferencia" && !contaDestinoId) {
    return { error: "Selecione a conta de destino da transferência." };
  }

  const { error } = await supabase
    .from("transactions")
    .update({
      account_id: accountId,
      conta_destino_id: tipo === "transferencia" ? contaDestinoId : null,
      category_id: tipo === "transferencia" ? null : categoryId,
      valor,
      tipo,
      data,
      descricao,
      forma_pagamento: formaPagamento,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/transacoes");
  revalidatePath("/dashboard");
  redirect("/transacoes");
}

const ALLOWED_ANEXO_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_ANEXO_SIZE = 5 * 1024 * 1024;

export async function uploadComprovante(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const id = String(formData.get("id") ?? "");
  const file = formData.get("comprovante");

  if (!id || !(file instanceof File) || file.size === 0) {
    return { error: "Selecione um arquivo." };
  }
  if (!ALLOWED_ANEXO_TYPES.includes(file.type)) {
    return { error: "Formato não suportado. Envie JPG, PNG, WEBP ou PDF." };
  }
  if (file.size > MAX_ANEXO_SIZE) {
    return { error: "Arquivo muito grande (máximo 5 MB)." };
  }

  const { data: existing } = await supabase
    .from("transactions")
    .select("anexo_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existing) return { error: "Lançamento não encontrado." };

  const extensao = file.name.split(".").pop() || "bin";
  const path = `${user.id}/${id}/${randomUUID()}.${extensao}`;

  const { error: uploadError } = await supabase.storage
    .from("comprovantes")
    .upload(path, file, { contentType: file.type });

  if (uploadError) return { error: uploadError.message };

  if (existing.anexo_path) {
    await supabase.storage.from("comprovantes").remove([existing.anexo_path]);
  }

  const { error: updateError } = await supabase
    .from("transactions")
    .update({ anexo_path: path })
    .eq("id", id)
    .eq("user_id", user.id);

  if (updateError) return { error: updateError.message };

  revalidatePath(`/transacoes/${id}`);
  return {};
}

export async function removeComprovante(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from("transactions")
    .select("anexo_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (existing?.anexo_path) {
    await supabase.storage.from("comprovantes").remove([existing.anexo_path]);
  }

  await supabase.from("transactions").update({ anexo_path: null }).eq("id", id).eq("user_id", user.id);
  revalidatePath(`/transacoes/${id}`);
}
