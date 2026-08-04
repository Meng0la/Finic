"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";

type Step = "intro" | "scan" | "done";

export default function MfaEnrollPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<Step>("intro");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function startEnroll() {
    setPending(true);
    setError(null);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    setPending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setFactorId(data.id);
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
    setStep("scan");
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setPending(true);
    setError(null);

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    });
    if (challengeError) {
      setError(challengeError.message);
      setPending(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });

    if (verifyError) {
      setError("Código inválido. Tente novamente.");
      setPending(false);
      return;
    }

    setStep("done");
    setPending(false);
    router.refresh();
  }

  return (
    <AuthShell>
      <h1 className="font-display mb-2 text-xl font-semibold text-ink">
        Ative a autenticação em duas etapas
      </h1>
      <p className="mb-6 text-sm text-ink-muted">
        Obrigatória para proteger seus dados financeiros. Você precisa de um app autenticador
        (Google Authenticator, Authy, 1Password etc).
      </p>

      {step === "intro" && (
        <button onClick={startEnroll} disabled={pending} className="btn-gold w-full">
          {pending ? "Gerando..." : "Começar"}
        </button>
      )}

      {step === "scan" && qrCode && (
        <form onSubmit={handleVerify} className="flex flex-col gap-4">
          <div
            className="mx-auto h-48 w-48 rounded-lg border border-border-soft bg-surface-alt p-3 [&>svg]:h-full [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: qrCode }}
          />
          {secret && (
            <p className="break-all text-center text-xs text-ink-muted">
              Ou insira manualmente: <span className="font-mono text-ink">{secret}</span>
            </p>
          )}
          <input
            type="text"
            inputMode="numeric"
            autoFocus
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="000000"
            className="field-input text-center text-lg tracking-[0.5em]"
          />
          {error && <p className="text-sm text-wine">{error}</p>}
          <button type="submit" disabled={pending || code.length < 6} className="btn-gold">
            {pending ? "Confirmando..." : "Confirmar e ativar"}
          </button>
        </form>
      )}

      {step === "done" && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-emerald">
            Autenticação em duas etapas ativada com sucesso.
          </p>
          <button onClick={() => router.replace("/dashboard")} className="btn-gold">
            Ir para o painel
          </button>
        </div>
      )}
    </AuthShell>
  );
}
