import { getAccounts, getTransactions } from "@/lib/data";
import { accountBalance, consolidatedBalance, formatBRL } from "@/lib/finance";
import { AccountForm } from "@/components/accounts/AccountForm";
import { AccountsList } from "@/components/accounts/AccountsList";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function ContasPage() {
  const [accounts, transactions] = await Promise.all([getAccounts(), getTransactions()]);
  const balances = new Map(accounts.map((a) => [a.id, accountBalance(a, transactions)]));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Patrimônio"
        title="Contas"
        meta={
          <>
            Saldo consolidado{" "}
            <span className="font-display font-semibold text-ink">
              {formatBRL(consolidatedBalance(accounts, transactions))}
            </span>
          </>
        }
      />
      <AccountsList accounts={accounts} balances={balances} />
      <AccountForm />
    </div>
  );
}
