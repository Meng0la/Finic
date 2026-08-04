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
    <form action={formAction} className="surface-card flex flex-col gap-4 p-6">
      <h2 className="font-display text-lg font-semibold text-ink">Novo lançamento</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5">
          <span className="field-label">Tipo</span>
          <select
            name="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TransacaoTipo)}
            className="field-input"
          >
            <option value="despesa">Despesa</option>
            <option value="receita">Receita</option>
            <option value="transferencia">Transferência</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="field-label">Valor (R$)</span>
          <input name="valor" type="number" step="0.01" min="0.01" required className="field-input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="field-label">Data</span>
          <input name="data" type="date" defaultValue={today} required className="field-input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="field-label">{tipo === "transferencia" ? "Conta de origem" : "Conta"}</span>
          <select name="account_id" required className="field-input">
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
        </label>
        {tipo === "transferencia" ? (
          <label className="flex flex-col gap-1.5">
            <span className="field-label">Conta de destino</span>
            <select name="conta_destino_id" required className="field-input">
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="flex flex-col gap-1.5">
            <span className="field-label">Categoria</span>
            <select name="category_id" className="field-input">
              {categoriasFiltradas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1.5">
          <span className="field-label">Forma de pagamento</span>
          <input name="forma_pagamento" placeholder="Pix, débito, dinheiro..." className="field-input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="field-label">Recorrência</span>
          <select
            name="recorrencia"
            value={recorrencia}
            onChange={(e) => setRecorrencia(e.target.value as Recorrencia)}
            className="field-input"
          >
            <option value="unica">Única</option>
            <option value="fixa_mensal">Fixa mensal</option>
            <option value="parcelada">Parcelada</option>
          </select>
        </label>
        {recorrencia === "parcelada" && (
          <label className="flex flex-col gap-1.5">
            <span className="field-label">Nº de parcelas</span>
            <input name="parcelas_total" type="number" min={2} max={60} defaultValue={2} className="field-input" />
          </label>
        )}
        <label className="col-span-2 flex flex-col gap-1.5 sm:col-span-3">
          <span className="field-label">Descrição</span>
          <input name="descricao" className="field-input" />
        </label>
      </div>
      {state.error && <p className="text-sm text-wine">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-navy self-start">
        {pending ? "Salvando..." : "Lançar"}
      </button>
    </form>
  );
}
