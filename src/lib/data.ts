import { createClient } from "@/lib/supabase/server";
import type { Account, Budget, Category, Transaction } from "@/types/database";

export async function getAccounts(): Promise<Account[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("accounts").select("*").order("nome");
  return (data ?? []) as Account[];
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").order("nome");
  return (data ?? []) as Category[];
}

export async function getTransactions(opts?: {
  from?: string;
  to?: string;
}): Promise<Transaction[]> {
  const supabase = await createClient();
  let query = supabase
    .from("transactions")
    .select("*")
    .order("data", { ascending: false })
    .order("created_at", { ascending: false });

  if (opts?.from) query = query.gte("data", opts.from);
  if (opts?.to) query = query.lte("data", opts.to);

  const { data } = await query;
  return (data ?? []) as Transaction[];
}

export async function getBudgets(mesReferencia: string): Promise<Budget[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("budgets")
    .select("*")
    .eq("mes_referencia", `${mesReferencia}-01`);
  return data ?? [];
}
