-- Identidade visual da turma: ícone (esporte) + cor. Aditivo, com defaults.
alter table public.turmas
  add column if not exists icone text not null default 'whistle',
  add column if not exists cor   text not null default 'brand';

comment on column public.turmas.icone is 'Ícone esportivo da turma (chave do set do front: whistle, soccer, volleyball, basketball, swimming, tennis, running, fight, gym, generic).';
comment on column public.turmas.cor   is 'Cor de identidade da turma (chave: brand, emerald, amber, rose, violet).';
