"use client";

import { useActionState } from "react";
import { addContribution, deleteGoal } from "@/lib/actions/goals";
import { formatBRL } from "@/lib/finance";
import type { ActionState } from "@/lib/actions/accounts";
import type { Goal } from "@/types/database";

const initialState: ActionState = {};

export function GoalCard({ goal }: { goal: Goal }) {
  const [state, formAction, pending] = useActionState(addContribution, initialState);
  const percentual = Math.min(100, Math.round((goal.valor_atual / goal.valor_alvo) * 100));
  const concluida = goal.status === "concluida";

  return (
    <div className="surface-card p-6">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <span className="font-display text-lg font-semibold text-ink">{goal.nome}</span>
          {concluida && (
            <span className="ml-2 rounded-full bg-emerald/10 px-2 py-0.5 text-[11px] font-medium text-emerald">
              Concluída
            </span>
          )}
        </div>
        <form action={deleteGoal.bind(null, goal.id)}>
          <button type="submit" className="text-xs text-ink-muted hover:text-wine">
            remover
          </button>
        </form>
      </div>
      <p className="mb-2 text-sm text-ink-muted">
        {formatBRL(goal.valor_atual)} de {formatBRL(goal.valor_alvo)}
        {goal.data_alvo &&
          ` · até ${new Date(`${goal.data_alvo}T00:00:00`).toLocaleDateString("pt-BR")}`}
      </p>
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
        <div
          className={`h-full rounded-full ${concluida ? "bg-emerald" : "bg-gold"}`}
          style={{ width: `${percentual}%` }}
        />
      </div>
      {!concluida && (
        <form action={formAction} className="flex items-end gap-2">
          <input type="hidden" name="id" value={goal.id} />
          <label className="flex flex-col gap-1.5">
            <span className="field-label">Adicionar aporte (R$)</span>
            <input name="aporte" type="number" step="0.01" min="0.01" required className="field-input w-32" />
          </label>
          <button type="submit" disabled={pending} className="btn-navy">
            {pending ? "Salvando..." : "Aportar"}
          </button>
        </form>
      )}
      {state.error && <p className="mt-2 text-sm text-wine">{state.error}</p>}
    </div>
  );
}
