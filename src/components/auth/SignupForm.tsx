"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp, type AuthActionState } from "@/lib/actions/auth";

const initialState: AuthActionState = {};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
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
          minLength={8}
          autoComplete="new-password"
          className="field-input"
        />
        <span className="text-xs text-ink-muted">Mínimo de 8 caracteres.</span>
      </label>
      {state.error && <p className="text-sm text-wine">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-gold mt-2">
        {pending ? "Criando conta..." : "Criar conta"}
      </button>
      <p className="text-center text-sm text-ink-muted">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-ink hover:text-gold">
          Entrar
        </Link>
      </p>
    </form>
  );
}
