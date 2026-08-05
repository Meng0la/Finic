"use client";

import { useActionState } from "react";
import { createGoal } from "@/lib/actions/goals";
import type { ActionState } from "@/lib/actions/accounts";

const initialState: ActionState = {};

export function GoalForm() {
  const [state, formAction, pending] = useActionState(createGoal, initialState);

  return (
    <form action={formAction} className="surface-card flex flex-col gap-4 p-6">
      <h2 className="font-display text-lg font-semibold text-ink">Nova meta</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <label className="col-span-2 flex flex-col gap-1.5 sm:col-span-1">
          <span className="field-label">Nome</span>
          <input name="nome" required placeholder="Ex: Reserva de emergência" className="field-input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="field-label">Valor alvo (R$)</span>
          <input name="valor_alvo" type="number" step="0.01" min="0.01" required className="field-input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="field-label">Data alvo (opcional)</span>
          <input name="data_alvo" type="date" className="field-input" />
        </label>
      </div>
      {state.error && <p className="text-sm text-wine">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-navy self-start">
        {pending ? "Salvando..." : "Criar meta"}
      </button>
    </form>
  );
}
