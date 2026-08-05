import type { Category } from "@/types/database";

export function TransactionFilters({
  mes,
  categories,
  values,
}: {
  mes: string;
  categories: Category[];
  values: { q?: string; categoria?: string; tipo?: string; valorMin?: string; valorMax?: string };
}) {
  const temFiltro = values.q || values.categoria || values.tipo || values.valorMin || values.valorMax;

  return (
    <form method="get" className="surface-card flex flex-wrap items-end gap-3 p-4">
      <input type="hidden" name="mes" value={mes} />
      <label className="flex flex-col gap-1.5">
        <span className="field-label">Buscar</span>
        <input
          type="text"
          name="q"
          defaultValue={values.q}
          placeholder="Descrição..."
          className="field-input w-40"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="field-label">Categoria</span>
        <select name="categoria" defaultValue={values.categoria ?? ""} className="field-input w-36">
          <option value="">Todas</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="field-label">Tipo</span>
        <select name="tipo" defaultValue={values.tipo ?? ""} className="field-input w-32">
          <option value="">Todos</option>
          <option value="receita">Receita</option>
          <option value="despesa">Despesa</option>
          <option value="transferencia">Transferência</option>
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="field-label">Valor mín. (R$)</span>
        <input
          type="number"
          step="0.01"
          name="valor_min"
          defaultValue={values.valorMin}
          className="field-input w-28"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="field-label">Valor máx. (R$)</span>
        <input
          type="number"
          step="0.01"
          name="valor_max"
          defaultValue={values.valorMax}
          className="field-input w-28"
        />
      </label>
      <button type="submit" className="btn-navy">
        Filtrar
      </button>
      {temFiltro && (
        <a href={`/transacoes?mes=${mes}`} className="text-xs text-ink-muted hover:text-wine">
          Limpar filtros
        </a>
      )}
    </form>
  );
}
