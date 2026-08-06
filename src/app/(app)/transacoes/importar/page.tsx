import { ImportForm } from "@/components/transactions/ImportForm";
import { PageHeader } from "@/components/layout/PageHeader";

export default function ImportarTransacoesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Movimentação" title="Importar transações" />
      <ImportForm />
    </div>
  );
}
