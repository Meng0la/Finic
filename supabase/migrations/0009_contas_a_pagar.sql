-- Contas a pagar (lembretes de vencimento): boletos, assinaturas e outras
-- despesas fixas com dia de vencimento no mês. bill_payments registra a
-- baixa mês a mês, opcionalmente linkada à transação criada ao marcar como
-- paga (transaction_id vira null se a transação for apagada, sem derrubar
-- o histórico de pagamento).
create table public.bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  valor numeric(12, 2) not null check (valor > 0),
  dia_vencimento smallint not null check (dia_vencimento between 1 and 31),
  category_id uuid references public.categories (id) on delete set null,
  account_id uuid references public.accounts (id) on delete set null,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bills_user_idx on public.bills (user_id, ativo);

alter table public.bills enable row level security;

create policy "bills_select_own" on public.bills
  for select using (user_id = auth.uid());
create policy "bills_insert_own" on public.bills
  for insert with check (user_id = auth.uid());
create policy "bills_update_own" on public.bills
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "bills_delete_own" on public.bills
  for delete using (user_id = auth.uid());

create trigger bills_set_updated_at
  before update on public.bills
  for each row execute function public.set_updated_at();

create table public.bill_payments (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references public.bills (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  mes_referencia date not null,
  transaction_id uuid references public.transactions (id) on delete set null,
  paid_at timestamptz not null default now(),
  unique (bill_id, mes_referencia)
);

create index bill_payments_user_idx on public.bill_payments (user_id, mes_referencia);

alter table public.bill_payments enable row level security;

create policy "bill_payments_select_own" on public.bill_payments
  for select using (user_id = auth.uid());
create policy "bill_payments_insert_own" on public.bill_payments
  for insert with check (user_id = auth.uid());
create policy "bill_payments_delete_own" on public.bill_payments
  for delete using (user_id = auth.uid());
