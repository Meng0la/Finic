-- Finic: adiciona nivel de experiencia do investidor (iniciante/intermediario/
-- avancado), usado junto com perfil_risco para calibrar a profundidade
-- didatica das sugestoes de investimento geradas por IA.

alter table public.profiles
  add column experiencia text not null default 'iniciante'
    check (experiencia in ('iniciante', 'intermediario', 'avancado'));

alter table public.investment_suggestions
  add column experiencia text not null default 'iniciante'
    check (experiencia in ('iniciante', 'intermediario', 'avancado'));
