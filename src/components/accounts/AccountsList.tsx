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
    return <p className="text-sm text-ink-muted">Nenhuma conta cadastrada ainda.</p>;
  }

  return (
    <ul className="surface-card flex flex-col divide-y divide-border-soft overflow-hidden">
      {accounts.map((account) => (
        <li key={account.id} className="flex items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-medium text-ink">
              {account.nome}
              {!account.ativo && <span className="ml-2 text-xs text-ink-muted">(inativa)</span>}
            </p>
            <p className="text-xs text-ink-muted">{TIPO_LABELS[account.tipo]}</p>
          </div>
          <div className="flex items-center gap-5">
            <span className="font-display text-base font-semibold text-ink">
              {formatBRL(balances.get(account.id) ?? account.saldo_inicial)}
            </span>
            <form
              action={async () => {
                "use server";
                await setAccountAtivo(account.id, !account.ativo);
              }}
            >
              <button type="submit" className="text-xs font-medium text-ink-muted hover:text-gold">
                {account.ativo ? "Desativar" : "Reativar"}
              </button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}
