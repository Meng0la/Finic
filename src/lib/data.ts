import { createClient } from "@/lib/supabase/server";
import type {
  Account,
  AuditLogEntry,
  Budget,
  Category,
  InvestmentSuggestion,
  PerfilRisco,
  Profile,
  Transaction,
} from "@/types/database";

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

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    (data as Profile | null) ?? {
      user_id: user.id,
      perfil_risco: "moderado" as PerfilRisco,
      experiencia: "iniciante" as Profile["experiencia"],
      updated_at: "",
    }
  );
}

export async function getInvestmentSuggestions(limit = 5): Promise<InvestmentSuggestion[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("investment_suggestions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as InvestmentSuggestion[];
}

export async function getAuditLog(limit = 100): Promise<AuditLogEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as AuditLogEntry[];
}
