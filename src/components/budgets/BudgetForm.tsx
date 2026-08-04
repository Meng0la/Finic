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
    <form action={formAction} className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Novo orçamento</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          Categoria
          <select name="category_id" required className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
            {despesas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Limite mensal (R$)
          <input name="limite_mensal" type="number" step="0.01" min="0.01" required className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Mês
          <input name="mes_referencia" type="month" defaultValue={mes} required className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
        </label>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "Salvando..." : "Adicionar orçamento"}
      </button>
    </form>
  );
}
