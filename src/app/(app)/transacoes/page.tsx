import Link from "next/link";
import { getAccounts, getCategories, getTransactions } from "@/lib/data";
import { currentMonthRef, monthRange, shiftMonthRef } from "@/lib/finance";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { TransactionsList } from "@/components/transactions/TransactionsList";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function TransacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const params = await searchParams;
  const mes = params.mes ?? currentMonthRef();
  const { from, to } = monthRange(mes);

  const [accounts, categories, transactions] = await Promise.all([
    getAccounts(),
    getCategories(),
    getTransactions({ from, to }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Movimentação"
        title="Transações"
        meta={
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
        }
      />
      <TransactionsList transactions={transactions} accounts={accounts} categories={categories} />
      <TransactionForm accounts={accounts} categories={categories} />
    </div>
  );
}
