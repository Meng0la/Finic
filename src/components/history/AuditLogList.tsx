import { formatBRL } from "@/lib/finance";
import type { Account, AuditLogEntry, Category } from "@/types/database";

const ACAO_LABELS: Record<string, string> = {
  insert: "Lançado",
  update: "Editado",
  estorno: "Estornado",
  soft_delete: "Removido",
};

const ACAO_STYLE: Record<string, string> = {
  insert: "bg-emerald/10 text-emerald",
  update: "bg-amber/10 text-amber",
  estorno: "bg-wine/10 text-wine",
  soft_delete: "bg-wine/10 text-wine",
};

const ORIGEM_LABELS: Record<string, string> = {
  web: "Web",
  whatsapp: "WhatsApp",
  sistema: "Sistema",
};

interface TransactionSnapshot {
  valor?: number;
  tipo?: "receita" | "despesa" | "transferencia";
  data?: string;
  descricao?: string | null;
  account_id?: string;
  category_id?: string | null;
}

export function AuditLogList({
  entries,
  accounts,
  categories,
}: {
  entries: AuditLogEntry[];
  accounts: Account[];
  categories: Category[];
}) {
  if (entries.length === 0) {
    return <p className="text-sm text-ink-muted">Nenhum evento registrado ainda.</p>;
  }

  const accountName = (id?: string) => accounts.find((a) => a.id === id)?.nome ?? "—";
  const categoryName = (id?: string | null) => categories.find((c) => c.id === id)?.nome ?? "—";

  return (
    <ul className="surface-card flex flex-col divide-y divide-border-soft overflow-hidden">
      {entries.map((entry) => {
        const snapshot = (entry.dado_novo ?? entry.dado_anterior) as TransactionSnapshot | null;
        const label = ACAO_LABELS[entry.acao] ?? entry.acao;
        const style = ACAO_STYLE[entry.acao] ?? "bg-surface-alt text-ink-muted";

        return (
          <li key={entry.id} className="flex items-center justify-between gap-4 px-6 py-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${style}`}>
                  {label}
                </span>
                <span className="text-xs text-ink-muted">
                  {ORIGEM_LABELS[entry.origem] ?? entry.origem}
                </span>
              </div>
              <p className="text-xs text-ink-muted">
                {new Date(entry.created_at).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {snapshot?.account_id && ` · ${accountName(snapshot.account_id)}`}
                {snapshot?.category_id !== undefined &&
                  snapshot.tipo !== "transferencia" &&
                  ` · ${categoryName(snapshot.category_id)}`}
              </p>
              {snapshot?.descricao && (
                <p className="mt-0.5 text-xs text-ink-muted">{snapshot.descricao}</p>
              )}
            </div>
            {typeof snapshot?.valor === "number" && (
              <span
                className={`font-display shrink-0 text-sm font-semibold ${
                  entry.acao === "estorno" || entry.acao === "soft_delete"
                    ? "text-ink-muted line-through"
                    : snapshot.tipo === "receita"
                      ? "text-emerald"
                      : snapshot.tipo === "despesa"
                        ? "text-wine"
                        : "text-ink"
                }`}
              >
                {snapshot.tipo === "despesa" ? "-" : snapshot.tipo === "receita" ? "+" : ""}
                {formatBRL(snapshot.valor)}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
