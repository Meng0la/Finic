import { getCategories, getTransactions } from "@/lib/data";
import { deleteCategory } from "@/lib/actions/categories";
import { CategoryForm } from "@/components/categories/CategoryForm";
import { CategoryComparison } from "@/components/categories/CategoryComparison";
import { CategoryGroupSelect } from "@/components/categories/CategoryGroupSelect";
import { PageHeader } from "@/components/layout/PageHeader";
import { categoryComparison, currentMonthRef, monthRange, shiftMonthRef } from "@/lib/finance";
import type { Category } from "@/types/database";

function CategoryGroup({
  title,
  items,
  mostrarGrupo,
}: {
  title: string;
  items: Category[];
  mostrarGrupo?: boolean;
}) {
  return (
    <div className="surface-card p-6">
      <h2 className="field-label mb-3">{title}</h2>
      <ul className="flex flex-wrap gap-2">
        {items.map((c) => (
          <li
            key={c.id}
            className="flex items-center gap-2 rounded-full border border-border bg-surface-alt px-3 py-1.5 text-sm text-ink"
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.cor }} />
            {c.nome}
            {mostrarGrupo && <CategoryGroupSelect categoryId={c.id} value={c.grupo_orcamentario} />}
            {!c.is_padrao && (
              <form
                action={async () => {
                  "use server";
                  await deleteCategory(c.id);
                }}
              >
                <button type="submit" className="text-ink-muted hover:text-wine">
                  ×
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function CategoriasPage() {
  const mesAtual = currentMonthRef();
  const mesAnterior = shiftMonthRef(mesAtual, -1);
  const rangeAtual = monthRange(mesAtual);
  const rangeAnterior = monthRange(mesAnterior);

  const [categories, transactionsAtual, transactionsAnterior] = await Promise.all([
    getCategories(),
    getTransactions(rangeAtual),
    getTransactions(rangeAnterior),
  ]);

  const receitas = categories.filter((c) => c.tipo === "receita");
  const despesas = categories.filter((c) => c.tipo === "despesa");
  const comparativo = categoryComparison(transactionsAtual, transactionsAnterior, categories);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Organização" title="Categorias" />
      <CategoryComparison items={comparativo} />
      <CategoryGroup title="Receitas" items={receitas} />
      <CategoryGroup title="Despesas" items={despesas} mostrarGrupo />
      <p className="text-xs text-ink-muted">
        O grupo (essencial/desejo/investimento) de cada categoria de despesa é usado no card
        &quot;Regra 50/30/20&quot; da página de Orçamentos.
      </p>
      <CategoryForm />
    </div>
  );
}
