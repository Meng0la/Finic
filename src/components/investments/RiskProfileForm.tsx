"use client";

import { useActionState } from "react";
import { updateRiskProfile } from "@/lib/actions/investments";
import type { ActionState } from "@/lib/actions/accounts";
import type { PerfilRisco } from "@/types/database";

const initialState: ActionState = {};

const LABELS: Record<PerfilRisco, string> = {
  conservador: "Conservador",
  moderado: "Moderado",
  arrojado: "Arrojado",
};

export function RiskProfileForm({ perfilAtual }: { perfilAtual: PerfilRisco }) {
  const [state, formAction, pending] = useActionState(updateRiskProfile, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <span className="field-label">Perfil de risco</span>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(LABELS) as PerfilRisco[]).map((perfil) => (
          <label key={perfil} className="cursor-pointer">
            <input
              type="radio"
              name="perfil_risco"
              value={perfil}
              defaultChecked={perfil === perfilAtual}
              className="peer sr-only"
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
            />
            <span className="inline-block rounded-full border border-border px-4 py-1.5 text-sm text-ink-muted transition-colors peer-checked:border-gold peer-checked:bg-navy peer-checked:text-gold-strong peer-checked:font-medium">
              {LABELS[perfil]}
            </span>
          </label>
        ))}
      </div>
      {pending && <span className="text-xs text-ink-muted">Salvando...</span>}
      {state.error && <p className="text-sm text-wine">{state.error}</p>}
    </form>
  );
}
