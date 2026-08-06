-- Classificação 50/30/20 (essencial / desejo / investimento) por categoria de
-- despesa. Nulo = não classificado (o usuário escolhe depois na página de
-- Categorias). Categorias de receita nunca têm grupo.
alter table public.categories
  add column grupo_orcamentario text
  check (grupo_orcamentario in ('essencial', 'desejo', 'investimento'));

update public.categories set grupo_orcamentario = 'essencial'
  where tipo = 'despesa' and nome in ('Alimentação', 'Transporte', 'Moradia', 'Saúde');
update public.categories set grupo_orcamentario = 'desejo'
  where tipo = 'despesa' and nome in ('Lazer', 'Educação');
update public.categories set grupo_orcamentario = 'investimento'
  where tipo = 'despesa' and nome = 'Investimentos';

create or replace function public.seed_default_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (user_id, nome, tipo, cor, icone, is_padrao, grupo_orcamentario) values
    (new.id, 'Salário', 'receita', '#22c55e', 'wallet', true, null),
    (new.id, 'Outras receitas', 'receita', '#84cc16', 'plus-circle', true, null),
    (new.id, 'Alimentação', 'despesa', '#f97316', 'utensils', true, 'essencial'),
    (new.id, 'Transporte', 'despesa', '#3b82f6', 'car', true, 'essencial'),
    (new.id, 'Moradia', 'despesa', '#8b5cf6', 'home', true, 'essencial'),
    (new.id, 'Saúde', 'despesa', '#ef4444', 'heart-pulse', true, 'essencial'),
    (new.id, 'Lazer', 'despesa', '#ec4899', 'party-popper', true, 'desejo'),
    (new.id, 'Educação', 'despesa', '#06b6d4', 'book-open', true, 'desejo'),
    (new.id, 'Investimentos', 'despesa', '#eab308', 'trending-up', true, 'investimento'),
    (new.id, 'Outros', 'despesa', '#64748b', 'circle', true, null);
  return new;
end;
$$;
