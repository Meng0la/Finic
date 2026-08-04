import { getBudgets, getCategories, getTransactions } from "@/lib/data";
import { currentMonthRef, formatBRL, monthRange } from "@/lib/finance";
import { deleteBudget } from "@/lib/actions/budgets";
import { BudgetForm } from "@/components/budgets/BudgetForm";
import { PageHeader } from "@/components/layout/PageHeader";

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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Planejamento" title="Orçamentos" meta={mes} />

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
              </li>
            );
          })}
        </ul>
      )}

      <BudgetForm categories={categories} mes={mes} />
    </div>
  );
}
