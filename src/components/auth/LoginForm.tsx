"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, type AuthActionState } from "@/lib/actions/auth";

const initialState: AuthActionState = {};

export function LoginForm({ verifiqueEmail }: { verifiqueEmail: boolean }) {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="mb-2">
        <p className="field-label">Acesso</p>
        <h1 className="font-display text-2xl font-semibold text-ink">Entrar</h1>
      </div>
      {verifiqueEmail && (
        <p className="rounded-md border border-border bg-surface-alt px-3 py-2 text-sm text-ink-muted">
          Conta criada. Verifique seu e-mail para confirmar o cadastro antes de entrar.
        </p>
      )}
      <label className="flex flex-col gap-1.5">
        <span className="field-label">E-mail</span>
        <input type="email" name="email" required autoComplete="email" className="field-input" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="field-label">Senha</span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="field-input"
        />
      </label>
      {state.error && <p className="text-sm text-wine">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-gold mt-2">
        {pending ? "Entrando..." : "Entrar"}
      </button>
      <p className="text-center text-sm text-ink-muted">
        Não tem conta?{" "}
        <Link href="/signup" className="font-medium text-ink hover:text-gold">
          Criar conta
        </Link>
      </p>
    </form>
  );
}
