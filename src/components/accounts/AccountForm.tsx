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
    <form action={formAction} className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nova conta</h2>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Nome
          <input name="nome" required className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Tipo
          <select
            name="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as ContaTipo)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {Object.entries(TIPO_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Saldo inicial (R$)
          <input
            name="saldo_inicial"
            type="number"
            step="0.01"
            defaultValue={0}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        {tipo === "cartao" && (
          <>
            <label className="flex flex-col gap-1 text-sm">
              Limite (R$)
              <input name="limite" type="number" step="0.01" className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Dia de fechamento
              <input name="dia_fechamento" type="number" min={1} max={31} className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Dia de vencimento
              <input name="dia_vencimento" type="number" min={1} max={31} className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
            </label>
          </>
        )}
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "Salvando..." : "Adicionar conta"}
      </button>
    </form>
  );
}
