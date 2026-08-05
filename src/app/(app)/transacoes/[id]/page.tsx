import { notFound } from "next/navigation";
import { getAccounts, getCategories, getTransaction } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { TransactionEditForm } from "@/components/transactions/TransactionEditForm";
import { ComprovanteUpload } from "@/components/transactions/ComprovanteUpload";

export default async function EditarTransacaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [transaction, accounts, categories] = await Promise.all([
    getTransaction(id),
    getAccounts(),
    getCategories(),
  ]);

  if (!transaction) notFound();

  let signedUrl: string | null = null;
  if (transaction.anexo_path) {
    const supabase = await createClient();
    const { data } = await supabase.storage
      .from("comprovantes")
      .createSignedUrl(transaction.anexo_path, 60 * 10);
    signedUrl = data?.signedUrl ?? null;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Movimentação" title="Editar lançamento" />
      <TransactionEditForm transaction={transaction} accounts={accounts} categories={categories} />
      <ComprovanteUpload transactionId={transaction.id} signedUrl={signedUrl} />
    </div>
  );
}
