"use client";

import { useActionState } from "react";
import { createBudget } from "@/lib/actions/budgets";
import type { ActionState } from "@/lib/actions/accounts";
import type { Category } from "@/types/database";

const initialState: ActionState = {};

export function BudgetForm({ categories, mes }: { categories: Category[]; mes: string }) {
  const [state, formAction, pending] = useActionState(createBudget, initialState);
  const despesas = categories.filter((c) => c.tipo === "despesa");

  return (
    <form action={formAction} className="surface-card flex flex-col gap-4 p-6">
      <h2 className="font-display text-lg font-semibold text-ink">Novo orçamento</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5">
          <span className="field-label">Categoria</span>
          <select name="category_id" required className="field-input">
            {despesas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="field-label">Limite mensal (R$)</span>
          <input name="limite_mensal" type="number" step="0.01" min="0.01" required className="field-input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="field-label">Mês</span>
          <input name="mes_referencia" type="month" defaultValue={mes} required className="field-input" />
        </label>
      </div>
      {state.error && <p className="text-sm text-wine">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-navy self-start">
        {pending ? "Salvando..." : "Adicionar orçamento"}
      </button>
    </form>
  );
}
