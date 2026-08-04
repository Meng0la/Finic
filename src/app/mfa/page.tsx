"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";

export default function MfaChallengePage() {
  const router = useRouter();
  const supabase = createClient();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    supabase.auth.mfa.listFactors().then(({ data, error }) => {
      if (error) {
        setError(error.message);
        return;
      }
      const totp = data.totp.find((f) => f.status === "verified");
      if (!totp) {
        router.replace("/mfa/enroll");
        return;
      }
      setFactorId(totp.id);
    });
  }, [router, supabase]);

  async function handleSubmit(e: React.FormEvent) {
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

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <AuthShell>
      <h1 className="font-display mb-2 text-xl font-semibold text-ink">
        Verificação em duas etapas
      </h1>
      <p className="mb-6 text-sm text-ink-muted">
        Digite o código do seu aplicativo autenticador.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          inputMode="numeric"
          autoFocus
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="field-input text-center text-lg tracking-[0.5em]"
          placeholder="000000"
        />
        {error && <p className="text-sm text-wine">{error}</p>}
        <button
          type="submit"
          disabled={pending || !factorId || code.length < 6}
          className="btn-gold"
        >
          {pending ? "Verificando..." : "Confirmar"}
        </button>
      </form>
    </AuthShell>
  );
}
