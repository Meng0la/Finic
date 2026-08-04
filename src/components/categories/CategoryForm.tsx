"use client";

import { useActionState } from "react";
import { createCategory } from "@/lib/actions/categories";
import type { ActionState } from "@/lib/actions/accounts";

const initialState: ActionState = {};

export function CategoryForm() {
  const [state, formAction, pending] = useActionState(createCategory, initialState);

  return (
    <form action={formAction} className="surface-card flex flex-col gap-4 p-6">
      <h2 className="font-display text-lg font-semibold text-ink">Nova categoria</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <label className="flex flex-col gap-1.5">
          <span className="field-label">Nome</span>
          <input name="nome" required className="field-input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="field-label">Tipo</span>
          <select name="tipo" className="field-input">
            <option value="despesa">Despesa</option>
            <option value="receita">Receita</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="field-label">Cor</span>
          <input
            name="cor"
            type="color"
            defaultValue="#a3813c"
            className="h-10 w-full rounded-md border border-border bg-surface p-1"
          />
        </label>
      </div>
      {state.error && <p className="text-sm text-wine">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-navy self-start">
        {pending ? "Salvando..." : "Adicionar categoria"}
      </button>
    </form>
  );
}
