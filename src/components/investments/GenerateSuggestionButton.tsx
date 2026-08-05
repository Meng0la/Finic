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
        {pending ? "Consultando taxas e montando sugestão..." : "Gerar sugestão"}
      </button>
      {pending && (
        <p className="max-w-sm text-xs text-[#93a0b8]">
          Buscando Selic, CDI e IPCA atuais no Banco Central antes de montar a alocação — leva
          só alguns segundos.
        </p>
      )}
      {state.error && <p className="text-sm text-wine">{state.error}</p>}
    </form>
  );
}
