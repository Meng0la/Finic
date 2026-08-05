-- Finic: metas de economia (ex: "juntar R$5.000 até dezembro").
-- valor_atual e incrementado manualmente via aportes (nao esta ligado a
-- transacoes/contas, para nao duplicar contagem com o saldo consolidado).

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  valor_alvo numeric(14, 2) not null check (valor_alvo > 0),
  valor_atual numeric(14, 2) not null default 0 check (valor_atual >= 0),
  data_alvo date,
  status text not null default 'ativa' check (status in ('ativa', 'concluida', 'cancelada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index goals_user_idx on public.goals (user_id, status);

alter table public.goals enable row level security;

create policy "goals_select_own" on public.goals
  for select using (user_id = auth.uid());
create policy "goals_insert_own" on public.goals
  for insert with check (user_id = auth.uid());
create policy "goals_update_own" on public.goals
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "goals_delete_own" on public.goals
  for delete using (user_id = auth.uid());

create trigger goals_set_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();
