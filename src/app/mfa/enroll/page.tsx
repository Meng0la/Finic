"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Ative a autenticação em duas etapas
        </h1>
        <p className="mb-6 text-sm text-zinc-500">
          Obrigatória para proteger seus dados financeiros. Você precisa de um app
          autenticador (Google Authenticator, Authy, 1Password etc).
        </p>

        {step === "intro" && (
          <button
            onClick={startEnroll}
            disabled={pending}
            className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {pending ? "Gerando..." : "Começar"}
          </button>
        )}

        {step === "scan" && qrCode && (
          <form onSubmit={handleVerify} className="flex flex-col gap-4">
            <div
              className="mx-auto h-48 w-48 [&>svg]:h-full [&>svg]:w-full"
              dangerouslySetInnerHTML={{ __html: qrCode }}
            />
            {secret && (
              <p className="break-all text-center text-xs text-zinc-500">
                Ou insira manualmente: <span className="font-mono">{secret}</span>
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
              className="rounded-md border border-zinc-300 px-3 py-2 text-center text-lg tracking-[0.5em] dark:border-zinc-700 dark:bg-zinc-900"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={pending || code.length < 6}
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {pending ? "Confirmando..." : "Confirmar e ativar"}
            </button>
          </form>
        )}

        {step === "done" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-green-700 dark:text-green-400">
              Autenticação em duas etapas ativada com sucesso.
            </p>
            <button
              onClick={() => router.replace("/dashboard")}
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Ir para o painel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
