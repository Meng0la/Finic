"use client";

import { useActionState } from "react";
import { createBill } from "@/lib/actions/bills";
import type { ActionState } from "@/lib/actions/accounts";
import type { Account, Category } from "@/types/database";

const initialState: ActionState = {};

export function BillForm({ categories, accounts }: { categories: Category[]; accounts: Account[] }) {
  const [state, formAction, pending] = useActionState(createBill, initialState);
  const despesas = categories.filter((c) => c.tipo === "despesa");

  return (
    <form action={formAction} className="surface-card flex flex-col gap-4 p-6">
      <h2 className="font-display text-lg font-semibold text-ink">Nova conta a pagar</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <label className="col-span-2 flex flex-col gap-1.5">
          <span className="field-label">Nome</span>
          <input name="nome" required placeholder="Ex: Internet, Aluguel..." className="field-input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="field-label">Valor (R$)</span>
          <input name="valor" type="number" step="0.01" min="0.01" required className="field-input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="field-label">Dia do vencimento</span>
          <input
            name="dia_vencimento"
            type="number"
            min={1}
            max={31}
            required
            className="field-input"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="field-label">Categoria (opcional)</span>
          <select name="category_id" className="field-input">
            <option value="">—</option>
            {despesas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="field-label">Conta de pagamento (opcional)</span>
          <select name="account_id" className="field-input">
            <option value="">—</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
        </label>
      </div>
      {state.error && <p className="text-sm text-wine">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-navy self-start">
        {pending ? "Salvando..." : "Adicionar conta"}
      </button>
    </form>
  );
}
