import { reverseTransaction } from "@/lib/actions/transactions";
import { formatBRL } from "@/lib/finance";
import type { Account, Category, Transaction } from "@/types/database";

const TIPO_LABELS: Record<Transaction["tipo"], string> = {
  receita: "Receita",
  despesa: "Despesa",
  transferencia: "Transferência",
};

export function TransactionsList({
  transactions,
  accounts,
  categories,
}: {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
}) {
  if (transactions.length === 0) {
    return <p className="text-sm text-ink-muted">Nenhum lançamento neste período.</p>;
  }

  const accountName = (id: string) => accounts.find((a) => a.id === id)?.nome ?? "—";
  const categoryName = (id: string | null) => categories.find((c) => c.id === id)?.nome ?? "—";

  return (
    <ul className="surface-card flex flex-col divide-y divide-border-soft overflow-hidden">
      {transactions.map((t) => (
        <li key={t.id} className="flex items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-medium text-ink">
              {t.descricao || TIPO_LABELS[t.tipo]}
              {t.status === "estornado" && (
                <span className="ml-2 text-xs text-ink-muted">(estornado)</span>
              )}
              {t.parcelas_total && (
                <span className="ml-2 text-xs text-ink-muted">
                  {t.parcela_atual}/{t.parcelas_total}
                </span>
              )}
            </p>
            <p className="text-xs text-ink-muted">
              {new Date(`${t.data}T00:00:00`).toLocaleDateString("pt-BR")} · {accountName(t.account_id)}
              {t.tipo !== "transferencia" && ` · ${categoryName(t.category_id)}`}
              {t.origem === "whatsapp" && " · via WhatsApp"}
            </p>
          </div>
          <div className="flex items-center gap-5">
            <span
              className={`font-display text-base font-semibold ${
                t.status === "estornado"
                  ? "text-ink-muted line-through"
                  : t.tipo === "receita"
                    ? "text-emerald"
                    : t.tipo === "despesa"
                      ? "text-wine"
                      : "text-ink"
              }`}
            >
              {t.tipo === "despesa" ? "-" : t.tipo === "receita" ? "+" : ""}
              {formatBRL(t.valor)}
            </span>
            {t.status === "ativo" && (
              <form
                action={async () => {
                  "use server";
                  await reverseTransaction(t.id);
                }}
              >
                <button type="submit" className="text-xs font-medium text-ink-muted hover:text-wine">
                  Estornar
                </button>
              </form>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
