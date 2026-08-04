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
import { PageHeader } from "@/components/layout/PageHeader";

function KpiCard({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className="surface-card p-5">
      <p className="field-label">{label}</p>
      <p
        className={`font-display mt-2 text-2xl font-semibold ${
          tone === "up" ? "text-emerald" : tone === "down" ? "text-wine" : "text-ink"
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
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Visão geral" title="Painel" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="surface-card bg-navy p-6 sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold-soft">
            Saldo consolidado
          </p>
          <p className="font-display mt-2 text-4xl font-semibold text-gold-strong">
            {formatBRL(saldo)}
          </p>
        </div>
        <KpiCard label="Entradas do mês" value={formatBRL(entradas)} tone="up" />
        <KpiCard label="Saídas do mês" value={formatBRL(saidas)} tone="down" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Projeção fim do mês" value={formatBRL(projecao)} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="surface-card p-5">
          <h2 className="field-label mb-4">Gastos por categoria (mês atual)</h2>
          <CategoryPieChart data={distribuicao} />
        </div>
        <div className="surface-card p-5">
          <h2 className="field-label mb-4">Entradas x saídas (últimos 6 meses)</h2>
          <MonthlyComparisonChart data={comparativo} />
        </div>
      </div>
    </div>
  );
}
