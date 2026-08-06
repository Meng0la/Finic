import Link from "next/link";
import { getAccounts, getBillPayments, getBills, getCategories, getTransactions } from "@/lib/data";
import {
  consolidatedBalance,
  currentMonthRef,
  detectSubscriptions,
  formatBRL,
  lastMonths,
  monthRange,
  monthTotals,
  monthlyComparison,
  netWorthHistory,
  projectedMonthEndBalance,
  spendByCategory,
} from "@/lib/finance";
import {
  CategoryPieChart,
  MonthlyComparisonChart,
  NetWorthChart,
} from "@/components/dashboard/DashboardCharts";
import { SubscriptionsCard } from "@/components/dashboard/SubscriptionsCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { LuxuryAurora } from "@/components/brand/LuxuryAurora";

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

  const [accounts, categories, transactionsAllTime, transactionsRange, bills, billPayments] =
    await Promise.all([
      getAccounts(),
      getCategories(),
      getTransactions(),
      getTransactions({ from: rangeStart, to }),
      getBills(),
      getBillPayments(mes),
    ]);

  const transactionsMes = transactionsRange.filter((t) => t.data >= from && t.data <= to);

  const saldo = consolidatedBalance(accounts, transactionsAllTime);
  const { entradas, saidas } = monthTotals(transactionsMes);
  const projecao = projectedMonthEndBalance(saldo, transactionsMes);
  const distribuicao = spendByCategory(transactionsMes, categories);
  const comparativo = monthlyComparison(transactionsRange, months);
  const evolucaoPatrimonio = netWorthHistory(accounts, transactionsAllTime, months);
  const assinaturas = detectSubscriptions(transactionsRange, lastMonths(3));

  const hoje = new Date().getDate();
  const pagas = new Set(billPayments.map((p) => p.bill_id));
  const contasAVencer = bills
    .filter((b) => !pagas.has(b.id) && b.dia_vencimento - hoje <= 7)
    .sort((a, b) => a.dia_vencimento - b.dia_vencimento);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Visão geral" title="Painel" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="surface-card relative overflow-hidden bg-navy p-6 sm:col-span-2">
          <LuxuryAurora particleCount={12} vignette={false} />
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold-soft">
              Saldo consolidado
            </p>
            <p className="font-display mt-2 text-4xl font-semibold text-gold-strong">
              {formatBRL(saldo)}
            </p>
          </div>
        </div>
        <KpiCard label="Entradas do mês" value={formatBRL(entradas)} tone="up" />
        <KpiCard label="Saídas do mês" value={formatBRL(saidas)} tone="down" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <KpiCard label="Projeção fim do mês" value={formatBRL(projecao)} />
          <p className="mt-2 text-xs text-ink-muted">
            Saldo atual + lançamentos já agendados até o fim do mês. Não extrapola médias.
          </p>
        </div>
      </div>

      {contasAVencer.length > 0 && (
        <div className="surface-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="field-label">Contas a vencer nos próximos 7 dias</h2>
            <Link href="/contas-a-pagar" className="text-xs text-gold hover:text-gold-strong">
              ver todas
            </Link>
          </div>
          <ul className="flex flex-col gap-2">
            {contasAVencer.map((b) => (
              <li key={b.id} className="flex items-center justify-between text-sm">
                <span className="text-ink">
                  {b.nome} <span className="text-ink-muted">· dia {b.dia_vencimento}</span>
                </span>
                <span className="font-medium text-ink">{formatBRL(b.valor)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

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

      <div className="surface-card p-5">
        <h2 className="field-label mb-4">Evolução do patrimônio (últimos 6 meses)</h2>
        <NetWorthChart data={evolucaoPatrimonio} />
      </div>

      <SubscriptionsCard candidates={assinaturas} categories={categories} />
    </div>
  );
}
