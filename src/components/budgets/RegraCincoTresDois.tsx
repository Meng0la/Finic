import { formatBRL } from "@/lib/finance";
import type { Category, GrupoOrcamentario, Transaction } from "@/types/database";

const METAS: Record<GrupoOrcamentario, { label: string; meta: number; cor: string }> = {
  essencial: { label: "Essenciais", meta: 50, cor: "bg-navy" },
  desejo: { label: "Desejos", meta: 30, cor: "bg-gold" },
  investimento: { label: "Investimentos", meta: 20, cor: "bg-emerald" },
};

export function RegraCincoTresDois({
  categories,
  transactions,
  entradas,
}: {
  categories: Category[];
  transactions: Transaction[];
  entradas: number;
}) {
  if (entradas <= 0) return null;

  const totals: Record<GrupoOrcamentario, number> = { essencial: 0, desejo: 0, investimento: 0 };
  let naoClassificado = 0;

  for (const t of transactions) {
    if (t.status !== "ativo" || t.tipo !== "despesa" || !t.category_id) continue;
    const grupo = categories.find((c) => c.id === t.category_id)?.grupo_orcamentario;
    if (grupo) totals[grupo] += t.valor;
    else naoClassificado += t.valor;
  }

  const temDados = totals.essencial + totals.desejo + totals.investimento + naoClassificado > 0;
  if (!temDados) return null;

  return (
    <div className="surface-card p-6">
      <h2 className="field-label mb-4">Regra 50/30/20</h2>
      <div className="flex flex-col gap-4">
        {(Object.keys(METAS) as GrupoOrcamentario[]).map((grupo) => {
          const { label, meta, cor } = METAS[grupo];
          const valor = totals[grupo];
          const percentual = Math.round((valor / entradas) * 100);
          const dentroDaMeta = grupo === "investimento" ? percentual >= meta : percentual <= meta;

          return (
            <div key={grupo}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-ink">{label}</span>
                <span className={dentroDaMeta ? "text-emerald" : "text-amber"}>
                  {percentual}% <span className="text-ink-muted">(meta {meta}%)</span>
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
                <div
                  className={`h-full ${cor}`}
                  style={{ width: `${Math.min(100, percentual)}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-ink-muted">{formatBRL(valor)}</p>
            </div>
          );
        })}
        {naoClassificado > 0 && (
          <p className="text-xs text-ink-muted">
            {formatBRL(naoClassificado)} em categorias sem grupo definido (não entram na conta
            acima) — defina o grupo na página de Categorias.
          </p>
        )}
      </div>
    </div>
  );
}
