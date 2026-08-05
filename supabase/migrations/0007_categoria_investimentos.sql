-- Investimentos vira categoria de despesa de primeira classe: passa a existir
-- pra todo usuario novo e cai automaticamente em orcamentos, filtros e no
-- resumo de renda comprometida da pagina de Orcamentos.
create or replace function public.seed_default_categories()
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
    (new.id, 'Investimentos', 'despesa', '#eab308', 'trending-up', true),
    (new.id, 'Outros', 'despesa', '#64748b', 'circle', true);
  return new;
end;
$$;

-- Backfill pra usuarios que ja existiam antes desta migration.
insert into public.categories (user_id, nome, tipo, cor, icone, is_padrao)
select u.id, 'Investimentos', 'despesa', '#eab308', 'trending-up', true
from auth.users u
where not exists (
  select 1 from public.categories c
  where c.user_id = u.id and c.nome = 'Investimentos' and c.tipo = 'despesa'
);
