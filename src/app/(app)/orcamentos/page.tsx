import { getBudgets, getCategories, getTransactions } from "@/lib/data";
import { currentMonthRef, formatBRL, monthRange } from "@/lib/finance";
import { deleteBudget } from "@/lib/actions/budgets";
import { BudgetForm } from "@/components/budgets/BudgetForm";

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
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Orçamentos · {mes}
      </h1>

      {budgets.length === 0 ? (
        <p className="text-sm text-zinc-500">Nenhum orçamento definido para este mês.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {budgets.map((b) => {
            const categoria = categories.find((c) => c.id === b.category_id);
            const gasto = gastoPorCategoria.get(b.category_id) ?? 0;
            const percentual = Math.min(100, Math.round((gasto / b.limite_mensal) * 100));
            const alerta = percentual >= 100 ? "bg-red-500" : percentual >= 80 ? "bg-amber-500" : "bg-green-500";

            return (
              <li key={b.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {categoria?.nome ?? "—"}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-zinc-500">
                      {formatBRL(gasto)} de {formatBRL(b.limite_mensal)}
                    </span>
                    <form
                      action={async () => {
                        "use server";
                        await deleteBudget(b.id);
                      }}
                    >
                      <button type="submit" className="text-xs text-zinc-400 hover:text-red-600">
                        remover
                      </button>
                    </form>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div className={`h-full ${alerta}`} style={{ width: `${percentual}%` }} />
                </div>
                {percentual >= 80 && (
                  <p className="mt-1 text-xs text-amber-600">
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
