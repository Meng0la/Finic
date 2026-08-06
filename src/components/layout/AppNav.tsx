"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/actions/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Painel" },
  { href: "/transacoes", label: "Transações" },
  { href: "/contas", label: "Contas" },
  { href: "/categorias", label: "Categorias" },
  { href: "/orcamentos", label: "Orçamentos" },
  { href: "/contas-a-pagar", label: "Contas a Pagar" },
  { href: "/metas", label: "Metas" },
  { href: "/investimentos", label: "Investimentos" },
  { href: "/historico", label: "Histórico" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-gold-strong/20 bg-navy">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-4">
        <Link href="/dashboard" className="font-display text-xl font-semibold text-gold-strong">
          Finic
        </Link>
        <form action={signOut}>
          <button type="submit" className="nav-link">
            Sair
          </button>
        </form>
      </div>
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-6 py-3">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link ${pathname.startsWith(item.href) ? "active" : ""}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
