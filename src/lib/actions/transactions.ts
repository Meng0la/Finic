"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/actions/accounts";
import type { Database, Recorrencia, TransacaoTipo } from "@/types/database";

type TransactionInsert = Database["public"]["Tables"]["transactions"]["Insert"];

const FIXA_MENSAL_OCORRENCIAS = 12;

function addMonths(dateStr: string, months: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
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
  return {};
}

export async function reverseTransaction(id: string) {
  const supabase = await createClient();
  await supabase.from("transactions").update({ status: "estornado" }).eq("id", id);
  revalidatePath("/transacoes");
  revalidatePath("/dashboard");
}
