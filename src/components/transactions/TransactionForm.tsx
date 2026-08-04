"use client";

import { useActionState, useState } from "react";
import { createTransaction } from "@/lib/actions/transactions";
import type { ActionState } from "@/lib/actions/accounts";
import type { Account, Category, Recorrencia, TransacaoTipo } from "@/types/database";

const initialState: ActionState = {};

export function TransactionForm({
  accounts,
  categories,
}: {
  accounts: Account[];
  categories: Category[];
}) {
  const [state, formAction, pending] = useActionState(createTransaction, initialState);
  const [tipo, setTipo] = useState<TransacaoTipo>("despesa");
  const [recorrencia, setRecorrencia] = useState<Recorrencia>("unica");

  const categoriasFiltradas = categories.filter((c) => c.tipo === tipo);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Novo lançamento</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          Tipo
          <select
            name="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TransacaoTipo)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="despesa">Despesa</option>
            <option value="receita">Receita</option>
            <option value="transferencia">Transferência</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Valor (R$)
          <input name="valor" type="number" step="0.01" min="0.01" required className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Data
          <input name="data" type="date" defaultValue={today} required className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {tipo === "transferencia" ? "Conta de origem" : "Conta"}
          <select name="account_id" required className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
        </label>
        {tipo === "transferencia" ? (
          <label className="flex flex-col gap-1 text-sm">
            Conta de destino
            <select name="conta_destino_id" required className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="flex flex-col gap-1 text-sm">
            Categoria
            <select name="category_id" className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
              {categoriasFiltradas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1 text-sm">
          Forma de pagamento
          <input name="forma_pagamento" placeholder="Pix, débito, dinheiro..." className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Recorrência
          <select
            name="recorrencia"
            value={recorrencia}
            onChange={(e) => setRecorrencia(e.target.value as Recorrencia)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="unica">Única</option>
            <option value="fixa_mensal">Fixa mensal</option>
            <option value="parcelada">Parcelada</option>
          </select>
        </label>
        {recorrencia === "parcelada" && (
          <label className="flex flex-col gap-1 text-sm">
            Nº de parcelas
            <input name="parcelas_total" type="number" min={2} max={60} defaultValue={2} className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
          </label>
        )}
        <label className="col-span-2 flex flex-col gap-1 text-sm sm:col-span-3">
          Descrição
          <input name="descricao" className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
        </label>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "Salvando..." : "Lançar"}
      </button>
    </form>
  );
}
