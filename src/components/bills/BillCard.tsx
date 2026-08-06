"use client";

import { deleteBill, markBillPaid, unmarkBillPaid } from "@/lib/actions/bills";
import { formatBRL } from "@/lib/finance";
import type { Bill } from "@/types/database";

export type BillStatus = "paga" | "atrasada" | "vence_em_breve" | "pendente";

const STATUS_LABEL: Record<BillStatus, string> = {
  paga: "Paga",
  atrasada: "Atrasada",
  vence_em_breve: "Vence em breve",
  pendente: "Pendente",
};

const STATUS_COLOR: Record<BillStatus, string> = {
  paga: "bg-emerald/10 text-emerald",
  atrasada: "bg-wine/10 text-wine",
  vence_em_breve: "bg-amber/10 text-amber",
  pendente: "bg-surface-alt text-ink-muted",
};

export function BillCard({
  bill,
  status,
  categoriaNome,
}: {
  bill: Bill;
  status: BillStatus;
  categoriaNome: string | null;
}) {
  return (
    <li className="surface-card flex items-center justify-between gap-4 p-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-ink">{bill.nome}</span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLOR[status]}`}>
            {STATUS_LABEL[status]}
          </span>
        </div>
        <p className="mt-1 text-xs text-ink-muted">
          Vence dia {bill.dia_vencimento}
          {categoriaNome ? ` · ${categoriaNome}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-display text-sm font-semibold text-ink">{formatBRL(bill.valor)}</span>
        {status === "paga" ? (
          <form action={unmarkBillPaid.bind(null, bill.id)}>
            <button type="submit" className="text-xs text-ink-muted hover:text-wine">
              desfazer
            </button>
          </form>
        ) : (
          <form action={markBillPaid.bind(null, bill.id)}>
            <button type="submit" className="btn-navy px-3 py-1.5 text-xs">
              Marcar como paga
            </button>
          </form>
        )}
        <form action={deleteBill.bind(null, bill.id)}>
          <button type="submit" className="text-xs text-ink-muted hover:text-wine">
            remover
          </button>
        </form>
      </div>
    </li>
  );
}
