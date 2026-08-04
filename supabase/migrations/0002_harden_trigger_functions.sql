-- Corrige achados do advisor de segurança do Supabase:
-- search_path mutável e funções SECURITY DEFINER chamáveis via RPC público.
-- Essas funções só devem rodar como triggers, nunca via /rest/v1/rpc/*.

alter function public.set_updated_at() set search_path = public;

revoke execute on function public.log_transaction_change() from public, anon, authenticated;
revoke execute on function public.seed_default_categories() from public, anon, authenticated;
