"use client";

import { useActionState } from "react";
import { generateInvestmentSuggestion } from "@/lib/actions/investments";
import type { ActionState } from "@/lib/actions/accounts";

const initialState: ActionState = {};

export function GenerateSuggestionButton({ disabled }: { disabled: boolean }) {
  const [state, formAction, pending] = useActionState(generateInvestmentSuggestion, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <button type="submit" disabled={disabled || pending} className="btn-gold self-start">
        {pending ? "Gerando sugestão..." : "Gerar sugestão"}
      </button>
      {state.error && <p className="text-sm text-wine">{state.error}</p>}
    </form>
  );
}
