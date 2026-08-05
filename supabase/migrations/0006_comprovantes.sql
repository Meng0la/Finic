-- Finic: anexo de comprovante (foto/PDF) por transacao.
-- Bucket privado no Storage; cada usuario so acessa objetos dentro da sua
-- propria pasta (prefixo do nome do arquivo = user_id).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'comprovantes',
  'comprovantes',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

create policy "comprovantes_select_own" on storage.objects
  for select using (bucket_id = 'comprovantes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "comprovantes_insert_own" on storage.objects
  for insert with check (bucket_id = 'comprovantes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "comprovantes_delete_own" on storage.objects
  for delete using (bucket_id = 'comprovantes' and (storage.foldername(name))[1] = auth.uid()::text);

alter table public.transactions
  add column anexo_path text;
