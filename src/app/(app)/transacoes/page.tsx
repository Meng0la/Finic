import Link from "next/link";
import { getAccounts, getCategories, getTransactions } from "@/lib/data";
import { currentMonthRef, monthRange, shiftMonthRef } from "@/lib/finance";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { TransactionsList } from "@/components/transactions/TransactionsList";

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Transações</h1>
        <div className="flex items-center gap-3 text-sm">
          <Link href={`/transacoes?mes=${shiftMonthRef(mes, -1)}`} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
            ←
          </Link>
          <span className="font-medium">{mes}</span>
          <Link href={`/transacoes?mes=${shiftMonthRef(mes, 1)}`} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
            →
          </Link>
        </div>
      </div>
      <TransactionsList transactions={transactions} accounts={accounts} categories={categories} />
      <TransactionForm accounts={accounts} categories={categories} />
    </div>
  );
}
