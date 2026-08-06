"use client";

import { useTransition } from "react";
import { updateCategoryGroup } from "@/lib/actions/categories";
import type { GrupoOrcamentario } from "@/types/database";

export function CategoryGroupSelect({
  categoryId,
  value,
}: {
  categoryId: string;
  value: GrupoOrcamentario | null;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={value ?? ""}
      disabled={pending}
      onChange={(e) => {
        const grupo = (e.target.value || null) as GrupoOrcamentario | null;
        startTransition(() => {
          updateCategoryGroup(categoryId, grupo);
        });
      }}
      className="rounded-md border border-border bg-transparent px-1.5 py-0.5 text-[11px] text-ink-muted"
      title="Grupo da regra 50/30/20"
    >
      <option value="">Sem grupo</option>
      <option value="essencial">Essencial</option>
      <option value="desejo">Desejo</option>
      <option value="investimento">Investimento</option>
    </select>
  );
}
