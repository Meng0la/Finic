"use client";

import { useActionState } from "react";
import { updateInvestorProfile } from "@/lib/actions/investments";
import type { ActionState } from "@/lib/actions/accounts";
import type { Experiencia, PerfilRisco } from "@/types/database";

const initialState: ActionState = {};

const RISK_LABELS: Record<PerfilRisco, string> = {
  conservador: "Conservador",
  moderado: "Moderado",
  arrojado: "Arrojado",
};

const EXPERIENCE_LABELS: Record<Experiencia, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

function RadioPills<T extends string>({
  name,
  labels,
  atual,
}: {
  name: string;
  labels: Record<T, string>;
  atual: T;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.keys(labels) as T[]).map((value) => (
        <label key={value} className="cursor-pointer">
          <input
            type="radio"
            name={name}
            value={value}
            defaultChecked={value === atual}
            className="peer sr-only"
          />
          <span className="inline-block rounded-full border border-border px-4 py-1.5 text-sm text-ink-muted transition-colors peer-checked:border-gold peer-checked:bg-navy peer-checked:text-gold-strong peer-checked:font-medium">
            {labels[value]}
          </span>
        </label>
      ))}
    </div>
  );
}

export function InvestorProfileForm({
  perfilAtual,
  experienciaAtual,
}: {
  perfilAtual: PerfilRisco;
  experienciaAtual: Experiencia;
}) {
  const [state, formAction, pending] = useActionState(updateInvestorProfile, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4"
      onChange={(e) => e.currentTarget.requestSubmit()}
    >
      <div className="flex flex-col gap-2">
        <span className="field-label">Perfil de risco</span>
        <RadioPills name="perfil_risco" labels={RISK_LABELS} atual={perfilAtual} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="field-label">Nível de experiência</span>
        <RadioPills name="experiencia" labels={EXPERIENCE_LABELS} atual={experienciaAtual} />
      </div>
      {pending && <span className="text-xs text-ink-muted">Salvando...</span>}
      {state.error && <p className="text-sm text-wine">{state.error}</p>}
    </form>
  );
}
