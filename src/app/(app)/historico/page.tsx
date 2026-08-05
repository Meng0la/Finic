import { getAccounts, getAuditLog, getCategories } from "@/lib/data";
import { PageHeader } from "@/components/layout/PageHeader";
import { AuditLogList } from "@/components/history/AuditLogList";

export default async function HistoricoPage() {
  const [entries, accounts, categories] = await Promise.all([
    getAuditLog(150),
    getAccounts(),
    getCategories(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Auditoria"
        title="Histórico"
        meta="Todo lançamento, edição e estorno, na ordem em que aconteceu"
      />
      <AuditLogList entries={entries} accounts={accounts} categories={categories} />
    </div>
  );
}
