-- Finic: planejamento de investimentos com sugestao gerada por IA (Groq).
-- profiles guarda o perfil de risco (usado para calibrar o prompt).
-- investment_suggestions guarda o historico do que ja foi sugerido, evitando
-- chamar a API de novo so para reexibir uma sugestao ja gerada.

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  perfil_risco text not null default 'moderado' check (perfil_risco in ('conservador', 'moderado', 'arrojado')),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (user_id = auth.uid());
create policy "profiles_insert_own" on public.profiles
  for insert with check (user_id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create function public.seed_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id) values (new.id);
  return new;
end;
$$;

revoke execute on function public.seed_profile() from public, anon, authenticated;

create trigger on_auth_user_profile_created
  after insert on auth.users
  for each row execute function public.seed_profile();

-- ---------------------------------------------------------------------------
-- investment_suggestions
-- ---------------------------------------------------------------------------
create table public.investment_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mes_referencia date not null,
  valor_base numeric(14, 2) not null,
  perfil_risco text not null check (perfil_risco in ('conservador', 'moderado', 'arrojado')),
  sugestao jsonb not null,
  modelo text not null default 'openai/gpt-oss-120b',
  created_at timestamptz not null default now()
);

create index investment_suggestions_user_idx on public.investment_suggestions (user_id, created_at desc);

alter table public.investment_suggestions enable row level security;

create policy "investment_suggestions_select_own" on public.investment_suggestions
  for select using (user_id = auth.uid());
create policy "investment_suggestions_insert_own" on public.investment_suggestions
  for insert with check (user_id = auth.uid());
-- sem policy de update/delete: cada geracao cria um novo registro (historico imutavel).
