"use client";

import { useActionState } from "react";
import { removeComprovante, uploadComprovante } from "@/lib/actions/transactions";
import type { ActionState } from "@/lib/actions/accounts";

const initialState: ActionState = {};

export function ComprovanteUpload({
  transactionId,
  signedUrl,
}: {
  transactionId: string;
  signedUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState(uploadComprovante, initialState);

  return (
    <div className="surface-card flex flex-col gap-3 p-6">
      <h2 className="font-display text-lg font-semibold text-ink">Comprovante</h2>
      {signedUrl ? (
        <div className="flex items-center gap-3">
          <a
            href={signedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gold underline decoration-border hover:text-gold-strong"
          >
            Ver comprovante anexado
          </a>
          <form action={removeComprovante.bind(null, transactionId)}>
            <button type="submit" className="text-xs text-ink-muted hover:text-wine">
              remover
            </button>
          </form>
        </div>
      ) : (
        <p className="text-sm text-ink-muted">Nenhum comprovante anexado ainda.</p>
      )}
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="id" value={transactionId} />
        <label className="flex flex-col gap-1.5">
          <span className="field-label">Foto ou PDF (até 5 MB)</span>
          <input
            type="file"
            name="comprovante"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            required
            className="text-sm text-ink-muted"
          />
        </label>
        <button type="submit" disabled={pending} className="btn-navy">
          {pending ? "Enviando..." : "Enviar"}
        </button>
      </form>
      {state.error && <p className="text-sm text-wine">{state.error}</p>}
    </div>
  );
}
