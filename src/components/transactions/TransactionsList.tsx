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
    return <p className="text-sm text-zinc-500">Nenhum lançamento neste período.</p>;
  }

  const accountName = (id: string) => accounts.find((a) => a.id === id)?.nome ?? "—";
  const categoryName = (id: string | null) => categories.find((c) => c.id === id)?.nome ?? "—";

  return (
    <ul className="flex flex-col divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
      {transactions.map((t) => (
        <li key={t.id} className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {t.descricao || TIPO_LABELS[t.tipo]}
              {t.status === "estornado" && (
                <span className="ml-2 text-xs text-zinc-400">(estornado)</span>
              )}
              {t.parcelas_total && (
                <span className="ml-2 text-xs text-zinc-400">
                  {t.parcela_atual}/{t.parcelas_total}
                </span>
              )}
            </p>
            <p className="text-xs text-zinc-500">
              {new Date(`${t.data}T00:00:00`).toLocaleDateString("pt-BR")} · {accountName(t.account_id)}
              {t.tipo !== "transferencia" && ` · ${categoryName(t.category_id)}`}
              {t.origem === "whatsapp" && " · via WhatsApp"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span
              className={`text-sm font-medium ${
                t.status === "estornado"
                  ? "text-zinc-400 line-through"
                  : t.tipo === "receita"
                    ? "text-green-600"
                    : t.tipo === "despesa"
                      ? "text-red-600"
                      : "text-zinc-900 dark:text-zinc-50"
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
                <button type="submit" className="text-xs text-zinc-500 hover:text-red-600">
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
