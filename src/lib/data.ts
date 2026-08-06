import { createClient } from "@/lib/supabase/server";
import type {
  Account,
  AuditLogEntry,
  Bill,
  BillPayment,
  Budget,
  Category,
  Goal,
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
  q?: string;
  categoryId?: string;
  tipo?: string;
  valorMin?: number;
  valorMax?: number;
}): Promise<Transaction[]> {
  const supabase = await createClient();
  let query = supabase
    .from("transactions")
    .select("*")
    .order("data", { ascending: false })
    .order("created_at", { ascending: false });

  if (opts?.from) query = query.gte("data", opts.from);
  if (opts?.to) query = query.lte("data", opts.to);
  if (opts?.q) query = query.ilike("descricao", `%${opts.q}%`);
  if (opts?.categoryId) query = query.eq("category_id", opts.categoryId);
  if (opts?.tipo) query = query.eq("tipo", opts.tipo);
  if (opts?.valorMin !== undefined) query = query.gte("valor", opts.valorMin);
  if (opts?.valorMax !== undefined) query = query.lte("valor", opts.valorMax);

  const { data } = await query;
  return (data ?? []) as Transaction[];
}

export async function getTransaction(id: string): Promise<Transaction | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("transactions").select("*").eq("id", id).single();
  return (data as Transaction | null) ?? null;
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

export async function getBills(): Promise<Bill[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bills")
    .select("*")
    .eq("ativo", true)
    .order("dia_vencimento", { ascending: true });
  return (data ?? []) as unknown as Bill[];
}

export async function getBillPayments(mesReferencia: string): Promise<BillPayment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bill_payments")
    .select("*")
    .eq("mes_referencia", `${mesReferencia}-01`);
  return (data ?? []) as unknown as BillPayment[];
}

export async function getGoals(): Promise<Goal[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("goals")
    .select("*")
    .order("status", { ascending: true })
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as Goal[];
}
