import { getBudgets, getCategories, getTransactions } from "@/lib/data";
import { currentMonthRef, daysLeftInMonth, formatBRL, monthRange, monthTotals } from "@/lib/finance";
import { deleteBudget } from "@/lib/actions/budgets";
import { BudgetForm } from "@/components/budgets/BudgetForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { RegraCincoTresDois } from "@/components/budgets/RegraCincoTresDois";

export default async function OrcamentosPage() {
  const mes = currentMonthRef();
  const { from, to } = monthRange(mes);

  const [budgets, categories, transactions] = await Promise.all([
    getBudgets(mes),
    getCategories(),
    getTransactions({ from, to }),
  ]);

  const gastoPorCategoria = new Map<string, number>();
  for (const t of transactions) {
    if (t.status !== "ativo" || t.tipo !== "despesa" || !t.category_id) continue;
    gastoPorCategoria.set(t.category_id, (gastoPorCategoria.get(t.category_id) ?? 0) + t.valor);
  }

  const { entradas } = monthTotals(transactions);
  const totalOrcado = budgets.reduce((sum, b) => sum + b.limite_mensal, 0);
  const totalGastoOrcado = budgets.reduce(
    (sum, b) => sum + (gastoPorCategoria.get(b.category_id) ?? 0),
    0
  );

  const categoriaInvestimentos = categories.find(
    (c) => c.nome === "Investimentos" && c.tipo === "despesa"
  );
  const investimentosTemOrcamento = categoriaInvestimentos
    ? budgets.some((b) => b.category_id === categoriaInvestimentos.id)
    : true;
  const gastoInvestimentos = categoriaInvestimentos
    ? (gastoPorCategoria.get(categoriaInvestimentos.id) ?? 0)
    : 0;
  // Se Investimentos já tem orçamento próprio, ele já está dentro de
  // totalGastoOrcado — evita contar o valor duas vezes na renda comprometida.
  const investimentosForaDoOrcamento = investimentosTemOrcamento ? 0 : gastoInvestimentos;

  const totalComprometido = totalGastoOrcado + investimentosForaDoOrcamento;
  const percentualOrcamento = entradas > 0 ? Math.round((totalGastoOrcado / entradas) * 100) : 0;
  const percentualInvestimentos =
    entradas > 0 ? Math.round((investimentosForaDoOrcamento / entradas) * 100) : 0;
  const percentualComprometido = entradas > 0 ? Math.round((totalComprometido / entradas) * 100) : 0;
  const percentualLivre = Math.max(0, 100 - percentualComprometido);

  const diasRestantes = daysLeftInMonth(mes);
  const totalRestanteOrcado = Math.max(0, totalOrcado - totalGastoOrcado);
  const disponivelPorDia = totalRestanteOrcado / diasRestantes;

  const mostrarResumo = budgets.length > 0 || gastoInvestimentos > 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Planejamento" title="Orçamentos" meta={mes} />

      {mostrarResumo && (
        <div className="surface-card p-6">
          <div className="mb-1 flex items-baseline justify-between">
            <span className="field-label">Renda comprometida este mês</span>
            <span className="font-display text-2xl font-semibold text-ink">
              {entradas > 0 ? `${percentualComprometido}%` : "—"}
            </span>
          </div>
          <p className="mb-4 text-xs text-ink-muted">
            {entradas > 0
              ? `De ${formatBRL(entradas)} em entradas, ${formatBRL(totalComprometido)} já está comprometido com orçamentos e investimentos.`
              : "Sem entradas registradas este mês para calcular o percentual."}
          </p>

          {entradas > 0 && (
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-alt">
              {percentualOrcamento > 0 && (
                <div className="h-full bg-navy" style={{ width: `${percentualOrcamento}%` }} />
              )}
              {percentualInvestimentos > 0 && (
                <div className="h-full bg-gold" style={{ width: `${percentualInvestimentos}%` }} />
              )}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs">
            <span className="flex items-center gap-1.5 text-ink-muted">
              <span className="h-2 w-2 rounded-full bg-navy" />
              Orçamentos: {formatBRL(totalGastoOrcado)} de {formatBRL(totalOrcado)} orçado (
              {percentualOrcamento}%)
            </span>
            {gastoInvestimentos > 0 && (
              <span className="flex items-center gap-1.5 text-ink-muted">
                <span className="h-2 w-2 rounded-full bg-gold" />
                Investimentos: {formatBRL(gastoInvestimentos)}
                {investimentosTemOrcamento ? " (dentro do orçamento acima)" : ` (${percentualInvestimentos}%)`}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-ink-muted">
              <span className="h-2 w-2 rounded-full bg-surface-alt ring-1 ring-inset ring-border" />
              Livre: {percentualLivre}%
            </span>
          </div>

          {totalOrcado > 0 && (
            <p className="mt-3 text-xs text-ink-muted">
              Sobram {formatBRL(totalRestanteOrcado)} de orçamento para {diasRestantes}{" "}
              {diasRestantes === 1 ? "dia" : "dias"} — cerca de{" "}
              <span className="font-medium text-ink">{formatBRL(disponivelPorDia)}/dia</span> até o
              fim do mês.
            </p>
          )}
        </div>
      )}

      <RegraCincoTresDois categories={categories} transactions={transactions} entradas={entradas} />

      {budgets.length === 0 ? (
        <p className="text-sm text-ink-muted">Nenhum orçamento definido para este mês.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {budgets.map((b) => {
            const categoria = categories.find((c) => c.id === b.category_id);
            const gasto = gastoPorCategoria.get(b.category_id) ?? 0;
            const percentual = Math.min(100, Math.round((gasto / b.limite_mensal) * 100));
            const alerta =
              percentual >= 100 ? "bg-wine" : percentual >= 80 ? "bg-amber" : "bg-emerald";
            const restanteCategoria = Math.max(0, b.limite_mensal - gasto);
            const porDiaCategoria = restanteCategoria / diasRestantes;

            return (
              <li key={b.id} className="surface-card p-6">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-ink">{categoria?.nome ?? "—"}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-sm font-semibold text-ink">
                      {formatBRL(gasto)}{" "}
                      <span className="font-sans font-normal text-ink-muted">
                        de {formatBRL(b.limite_mensal)}
                      </span>
                    </span>
                    <form
                      action={async () => {
                        "use server";
                        await deleteBudget(b.id);
                      }}
                    >
                      <button type="submit" className="text-xs text-ink-muted hover:text-wine">
                        remover
                      </button>
                    </form>
                  </div>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
                  <div className={`h-full ${alerta}`} style={{ width: `${percentual}%` }} />
                </div>
                {percentual >= 80 && (
                  <p className="mt-2 text-xs text-amber">
                    {percentual >= 100 ? "Limite atingido." : "80% do limite atingido."}
                  </p>
                )}
                {restanteCategoria > 0 && (
                  <p className="mt-2 text-xs text-ink-muted">
                    {formatBRL(porDiaCategoria)}/dia disponível até o fim do mês.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <BudgetForm categories={categories} mes={mes} />
    </div>
  );
}
