import type { Account, Category, Transaction } from "@/types/database";

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function accountBalance(account: Account, transactions: Transaction[]): number {
  let saldo = account.saldo_inicial;
  for (const t of transactions) {
    if (t.status !== "ativo") continue;
    if (t.account_id === account.id) {
      if (t.tipo === "receita") saldo += t.valor;
      else if (t.tipo === "despesa") saldo -= t.valor;
      else if (t.tipo === "transferencia") saldo -= t.valor;
    }
    if (t.conta_destino_id === account.id && t.tipo === "transferencia") {
      saldo += t.valor;
    }
  }
  return saldo;
}

export function consolidatedBalance(accounts: Account[], transactions: Transaction[]): number {
  return accounts
    .filter((a) => a.ativo)
    .reduce((sum, a) => sum + accountBalance(a, transactions), 0);
}

export function monthRange(mesReferencia: string): { from: string; to: string } {
  const [year, month] = mesReferencia.split("-").map(Number);
  const from = `${mesReferencia}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${mesReferencia}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}

export function currentMonthRef(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function shiftMonthRef(mesReferencia: string, delta: number): string {
  const [year, month] = mesReferencia.split("-").map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthTotals(transactions: Transaction[]): { entradas: number; saidas: number } {
  let entradas = 0;
  let saidas = 0;
  for (const t of transactions) {
    if (t.status !== "ativo") continue;
    if (t.tipo === "receita") entradas += t.valor;
    else if (t.tipo === "despesa") saidas += t.valor;
  }
  return { entradas, saidas };
}

export function spendByCategory(
  transactions: Transaction[],
  categories: Category[]
): { categoria: string; cor: string; total: number }[] {
  const totals = new Map<string, number>();
  for (const t of transactions) {
    if (t.status !== "ativo" || t.tipo !== "despesa") continue;
    const key = t.category_id ?? "sem-categoria";
    totals.set(key, (totals.get(key) ?? 0) + t.valor);
  }
  return Array.from(totals.entries())
    .map(([categoryId, total]) => {
      const cat = categories.find((c) => c.id === categoryId);
      return { categoria: cat?.nome ?? "Sem categoria", cor: cat?.cor ?? "#94a3b8", total };
    })
    .sort((a, b) => b.total - a.total);
}

export function monthlyComparison(
  transactions: Transaction[],
  months: string[]
): { mes: string; entradas: number; saidas: number }[] {
  return months.map((mes) => {
    const { entradas, saidas } = monthTotals(
      transactions.filter((t) => t.data.startsWith(mes))
    );
    return { mes, entradas, saidas };
  });
}

export function lastMonths(count: number, ref = currentMonthRef()): string[] {
  return Array.from({ length: count }, (_, i) => shiftMonthRef(ref, i - (count - 1)));
}

/**
 * Soma apenas lançamentos já registrados (recorrentes/parcelados incluídos)
 * com data entre amanhã e o fim do mês — nunca extrapola uma média. Se não
 * há nada agendado, a projeção é igual ao saldo atual.
 */
export function projectedMonthEndBalance(
  saldoAtual: number,
  transactionsThisMonth: Transaction[],
  today = new Date()
): number {
  const todayStr = today.toISOString().slice(0, 10);

  let net = 0;
  for (const t of transactionsThisMonth) {
    if (t.status !== "ativo" || t.data <= todayStr) continue;
    if (t.tipo === "receita") net += t.valor;
    else if (t.tipo === "despesa") net -= t.valor;
  }

  return saldoAtual + net;
}
