"use client";

import { useActionState, useRef, useState } from "react";
import { createTransaction, scanComprovante } from "@/lib/actions/transactions";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanVersion, setScanVersion] = useState(0);
  const [prefill, setPrefill] = useState<{
    valor?: string;
    data?: string;
    descricao?: string;
    forma_pagamento?: string;
  }>({});

  const categoriasFiltradas = categories.filter((c) => c.tipo === tipo);
  const today = new Date().toISOString().slice(0, 10);

  async function handleScan() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setScanError("Selecione uma foto do comprovante primeiro.");
      return;
    }
    setScanning(true);
    setScanError(null);
    const fd = new FormData();
    fd.set("comprovante", file);
    const result = await scanComprovante(fd);
    setScanning(false);

    if (result.error) {
      setScanError(result.error);
      return;
    }
    if (result.scan) {
      if (result.scan.tipo) setTipo(result.scan.tipo);
      setPrefill({
        valor: result.scan.valor?.toFixed(2),
        data: result.scan.data,
        descricao: result.scan.descricao,
        forma_pagamento: result.scan.forma_pagamento,
      });
      setScanVersion((v) => v + 1);
    }
  }

  return (
    <form action={formAction} className="surface-card flex flex-col gap-4 p-6">
      <h2 className="font-display text-lg font-semibold text-ink">Novo lançamento</h2>
      <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border p-3">
        <span className="field-label">Ler comprovante com IA (opcional)</span>
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            name="comprovante"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="text-sm text-ink-muted"
          />
          <button type="button" onClick={handleScan} disabled={scanning} className="btn-navy">
            {scanning ? "Lendo comprovante..." : "Ler com IA"}
          </button>
        </div>
        {scanError && <p className="text-sm text-wine">{scanError}</p>}
        {scanVersion > 0 && !scanError && (
          <p className="text-sm text-emerald">
            Campos preenchidos a partir da foto — confira antes de lançar. A foto é anexada
            automaticamente ao lançamento.
          </p>
        )}
      </div>
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
          <input
            key={`valor-${scanVersion}`}
            name="valor"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={prefill.valor}
            className="field-input"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="field-label">Data</span>
          <input
            key={`data-${scanVersion}`}
            name="data"
            type="date"
            defaultValue={prefill.data ?? today}
            required
            className="field-input"
          />
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
          <input
            key={`forma-${scanVersion}`}
            name="forma_pagamento"
            placeholder="Pix, débito, dinheiro..."
            defaultValue={prefill.forma_pagamento}
            className="field-input"
          />
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
          <input
            key={`descricao-${scanVersion}`}
            name="descricao"
            defaultValue={prefill.descricao}
            className="field-input"
          />
        </label>
      </div>
      {state.error && <p className="text-sm text-wine">{state.error}</p>}
      {state.warning && <p className="text-sm text-amber">{state.warning}</p>}
      <button type="submit" disabled={pending} className="btn-navy self-start">
        {pending ? "Salvando..." : "Lançar"}
      </button>
    </form>
  );
}
