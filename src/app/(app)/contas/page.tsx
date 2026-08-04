import { getAccounts, getTransactions } from "@/lib/data";
import { accountBalance, consolidatedBalance, formatBRL } from "@/lib/finance";
import { AccountForm } from "@/components/accounts/AccountForm";
import { AccountsList } from "@/components/accounts/AccountsList";

export default async function ContasPage() {
  const [accounts, transactions] = await Promise.all([getAccounts(), getTransactions()]);
  const balances = new Map(accounts.map((a) => [a.id, accountBalance(a, transactions)]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Contas</h1>
        <p className="text-sm text-zinc-500">
          Saldo consolidado: <span className="font-medium">{formatBRL(consolidatedBalance(accounts, transactions))}</span>
        </p>
      </div>
      <AccountsList accounts={accounts} balances={balances} />
      <AccountForm />
    </div>
  );
}
