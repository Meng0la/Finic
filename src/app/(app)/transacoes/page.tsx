import Link from "next/link";
import { getAccounts, getCategories, getTransactions } from "@/lib/data";
import { currentMonthRef, monthRange, shiftMonthRef } from "@/lib/finance";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { TransactionsList } from "@/components/transactions/TransactionsList";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function TransacoesPage({
  searchParams,
}: {
  searchParams: Promise<{
    mes?: string;
    q?: string;
    categoria?: string;
    tipo?: string;
    valor_min?: string;
    valor_max?: string;
  }>;
}) {
  const params = await searchParams;
  const mes = params.mes ?? currentMonthRef();
  const { from, to } = monthRange(mes);

  const [accounts, categories, transactions] = await Promise.all([
    getAccounts(),
    getCategories(),
    getTransactions({
      from,
      to,
      q: params.q || undefined,
      categoryId: params.categoria || undefined,
      tipo: params.tipo || undefined,
      valorMin: params.valor_min ? Number(params.valor_min) : undefined,
      valorMax: params.valor_max ? Number(params.valor_max) : undefined,
    }),
  ]);

  const exportQuery = new URLSearchParams({ mes }).toString();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Movimentação"
        title="Transações"
        meta={
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Link
                href={`/transacoes?mes=${shiftMonthRef(mes, -1)}`}
                className="text-ink-muted hover:text-gold"
              >
                ←
              </Link>
              <span className="font-display font-semibold text-ink">{mes}</span>
              <Link
                href={`/transacoes?mes=${shiftMonthRef(mes, 1)}`}
                className="text-ink-muted hover:text-gold"
              >
                →
              </Link>
            </div>
            <a
              href={`/transacoes/exportar?${exportQuery}`}
              className="text-xs font-medium text-ink-muted hover:text-gold"
            >
              Exportar CSV
            </a>
            <Link
              href="/transacoes/importar"
              className="text-xs font-medium text-ink-muted hover:text-gold"
            >
              Importar CSV
            </Link>
          </div>
        }
      />
      <TransactionFilters
        mes={mes}
        categories={categories}
        values={{
          q: params.q,
          categoria: params.categoria,
          tipo: params.tipo,
          valorMin: params.valor_min,
          valorMax: params.valor_max,
        }}
      />
      <TransactionsList transactions={transactions} accounts={accounts} categories={categories} />
      <TransactionForm accounts={accounts} categories={categories} />
    </div>
  );
}
