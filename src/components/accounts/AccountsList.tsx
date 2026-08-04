import { setAccountAtivo } from "@/lib/actions/accounts";
import { formatBRL } from "@/lib/finance";
import type { Account } from "@/types/database";

const TIPO_LABELS: Record<Account["tipo"], string> = {
  corrente: "Conta corrente",
  poupanca: "Poupança",
  dinheiro: "Dinheiro / carteira",
  cartao: "Cartão de crédito",
};

export function AccountsList({
  accounts,
  balances,
}: {
  accounts: Account[];
  balances: Map<string, number>;
}) {
  if (accounts.length === 0) {
    return <p className="text-sm text-zinc-500">Nenhuma conta cadastrada ainda.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
      {accounts.map((account) => (
        <li key={account.id} className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {account.nome}
              {!account.ativo && <span className="ml-2 text-xs text-zinc-400">(inativa)</span>}
            </p>
            <p className="text-xs text-zinc-500">{TIPO_LABELS[account.tipo]}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {formatBRL(balances.get(account.id) ?? account.saldo_inicial)}
            </span>
            <form
              action={async () => {
                "use server";
                await setAccountAtivo(account.id, !account.ativo);
              }}
            >
              <button type="submit" className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                {account.ativo ? "Desativar" : "Reativar"}
              </button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}
