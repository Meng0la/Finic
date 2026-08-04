import { getAccounts, getCategories, getTransactions } from "@/lib/data";
import {
  consolidatedBalance,
  currentMonthRef,
  formatBRL,
  lastMonths,
  monthRange,
  monthTotals,
  monthlyComparison,
  projectedMonthEndBalance,
  spendByCategory,
} from "@/lib/finance";
import { CategoryPieChart, MonthlyComparisonChart } from "@/components/dashboard/DashboardCharts";

function KpiCard({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <p className="text-xs text-zinc-500">{label}</p>
      <p
        className={`mt-1 text-xl font-semibold ${
          tone === "up" ? "text-green-600" : tone === "down" ? "text-red-600" : "text-zinc-900 dark:text-zinc-50"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default async function DashboardPage() {
  const mes = currentMonthRef();
  const { from, to } = monthRange(mes);
  const months = lastMonths(6);
  const rangeStart = `${months[0]}-01`;

  const [accounts, categories, transactionsAllTime, transactionsRange] = await Promise.all([
    getAccounts(),
    getCategories(),
    getTransactions(),
    getTransactions({ from: rangeStart, to }),
  ]);

  const transactionsMes = transactionsRange.filter((t) => t.data >= from && t.data <= to);

  const saldo = consolidatedBalance(accounts, transactionsAllTime);
  const { entradas, saidas } = monthTotals(transactionsMes);
  const projecao = projectedMonthEndBalance(saldo, transactionsMes);
  const distribuicao = spendByCategory(transactionsMes, categories);
  const comparativo = monthlyComparison(transactionsRange, months);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Painel</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="Saldo consolidado" value={formatBRL(saldo)} />
        <KpiCard label="Entradas do mês" value={formatBRL(entradas)} tone="up" />
        <KpiCard label="Saídas do mês" value={formatBRL(saidas)} tone="down" />
        <KpiCard label="Projeção fim do mês" value={formatBRL(projecao)} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Gastos por categoria (mês atual)
          </h2>
          <CategoryPieChart data={distribuicao} />
        </div>
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Entradas x saídas (últimos 6 meses)
          </h2>
          <MonthlyComparisonChart data={comparativo} />
        </div>
      </div>
    </div>
  );
}
