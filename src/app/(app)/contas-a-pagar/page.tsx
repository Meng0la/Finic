import { getAccounts, getBillPayments, getBills, getCategories } from "@/lib/data";
import { currentMonthRef } from "@/lib/finance";
import { BillCard, type BillStatus } from "@/components/bills/BillCard";
import { BillForm } from "@/components/bills/BillForm";
import { PageHeader } from "@/components/layout/PageHeader";

function computeStatus(diaVencimento: number, hoje: number, paga: boolean): BillStatus {
  if (paga) return "paga";
  if (diaVencimento < hoje) return "atrasada";
  if (diaVencimento - hoje <= 7) return "vence_em_breve";
  return "pendente";
}

const STATUS_ORDER: Record<BillStatus, number> = {
  atrasada: 0,
  vence_em_breve: 1,
  pendente: 2,
  paga: 3,
};

export default async function ContasAPagarPage() {
  const mes = currentMonthRef();
  const hoje = new Date().getDate();

  const [bills, categories, accounts, payments] = await Promise.all([
    getBills(),
    getCategories(),
    getAccounts(),
    getBillPayments(mes),
  ]);

  const pagas = new Set(payments.map((p) => p.bill_id));

  const items = bills
    .map((bill) => ({
      bill,
      status: computeStatus(bill.dia_vencimento, hoje, pagas.has(bill.id)),
      categoriaNome: categories.find((c) => c.id === bill.category_id)?.nome ?? null,
    }))
    .sort(
      (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.bill.dia_vencimento - b.bill.dia_vencimento
    );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Planejamento" title="Contas a Pagar" meta={mes} />

      {items.length === 0 ? (
        <p className="text-sm text-ink-muted">Nenhuma conta fixa cadastrada ainda.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {items.map(({ bill, status, categoriaNome }) => (
            <BillCard key={bill.id} bill={bill} status={status} categoriaNome={categoriaNome} />
          ))}
        </ul>
      )}

      <BillForm categories={categories} accounts={accounts} />
    </div>
  );
}
