"use client";

import { useActionState, useState } from "react";
import { createAccount } from "@/lib/actions/accounts";
import type { ActionState } from "@/lib/actions/accounts";
import type { ContaTipo } from "@/types/database";

const initialState: ActionState = {};

const TIPO_LABELS: Record<ContaTipo, string> = {
  corrente: "Conta corrente",
  poupanca: "Poupança",
  dinheiro: "Dinheiro / carteira",
  cartao: "Cartão de crédito",
};

export function AccountForm() {
  const [state, formAction, pending] = useActionState(createAccount, initialState);
  const [tipo, setTipo] = useState<ContaTipo>("corrente");

  return (
    <form action={formAction} className="surface-card flex flex-col gap-4 p-6">
      <h2 className="font-display text-lg font-semibold text-ink">Nova conta</h2>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="field-label">Nome</span>
          <input name="nome" required className="field-input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="field-label">Tipo</span>
          <select
            name="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as ContaTipo)}
            className="field-input"
          >
            {Object.entries(TIPO_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="field-label">Saldo inicial (R$)</span>
          <input name="saldo_inicial" type="number" step="0.01" defaultValue={0} className="field-input" />
        </label>
        {tipo === "cartao" && (
          <>
            <label className="flex flex-col gap-1.5">
              <span className="field-label">Limite (R$)</span>
              <input name="limite" type="number" step="0.01" className="field-input" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="field-label">Dia de fechamento</span>
              <input name="dia_fechamento" type="number" min={1} max={31} className="field-input" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="field-label">Dia de vencimento</span>
              <input name="dia_vencimento" type="number" min={1} max={31} className="field-input" />
            </label>
          </>
        )}
      </div>
      {state.error && <p className="text-sm text-wine">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-navy self-start">
        {pending ? "Salvando..." : "Adicionar conta"}
      </button>
    </form>
  );
}
