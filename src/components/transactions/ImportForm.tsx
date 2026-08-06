"use client";

import { useActionState, useRef, useState } from "react";
import { importTransactionsCsv, previewImportCsv } from "@/lib/actions/import";
import type { ParsedImportRow } from "@/lib/actions/import";
import type { ActionState } from "@/lib/actions/accounts";

const initialState: ActionState = {};

interface Totals {
  totalLinhas: number;
  totalValidas: number;
  totalDuplicadas: number;
  totalComErro: number;
}

export function ImportForm() {
  const [state, formAction, pending] = useActionState(importTransactionsCsv, initialState);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedImportRow[] | null>(null);
  const [totals, setTotals] = useState<Totals | null>(null);

  async function handlePreview() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setPreviewError("Selecione um arquivo CSV primeiro.");
      return;
    }
    setPreviewing(true);
    setPreviewError(null);
    const fd = new FormData();
    fd.set("arquivo", file);
    const result = await previewImportCsv(fd);
    setPreviewing(false);

    if (result.error) {
      setPreviewError(result.error);
      setRows(null);
      setTotals(null);
      return;
    }
    setRows(result.rows ?? []);
    setTotals({
      totalLinhas: result.totalLinhas ?? 0,
      totalValidas: result.totalValidas ?? 0,
      totalDuplicadas: result.totalDuplicadas ?? 0,
      totalComErro: result.totalComErro ?? 0,
    });
  }

  return (
    <form action={formAction} className="surface-card flex flex-col gap-4 p-6">
      <h2 className="font-display text-lg font-semibold text-ink">Importar transações via CSV</h2>
      <p className="text-xs text-ink-muted">
        Arquivo separado por &quot;;&quot; com pelo menos as colunas <strong>Data</strong>,{" "}
        <strong>Tipo</strong>, <strong>Valor</strong> e <strong>Conta</strong> — o mesmo formato do
        CSV exportado pelo Finic. Datas em AAAA-MM-DD ou DD/MM/AAAA. Conta e categoria precisam ter
        o mesmo nome já cadastrado aqui.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        name="arquivo"
        accept=".csv,text/csv"
        className="text-sm text-ink-muted"
      />
      <button
        type="button"
        onClick={handlePreview}
        disabled={previewing}
        className="btn-navy self-start"
      >
        {previewing ? "Lendo arquivo..." : "Pré-visualizar"}
      </button>
      {previewError && <p className="text-sm text-wine">{previewError}</p>}

      {rows && totals && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-ink">
            {totals.totalLinhas} linhas ·{" "}
            <span className="text-emerald">{totals.totalValidas} prontas pra importar</span>
            {totals.totalDuplicadas > 0 && (
              <>
                {" "}
                · <span className="text-amber">{totals.totalDuplicadas} já existem (ignoradas)</span>
              </>
            )}
            {totals.totalComErro > 0 && (
              <>
                {" "}
                · <span className="text-wine">{totals.totalComErro} com erro</span>
              </>
            )}
          </p>
          <div className="max-h-80 overflow-auto rounded-lg border border-border">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-surface-alt">
                <tr>
                  <th className="px-3 py-2">Linha</th>
                  <th className="px-3 py-2">Data</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Valor</th>
                  <th className="px-3 py-2">Conta</th>
                  <th className="px-3 py-2">Categoria</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.index} className="border-t border-border">
                    <td className="px-3 py-1.5 text-ink-muted">{r.index + 1}</td>
                    <td className="px-3 py-1.5 text-ink">{r.data ?? "—"}</td>
                    <td className="px-3 py-1.5 text-ink">{r.tipo ?? "—"}</td>
                    <td className="px-3 py-1.5 text-ink">{r.valor ?? "—"}</td>
                    <td className="px-3 py-1.5 text-ink">{r.contaNome}</td>
                    <td className="px-3 py-1.5 text-ink">{r.categoriaNome}</td>
                    <td className="px-3 py-1.5">
                      {r.error ? (
                        <span className="text-wine">{r.error}</span>
                      ) : r.duplicate ? (
                        <span className="text-amber">Já existe</span>
                      ) : (
                        <span className="text-emerald">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {state.error && <p className="text-sm text-wine">{state.error}</p>}
      {state.warning && <p className="text-sm text-emerald">{state.warning}</p>}
      <button type="submit" disabled={pending || !rows} className="btn-gold self-start">
        {pending ? "Importando..." : "Confirmar importação"}
      </button>
    </form>
  );
}
