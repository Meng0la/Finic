import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAccounts, getCategories, getTransactions } from "@/lib/data";
import { monthRange, currentMonthRef } from "@/lib/finance";
import { toCsv } from "@/lib/csv";

const TIPO_LABELS: Record<string, string> = {
  receita: "Receita",
  despesa: "Despesa",
  transferencia: "Transferência",
};

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const mes = params.get("mes") ?? currentMonthRef();
  const { from, to } = monthRange(mes);

  const [accounts, categories, transactions] = await Promise.all([
    getAccounts(),
    getCategories(),
    getTransactions({
      from,
      to,
      q: params.get("q") || undefined,
      categoryId: params.get("categoria") || undefined,
      tipo: params.get("tipo") || undefined,
      valorMin: params.get("valor_min") ? Number(params.get("valor_min")) : undefined,
      valorMax: params.get("valor_max") ? Number(params.get("valor_max")) : undefined,
    }),
  ]);

  const accountName = (id: string) => accounts.find((a) => a.id === id)?.nome ?? "";
  const categoryName = (id: string | null) => categories.find((c) => c.id === id)?.nome ?? "";

  const rows = transactions.map((t) => [
    t.data,
    TIPO_LABELS[t.tipo] ?? t.tipo,
    t.valor.toFixed(2).replace(".", ","),
    accountName(t.account_id),
    t.tipo === "transferencia" ? accountName(t.conta_destino_id ?? "") : categoryName(t.category_id),
    t.descricao ?? "",
    t.forma_pagamento ?? "",
    t.status === "estornado" ? "Estornado" : "Ativo",
    t.origem === "whatsapp" ? "WhatsApp" : "Web",
  ]);

  const csv = toCsv(
    ["Data", "Tipo", "Valor", "Conta", "Categoria/Destino", "Descrição", "Forma de pagamento", "Status", "Origem"],
    rows
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="finic-transacoes-${mes}.csv"`,
    },
  });
}
