"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { currentMonthRef } from "@/lib/finance";
import type { ActionState } from "@/lib/actions/accounts";

export async function createBill(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const nome = String(formData.get("nome") ?? "").trim();
  const valor = Number(formData.get("valor") ?? 0);
  const diaVencimento = Number(formData.get("dia_vencimento") ?? 0);
  const categoryId = formData.get("category_id") ? String(formData.get("category_id")) : null;
  const accountId = formData.get("account_id") ? String(formData.get("account_id")) : null;

  if (!nome || !valor || valor <= 0 || !diaVencimento || diaVencimento < 1 || diaVencimento > 31) {
    return { error: "Preencha nome, valor e um dia de vencimento válido (1 a 31)." };
  }

  const { error } = await supabase.from("bills").insert({
    user_id: user.id,
    nome,
    valor,
    dia_vencimento: diaVencimento,
    category_id: categoryId,
    account_id: accountId,
  });

  if (error) return { error: error.message };

  revalidatePath("/contas-a-pagar");
  revalidatePath("/dashboard");
  return {};
}

export async function deleteBill(id: string) {
  const supabase = await createClient();
  await supabase.from("bills").delete().eq("id", id);
  revalidatePath("/contas-a-pagar");
  revalidatePath("/dashboard");
}

export async function markBillPaid(billId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: bill } = await supabase
    .from("bills")
    .select("*")
    .eq("id", billId)
    .eq("user_id", user.id)
    .single();
  if (!bill) return;

  const mes = currentMonthRef();
  const mesReferencia = `${mes}-01`;

  const { data: existing } = await supabase
    .from("bill_payments")
    .select("id")
    .eq("bill_id", billId)
    .eq("mes_referencia", mesReferencia)
    .maybeSingle();
  if (existing) return;

  let accountId = bill.account_id;
  if (!accountId) {
    const { data: firstAccount } = await supabase
      .from("accounts")
      .select("id")
      .eq("user_id", user.id)
      .eq("ativo", true)
      .order("nome")
      .limit(1)
      .maybeSingle();
    accountId = firstAccount?.id ?? null;
  }
  if (!accountId) return;

  const { data: transaction } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      account_id: accountId,
      category_id: bill.category_id,
      valor: bill.valor,
      tipo: "despesa",
      data: new Date().toISOString().slice(0, 10),
      descricao: bill.nome,
      recorrencia: "unica",
      origem: "web",
      status: "ativo",
    })
    .select("id")
    .single();

  await supabase.from("bill_payments").insert({
    bill_id: billId,
    user_id: user.id,
    mes_referencia: mesReferencia,
    transaction_id: transaction?.id ?? null,
  });

  revalidatePath("/contas-a-pagar");
  revalidatePath("/transacoes");
  revalidatePath("/dashboard");
}

export async function unmarkBillPaid(billId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const mesReferencia = `${currentMonthRef()}-01`;
  await supabase
    .from("bill_payments")
    .delete()
    .eq("bill_id", billId)
    .eq("user_id", user.id)
    .eq("mes_referencia", mesReferencia);

  revalidatePath("/contas-a-pagar");
  revalidatePath("/dashboard");
}
