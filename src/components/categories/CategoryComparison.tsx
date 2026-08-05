import { formatBRL } from "@/lib/finance";
import type { CategoryComparisonItem } from "@/lib/finance";

export function CategoryComparison({ items }: { items: CategoryComparisonItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-ink-muted">Sem despesas para comparar ainda.</p>;
  }

  return (
    <div className="surface-card p-6">
      <h2 className="field-label mb-4">Comparado ao mês anterior</h2>
      <ul className="flex flex-col divide-y divide-border-soft">
        {items.map((item) => (
          <li key={item.categoria} className="flex items-center justify-between gap-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.cor }} />
              <span className="text-sm text-ink">{item.categoria}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-ink-muted">{formatBRL(item.atual)}</span>
              {item.deltaPercent === null ? (
                <span className="text-xs text-ink-muted">novo</span>
              ) : (
                <span
                  className={`text-xs font-medium ${
                    item.deltaPercent > 0
                      ? "text-wine"
                      : item.deltaPercent < 0
                        ? "text-emerald"
                        : "text-ink-muted"
                  }`}
                >
                  {item.deltaPercent > 0 ? "↑" : item.deltaPercent < 0 ? "↓" : "="}{" "}
                  {Math.abs(item.deltaPercent)}%
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
