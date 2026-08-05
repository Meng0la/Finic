import { formatBRL } from "@/lib/finance";
import type { InvestmentSuggestion } from "@/types/database";

const RISK_LABELS: Record<string, string> = {
  conservador: "Conservador",
  moderado: "Moderado",
  arrojado: "Arrojado",
};

const EXPERIENCE_LABELS: Record<string, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

const ITEM_RISK_STYLE: Record<string, string> = {
  baixo: "bg-emerald/10 text-emerald",
  medio: "bg-amber/10 text-amber",
  alto: "bg-wine/10 text-wine",
};

const ITEM_RISK_LABEL: Record<string, string> = {
  baixo: "Risco baixo",
  medio: "Risco médio",
  alto: "Risco alto",
};

const BAR_COLORS = ["#a3813c", "#1f6d4a", "#16213a", "#8c2f39", "#636b80", "#a8752a", "#5c3a5c"];

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
            · {RISK_LABELS[suggestion.perfil_risco] ?? suggestion.perfil_risco} ·{" "}
            {EXPERIENCE_LABELS[suggestion.experiencia] ?? suggestion.experiencia}
          </p>
          <p className="font-display text-lg font-semibold text-ink">
            {formatBRL(suggestion.valor_base)}
          </p>
        </div>
      </div>

      {data?.resumo && <p className="mb-5 text-sm leading-relaxed text-ink">{data.resumo}</p>}

      {Array.isArray(data?.alocacao) && data.alocacao.length > 0 && (
        <ul className="mb-5 flex flex-col gap-5">
          {data.alocacao.map((item, i) => {
            const valorItem = (suggestion.valor_base * item.percentual) / 100;
            return (
              <li key={`${item.categoria}-${i}`} className="border-t border-border-soft pt-4 first:border-t-0 first:pt-0">
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-display font-semibold text-ink">{item.categoria}</span>
                  <div className="flex items-center gap-2">
                    {item.risco && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${ITEM_RISK_STYLE[item.risco] ?? "bg-surface-alt text-ink-muted"}`}
                      >
                        {ITEM_RISK_LABEL[item.risco] ?? item.risco}
                      </span>
                    )}
                    <span className="font-display font-semibold text-ink">
                      {item.percentual}% · {formatBRL(valorItem)}
                    </span>
                  </div>
                </div>
                <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, item.percentual)}%`,
                      backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
                    }}
                  />
                </div>
                {item.explicacao && (
                  <div className="mb-2">
                    <p className="field-label mb-0.5">O que é</p>
                    <p className="text-sm leading-relaxed text-ink-muted">{item.explicacao}</p>
                  </div>
                )}
                {item.como_investir && (
                  <div>
                    <p className="field-label mb-0.5">Como aplicar</p>
                    <p className="text-sm leading-relaxed text-ink-muted">{item.como_investir}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {Array.isArray(data?.alertas) && data.alertas.length > 0 && (
        <ul className="mb-4 flex flex-col gap-1 border-t border-border-soft pt-3 text-xs text-ink-muted">
          {data.alertas.map((alerta, i) => (
            <li key={i}>· {alerta}</li>
          ))}
        </ul>
      )}

      {Array.isArray(data?.fontes) && data.fontes.length > 0 && (
        <div className="border-t border-border-soft pt-3">
          <p className="field-label mb-2">Fontes consultadas pela IA (pesquisa, não são links de compra)</p>
          <ul className="flex flex-col gap-1">
            {data.fontes.map((fonte, i) => (
              <li key={i}>
                <a
                  href={fonte.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-ink-muted underline decoration-border hover:text-gold"
                >
                  {fonte.titulo}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
