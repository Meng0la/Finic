import { getCategories } from "@/lib/data";
import { deleteCategory } from "@/lib/actions/categories";
import { CategoryForm } from "@/components/categories/CategoryForm";
import type { Category } from "@/types/database";

function CategoryGroup({ title, items }: { title: string; items: Category[] }) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-medium text-zinc-500">{title}</h2>
      <ul className="flex flex-wrap gap-2">
        {items.map((c) => (
          <li
            key={c.id}
            className="flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1 text-sm dark:border-zinc-800"
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.cor }} />
            {c.nome}
            {!c.is_padrao && (
              <form
                action={async () => {
                  "use server";
                  await deleteCategory(c.id);
                }}
              >
                <button type="submit" className="text-zinc-400 hover:text-red-600">
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
  const categories = await getCategories();
  const receitas = categories.filter((c) => c.tipo === "receita");
  const despesas = categories.filter((c) => c.tipo === "despesa");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Categorias</h1>
      <CategoryGroup title="Receitas" items={receitas} />
      <CategoryGroup title="Despesas" items={despesas} />
      <CategoryForm />
    </div>
  );
}
