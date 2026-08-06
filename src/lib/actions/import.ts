"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fromCsv } from "@/lib/csv";
import type { ActionState } from "@/lib/actions/accounts";
import type { TransacaoTipo } from "@/types/database";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const MAX_IMPORT_SIZE = 2 * 1024 * 1024;
const MAX_PREVIEW_ROWS = 200;

const TIPO_MAP: Record<string, TransacaoTipo> = {
  receita: "receita",
  despesa: "despesa",
  transferencia: "transferencia",
  "transferência": "transferencia",
};

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

function parseData(raw: string): string | null {
  const s = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const match = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const [, d, m, y] = match;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return null;
}

function parseValor(raw: string): number | null {
  const s = raw.trim().replace(/[^\d,.-]/g, "");
  if (!s) return null;
  let normalized = s;
  if (s.includes(",") && s.lastIndexOf(",") > s.lastIndexOf(".")) {
    normalized = s.replace(/\./g, "").replace(",", ".");
  }
  const n = Number(normalized);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export interface ParsedImportRow {
  index: number;
  data: string | null;
  tipo: TransacaoTipo | null;
  valor: number | null;
  contaNome: string;
  categoriaNome: string;
  descricao: string | null;
  formaPagamento: string | null;
  accountId: string | null;
  categoryId: string | null;
  contaDestinoId: string | null;
  error: string | null;
  duplicate: boolean;
}

async function parseRows(
  supabase: SupabaseServerClient,
  userId: string,
  text: string
): Promise<{ rows: ParsedImportRow[]; errorGeral: string | null }> {
  const table = fromCsv(text);
  if (table.length === 0) {
    return { rows: [], errorGeral: "Arquivo vazio." };
  }

  const header = table[0].map(normalize);
  const idx = (...names: string[]) => {
    for (const n of names) {
      const i = header.indexOf(n);
      if (i !== -1) return i;
    }
    return -1;
  };

  const iData = idx("data");
  const iTipo = idx("tipo");
  const iValor = idx("valor");
  const iConta = idx("conta");
  const iCategoria = idx("categoria", "categoria/destino");
  const iDescricao = idx("descrição", "descricao");
  const iForma = idx("forma de pagamento");

  if (iData === -1 || iTipo === -1 || iValor === -1 || iConta === -1) {
    return {
      rows: [],
      errorGeral:
        'O CSV precisa ter pelo menos as colunas "Data", "Tipo", "Valor" e "Conta" (separadas por ";"). Exportar do Finic já gera esse formato.',
    };
  }

  const [{ data: accounts }, { data: categories }, { data: existing }] = await Promise.all([
    supabase.from("accounts").select("id, nome").eq("user_id", userId),
    supabase.from("categories").select("id, nome, tipo").eq("user_id", userId),
    supabase
      .from("transactions")
      .select("account_id, data, valor, tipo, descricao")
      .eq("user_id", userId),
  ]);

  const accountByName = new Map((accounts ?? []).map((a) => [normalize(a.nome), a.id]));
  const categoryByName = new Map(
    (categories ?? []).map((c) => [`${normalize(c.nome)}|${c.tipo}`, c.id])
  );
  const existingKeys = new Set(
    (existing ?? []).map(
      (t) => `${t.account_id}|${t.data}|${t.valor}|${t.tipo}|${t.descricao ?? ""}`
    )
  );

  const rows: ParsedImportRow[] = [];
  for (let i = 1; i < table.length; i++) {
    const cols = table[i];
    if (cols.every((c) => !c.trim())) continue;

    const dataRaw = cols[iData] ?? "";
    const tipoRaw = cols[iTipo] ?? "";
    const valorRaw = cols[iValor] ?? "";
    const contaRaw = cols[iConta] ?? "";
    const categoriaRaw = iCategoria !== -1 ? (cols[iCategoria] ?? "") : "";
    const descricao = iDescricao !== -1 ? cols[iDescricao]?.trim() || null : null;
    const formaPagamento = iForma !== -1 ? cols[iForma]?.trim() || null : null;

    const data = parseData(dataRaw);
    const tipo = TIPO_MAP[normalize(tipoRaw)] ?? null;
    const valor = parseValor(valorRaw);
    const accountId = accountByName.get(normalize(contaRaw)) ?? null;

    let categoryId: string | null = null;
    let contaDestinoId: string | null = null;
    if (tipo === "transferencia") {
      contaDestinoId = accountByName.get(normalize(categoriaRaw)) ?? null;
    } else if (categoriaRaw.trim()) {
      categoryId = categoryByName.get(`${normalize(categoriaRaw)}|${tipo ?? "despesa"}`) ?? null;
    }

    let error: string | null = null;
    if (!data) error = "Data inválida (use AAAA-MM-DD ou DD/MM/AAAA).";
    else if (!tipo) error = "Tipo deve ser Receita, Despesa ou Transferência.";
    else if (!valor) error = "Valor inválido.";
    else if (!accountId) error = `Conta "${contaRaw}" não encontrada.`;
    else if (tipo === "transferencia" && !contaDestinoId) {
      error = `Conta de destino "${categoriaRaw}" não encontrada.`;
    } else if (tipo !== "transferencia" && categoriaRaw.trim() && !categoryId) {
      error = `Categoria "${categoriaRaw}" não encontrada.`;
    }

    const duplicate =
      !error && accountId && data && valor && tipo
        ? existingKeys.has(`${accountId}|${data}|${valor}|${tipo}|${descricao ?? ""}`)
        : false;

    rows.push({
      index: i,
      data,
      tipo,
      valor,
      contaNome: contaRaw,
      categoriaNome: categoriaRaw,
      descricao,
      formaPagamento,
      accountId,
      categoryId,
      contaDestinoId,
      error,
      duplicate,
    });
  }

  return { rows, errorGeral: null };
}

export interface ImportPreviewState {
  error?: string;
  rows?: ParsedImportRow[];
  totalLinhas?: number;
  totalValidas?: number;
  totalDuplicadas?: number;
  totalComErro?: number;
}

export async function previewImportCsv(formData: FormData): Promise<ImportPreviewState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const file = formData.get("arquivo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione um arquivo CSV." };
  }
  if (file.size > MAX_IMPORT_SIZE) {
    return { error: "Arquivo muito grande (máximo 2 MB)." };
  }

  const text = await file.text();
  const { rows, errorGeral } = await parseRows(supabase, user.id, text);
  if (errorGeral) return { error: errorGeral };

  return {
    rows: rows.slice(0, MAX_PREVIEW_ROWS),
    totalLinhas: rows.length,
    totalValidas: rows.filter((r) => !r.error && !r.duplicate).length,
    totalDuplicadas: rows.filter((r) => r.duplicate).length,
    totalComErro: rows.filter((r) => r.error).length,
  };
}

export async function importTransactionsCsv(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const file = formData.get("arquivo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione um arquivo CSV." };
  }
  if (file.size > MAX_IMPORT_SIZE) {
    return { error: "Arquivo muito grande (máximo 2 MB)." };
  }

  const text = await file.text();
  const { rows, errorGeral } = await parseRows(supabase, user.id, text);
  if (errorGeral) return { error: errorGeral };

  const validas = rows.filter((r) => !r.error && !r.duplicate);
  if (validas.length === 0) {
    return { error: "Nenhuma linha válida e não-duplicada pra importar." };
  }

  const inserts = validas.map((r) => ({
    user_id: user.id,
    account_id: r.accountId!,
    conta_destino_id: r.tipo === "transferencia" ? r.contaDestinoId : null,
    category_id: r.tipo === "transferencia" ? null : r.categoryId,
    valor: r.valor!,
    tipo: r.tipo!,
    data: r.data!,
    descricao: r.descricao,
    forma_pagamento: r.formaPagamento,
    recorrencia: "unica" as const,
    origem: "web" as const,
    status: "ativo" as const,
  }));

  const { error } = await supabase.from("transactions").insert(inserts);
  if (error) return { error: error.message };

  revalidatePath("/transacoes");
  revalidatePath("/dashboard");
  return { warning: `${inserts.length} lançamento(s) importado(s) com sucesso.` };
}
