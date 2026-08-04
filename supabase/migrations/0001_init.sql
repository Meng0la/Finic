-- Finic: schema inicial (Fase 1 - MVP web)
-- RLS por user_id em toda tabela com dado financeiro. Nenhuma policy de DELETE
-- é criada para transactions/audit_log: exclusão é sempre lógica (soft delete),
-- reforçada no nível do banco, não só na aplicação.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- accounts
-- ---------------------------------------------------------------------------
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  tipo text not null check (tipo in ('corrente', 'poupanca', 'dinheiro', 'cartao')),
  saldo_inicial numeric(14, 2) not null default 0,
  limite numeric(14, 2),
  dia_fechamento smallint check (dia_fechamento between 1 and 31),
  dia_vencimento smallint check (dia_vencimento between 1 and 31),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.accounts enable row level security;

create policy "accounts_select_own" on public.accounts
  for select using (user_id = auth.uid());
create policy "accounts_insert_own" on public.accounts
  for insert with check (user_id = auth.uid());
create policy "accounts_update_own" on public.accounts
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
-- sem policy de delete: contas são desativadas (ativo = false), nunca apagadas.

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  tipo text not null check (tipo in ('receita', 'despesa')),
  cor text not null default '#64748b',
  icone text not null default 'circle',
  is_padrao boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, nome, tipo)
);

alter table public.categories enable row level security;

create policy "categories_select_own" on public.categories
  for select using (user_id = auth.uid());
create policy "categories_insert_own" on public.categories
  for insert with check (user_id = auth.uid());
create policy "categories_update_own" on public.categories
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "categories_delete_own_custom" on public.categories
  for delete using (user_id = auth.uid() and is_padrao = false);

-- ---------------------------------------------------------------------------
-- transactions
-- ---------------------------------------------------------------------------
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id),
  conta_destino_id uuid references public.accounts (id),
  category_id uuid references public.categories (id),
  valor numeric(14, 2) not null check (valor > 0),
  tipo text not null check (tipo in ('receita', 'despesa', 'transferencia')),
  data date not null,
  descricao text,
  forma_pagamento text,
  recorrencia text not null default 'unica' check (recorrencia in ('unica', 'fixa_mensal', 'parcelada')),
  parcela_atual smallint,
  parcelas_total smallint,
  grupo_recorrencia_id uuid,
  origem text not null default 'web' check (origem in ('web', 'whatsapp')),
  status text not null default 'ativo' check (status in ('ativo', 'estornado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (tipo <> 'transferencia' or conta_destino_id is not null)
);

create index transactions_user_data_idx on public.transactions (user_id, data desc);
create index transactions_account_idx on public.transactions (account_id);
create index transactions_category_idx on public.transactions (category_id);

alter table public.transactions enable row level security;

create policy "transactions_select_own" on public.transactions
  for select using (user_id = auth.uid());
create policy "transactions_insert_own" on public.transactions
  for insert with check (user_id = auth.uid());
create policy "transactions_update_own" on public.transactions
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
-- sem policy de delete: estorno é feito via status = 'estornado' (soft delete).

-- ---------------------------------------------------------------------------
-- budgets
-- ---------------------------------------------------------------------------
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id),
  limite_mensal numeric(14, 2) not null check (limite_mensal > 0),
  mes_referencia date not null,
  created_at timestamptz not null default now(),
  unique (user_id, category_id, mes_referencia)
);

alter table public.budgets enable row level security;

create policy "budgets_select_own" on public.budgets
  for select using (user_id = auth.uid());
create policy "budgets_insert_own" on public.budgets
  for insert with check (user_id = auth.uid());
create policy "budgets_update_own" on public.budgets
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "budgets_delete_own" on public.budgets
  for delete using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- whatsapp_links (schema pronto desde já; fluxo de vinculação é Fase 2)
-- ---------------------------------------------------------------------------
create table public.whatsapp_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  numero_hash text not null,
  numero_ultimos_digitos text not null,
  status text not null default 'pendente' check (status in ('pendente', 'verificado', 'revogado')),
  codigo_verificacao_hash text,
  codigo_expira_em timestamptz,
  verificado_em timestamptz,
  revogado_em timestamptz,
  created_at timestamptz not null default now()
);

alter table public.whatsapp_links enable row level security;

create policy "whatsapp_links_select_own" on public.whatsapp_links
  for select using (user_id = auth.uid());
create policy "whatsapp_links_insert_own" on public.whatsapp_links
  for insert with check (user_id = auth.uid());
create policy "whatsapp_links_update_own" on public.whatsapp_links
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- audit_log (append-only; sem policy de insert/update/delete para o cliente —
-- gravação só acontece via trigger SECURITY DEFINER abaixo)
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entidade text not null,
  entidade_id uuid,
  acao text not null check (acao in ('insert', 'update', 'soft_delete', 'estorno')),
  dado_anterior jsonb,
  dado_novo jsonb,
  origem text not null default 'web' check (origem in ('web', 'whatsapp', 'sistema')),
  created_at timestamptz not null default now()
);

create index audit_log_user_idx on public.audit_log (user_id, created_at desc);

alter table public.audit_log enable row level security;

create policy "audit_log_select_own" on public.audit_log
  for select using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- funções utilitárias
-- ---------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger accounts_set_updated_at
  before update on public.accounts
  for each row execute function public.set_updated_at();

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

-- audit_log é alimentado por trigger, não diretamente pelo cliente.
create function public.log_transaction_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_acao text;
begin
  if tg_op = 'INSERT' then
    v_acao := 'insert';
  elsif new.status = 'estornado' and old.status <> 'estornado' then
    v_acao := 'estorno';
  else
    v_acao := 'update';
  end if;

  insert into public.audit_log (user_id, entidade, entidade_id, acao, dado_anterior, dado_novo, origem)
  values (
    new.user_id,
    'transactions',
    new.id,
    v_acao,
    case when tg_op = 'UPDATE' then to_jsonb(old) else null end,
    to_jsonb(new),
    new.origem
  );

  return new;
end;
$$;

create trigger transactions_audit
  after insert or update on public.transactions
  for each row execute function public.log_transaction_change();

-- Semeia categorias padrão para todo novo usuário.
create function public.seed_default_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (user_id, nome, tipo, cor, icone, is_padrao) values
    (new.id, 'Salário', 'receita', '#22c55e', 'wallet', true),
    (new.id, 'Outras receitas', 'receita', '#84cc16', 'plus-circle', true),
    (new.id, 'Alimentação', 'despesa', '#f97316', 'utensils', true),
    (new.id, 'Transporte', 'despesa', '#3b82f6', 'car', true),
    (new.id, 'Moradia', 'despesa', '#8b5cf6', 'home', true),
    (new.id, 'Saúde', 'despesa', '#ef4444', 'heart-pulse', true),
    (new.id, 'Lazer', 'despesa', '#ec4899', 'party-popper', true),
    (new.id, 'Educação', 'despesa', '#06b6d4', 'book-open', true),
    (new.id, 'Outros', 'despesa', '#64748b', 'circle', true);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.seed_default_categories();
