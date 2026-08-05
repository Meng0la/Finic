import { formatBRL } from "@/lib/finance";
import type { InvestmentSuggestion } from "@/types/database";

const RISK_LABELS: Record<string, string> = {
  conservador: "Conservador",
  moderado: "Moderado",
  arrojado: "Arrojado",
};

const BAR_COLORS = ["#a3813c", "#1f6d4a", "#16213a", "#8c2f39", "#636b80", "#a8752a"];

export function SuggestionCard({
  suggestion,
  highlight = false,
}: {
  suggestion: InvestmentSuggestion;
  highlight?: boolean;
}) {
  const data = suggestion.sugestao;

  return (
    <div className={`surface-card p-6 ${highlight ? "border-gold" : ""}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs text-ink-muted">
            {new Date(suggestion.created_at).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}{" "}
            · {RISK_LABELS[suggestion.perfil_risco] ?? suggestion.perfil_risco}
          </p>
          <p className="font-display text-lg font-semibold text-ink">
            {formatBRL(suggestion.valor_base)}
          </p>
        </div>
      </div>

      {data?.resumo && <p className="mb-4 text-sm leading-relaxed text-ink">{data.resumo}</p>}

      {Array.isArray(data?.alocacao) && data.alocacao.length > 0 && (
        <ul className="mb-4 flex flex-col gap-3">
          {data.alocacao.map((item, i) => (
            <li key={`${item.categoria}-${i}`}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-ink">{item.categoria}</span>
                <span className="font-display font-semibold text-ink">{item.percentual}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, item.percentual)}%`,
                    backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
                  }}
                />
              </div>
              {item.justificativa && (
                <p className="mt-1 text-xs text-ink-muted">{item.justificativa}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {Array.isArray(data?.alertas) && data.alertas.length > 0 && (
        <ul className="flex flex-col gap-1 border-t border-border-soft pt-3 text-xs text-ink-muted">
          {data.alertas.map((alerta, i) => (
            <li key={i}>· {alerta}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
