import { formatBRL } from "@/lib/finance";
import type { SubscriptionCandidate } from "@/lib/finance";
import type { Category } from "@/types/database";

export function SubscriptionsCard({
  candidates,
  categories,
}: {
  candidates: SubscriptionCandidate[];
  categories: Category[];
}) {
  if (candidates.length === 0) return null;

  return (
    <div className="surface-card p-5">
      <h2 className="field-label mb-1">Possíveis assinaturas detectadas</h2>
      <p className="mb-4 text-xs text-ink-muted">
        Lançamentos com o mesmo valor e descrição que se repetem mês a mês. Considere criar um
        lançamento de recorrência fixa para não digitar de novo todo mês.
      </p>
      <ul className="flex flex-col gap-3">
        {candidates.map((c) => {
          const categoria = categories.find((cat) => cat.id === c.categoryId);
          return (
            <li
              key={`${c.descricao}-${c.valor}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-ink">{c.descricao}</p>
                <p className="text-xs text-ink-muted">
                  {categoria?.nome ?? "Sem categoria"} · {c.meses.length} meses seguidos
                </p>
              </div>
              <span className="font-display text-sm font-semibold text-ink">
                {formatBRL(c.valor)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
