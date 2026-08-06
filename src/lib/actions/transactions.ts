"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/actions/accounts";
import type { Database, Recorrencia, TransacaoTipo } from "@/types/database";
import { formatBRL } from "@/lib/finance";
import { callGroqChat } from "@/lib/groq";

type TransactionInsert = Database["public"]["Tables"]["transactions"]["Insert"];
type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const FIXA_MENSAL_OCORRENCIAS = 12;
const ALLOWED_ANEXO_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_ANEXO_SIZE = 5 * 1024 * 1024;
const GROQ_VISION_MODEL = "qwen/qwen3.6-27b";

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

const MESES_HISTORICO_ANOMALIA = 3;
const MULTIPLICADOR_ANOMALIA = 2;

async function checkValorAnomalo(
  supabase: SupabaseServerClient,
  userId: string,
  categoryId: string,
  data: string,
  valor: number
): Promise<string | undefined> {
  const inicioMesAtual = new Date(`${data.slice(0, 7)}-01T00:00:00`);
  const inicioHistorico = new Date(inicioMesAtual);
  inicioHistorico.setMonth(inicioHistorico.getMonth() - MESES_HISTORICO_ANOMALIA);
  const fimHistorico = new Date(inicioMesAtual);
  fimHistorico.setDate(fimHistorico.getDate() - 1);

  const { data: historico } = await supabase
    .from("transactions")
    .select("valor")
    .eq("user_id", userId)
    .eq("category_id", categoryId)
    .eq("tipo", "despesa")
    .eq("status", "ativo")
    .gte("data", inicioHistorico.toISOString().slice(0, 10))
    .lte("data", fimHistorico.toISOString().slice(0, 10));

  const valores = (historico ?? []).map((h) => h.valor);
  if (valores.length < 2) return undefined;

  const media = valores.reduce((sum, v) => sum + v, 0) / valores.length;
  if (media <= 0 || valor < media * MULTIPLICADOR_ANOMALIA) return undefined;

  const percentualAcima = Math.round(((valor - media) / media) * 100);
  return `Esse valor é ${percentualAcima}% maior que a média dessa categoria nos últimos meses (${formatBRL(media)}).`;
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

  const { data: inserted, error } = await supabase.from("transactions").insert(rows).select("id");
  if (error) return { error: error.message };

  const comprovante = formData.get("comprovante");
  if (
    comprovante instanceof File &&
    comprovante.size > 0 &&
    comprovante.size <= MAX_ANEXO_SIZE &&
    ALLOWED_ANEXO_TYPES.includes(comprovante.type) &&
    inserted?.length === 1
  ) {
    const extensao = comprovante.name.split(".").pop() || "bin";
    const path = `${user.id}/${inserted[0].id}/${randomUUID()}.${extensao}`;
    const { error: uploadError } = await supabase.storage
      .from("comprovantes")
      .upload(path, comprovante, { contentType: comprovante.type });
    if (!uploadError) {
      await supabase.from("transactions").update({ anexo_path: path }).eq("id", inserted[0].id);
    } else {
      console.error("Falha ao anexar comprovante no lançamento", uploadError);
    }
  }

  revalidatePath("/transacoes");
  revalidatePath("/dashboard");

  const warnings: string[] = [];
  if (tipo === "despesa" && categoryId) {
    const [budgetWarning, anomalyWarning] = await Promise.all([
      checkBudgetAlert(supabase, user.id, categoryId, data),
      checkValorAnomalo(supabase, user.id, categoryId, data, valor),
    ]);
    if (budgetWarning) warnings.push(budgetWarning);
    if (anomalyWarning) warnings.push(anomalyWarning);
  }

  return warnings.length > 0 ? { warning: warnings.join(" ") } : {};
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

export interface ComprovanteScanResult {
  valor?: number;
  data?: string;
  descricao?: string;
  tipo?: TransacaoTipo;
  forma_pagamento?: string;
}

const ALLOWED_SCAN_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function scanComprovante(
  formData: FormData
): Promise<{ error?: string; scan?: ComprovanteScanResult }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return { error: "GROQ_API_KEY não configurada no servidor." };

  const file = formData.get("comprovante");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione uma foto do comprovante." };
  }
  if (!ALLOWED_SCAN_TYPES.includes(file.type)) {
    return { error: "Formato não suportado para leitura. Envie JPG, PNG ou WEBP." };
  }
  if (file.size > MAX_ANEXO_SIZE) {
    return { error: "Arquivo muito grande (máximo 5 MB)." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;
  const hoje = new Date().toISOString().slice(0, 10);

  const system = `Você lê fotos de comprovantes, notas fiscais e recibos brasileiros e extrai os dados do lançamento financeiro correspondente. Data de hoje: ${hoje}.
Responda APENAS com um JSON válido, sem markdown, no formato exato:
{"valor": number ou null, "data": "YYYY-MM-DD" ou null, "descricao": string ou null, "tipo": "despesa" ou "receita", "forma_pagamento": string ou null}
Regras:
- "valor" é o valor TOTAL pago ou recebido, sempre positivo (número, não string). Se não conseguir ler com confiança, use null.
- "data" é a data da transação como aparece no comprovante. Se não conseguir ler, use null — nunca invente uma data.
- "descricao" é um resumo curto (nome do estabelecimento ou do item principal).
- A grande maioria dos comprovantes é despesa (compra/pagamento). Só use "receita" se estiver claro que é um recebimento (ex: comprovante de depósito/transferência recebida).
- "forma_pagamento" é como foi pago, se visível (ex: Pix, débito, crédito, dinheiro). Caso não apareça, use null.
- Se a imagem não for um comprovante legível, responda com "valor": null e os demais campos null.`;

  const { content, error } = await callGroqChat(apiKey, {
    model: GROQ_VISION_MODEL,
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: [
          { type: "text", text: "Leia este comprovante e extraia os dados no formato pedido." },
          { type: "image_url", image_url: { url: dataUri } },
        ],
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  if (error || !content) {
    return { error: error ?? "Resposta vazia da IA. Tente novamente." };
  }

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    const scan: ComprovanteScanResult = {};

    if (typeof parsed.valor === "number" && parsed.valor > 0) {
      scan.valor = Math.round(parsed.valor * 100) / 100;
    }
    if (typeof parsed.data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.data)) {
      scan.data = parsed.data;
    }
    if (typeof parsed.descricao === "string" && parsed.descricao.trim()) {
      scan.descricao = parsed.descricao.trim().slice(0, 200);
    }
    if (parsed.tipo === "despesa" || parsed.tipo === "receita") {
      scan.tipo = parsed.tipo;
    }
    if (typeof parsed.forma_pagamento === "string" && parsed.forma_pagamento.trim()) {
      scan.forma_pagamento = parsed.forma_pagamento.trim().slice(0, 60);
    }

    if (!scan.valor) {
      return { error: "Não consegui identificar o valor no comprovante. Preencha manualmente." };
    }
    return { scan };
  } catch (err) {
    console.error("Groq vision parse failed", err, content);
    return { error: "A IA respondeu em um formato inesperado. Tente novamente." };
  }
}
