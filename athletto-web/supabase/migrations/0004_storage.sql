-- ============================================================================
-- Athletto — 0004_storage.sql
-- Buckets de storage (logos, avatares) + policies em storage.objects.
--
-- Convenção de path: <clube_id>/<arquivo>   ex.: 'd9b1...e7/logo.png'
-- Leitura pública (a logo aparece na página pública de cadastro e no app
-- do atleta); escrita restrita ao gestor do clube dono da pasta ou superadmin.
-- ============================================================================

-- ── Buckets ─────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'logos', 'logos', true,
  2 * 1024 * 1024,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatares', 'avatares', true,
  2 * 1024 * 1024,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ── Policies em storage.objects ─────────────────────────────────────────────

drop policy if exists athletto_logos_select    on storage.objects;
drop policy if exists athletto_logos_insert    on storage.objects;
drop policy if exists athletto_logos_update    on storage.objects;
drop policy if exists athletto_logos_delete    on storage.objects;
drop policy if exists athletto_avatares_select on storage.objects;
drop policy if exists athletto_avatares_insert on storage.objects;
drop policy if exists athletto_avatares_update on storage.objects;
drop policy if exists athletto_avatares_delete on storage.objects;
-- nomes legados
drop policy if exists athletto_logos_select_public    on storage.objects;
drop policy if exists athletto_avatares_select_public on storage.objects;
drop policy if exists athletto_avatares_modify        on storage.objects;

-- LOGOS — leitura pública; escrita por pasta do clube
create policy athletto_logos_select on storage.objects
  for select
  using (bucket_id = 'logos');

create policy athletto_logos_insert on storage.objects
  for insert
  with check (
    bucket_id = 'logos'
    and (
      public.is_superadmin()
      or (storage.foldername(name))[1] = public.current_clube_id()::text
    )
  );

create policy athletto_logos_update on storage.objects
  for update
  using (
    bucket_id = 'logos'
    and (
      public.is_superadmin()
      or (storage.foldername(name))[1] = public.current_clube_id()::text
    )
  )
  with check (
    bucket_id = 'logos'
    and (
      public.is_superadmin()
      or (storage.foldername(name))[1] = public.current_clube_id()::text
    )
  );

create policy athletto_logos_delete on storage.objects
  for delete
  using (
    bucket_id = 'logos'
    and (
      public.is_superadmin()
      or (storage.foldername(name))[1] = public.current_clube_id()::text
    )
  );

-- AVATARES — leitura pública; escrita por pasta do clube
create policy athletto_avatares_select on storage.objects
  for select
  using (bucket_id = 'avatares');

create policy athletto_avatares_insert on storage.objects
  for insert
  with check (
    bucket_id = 'avatares'
    and (
      public.is_superadmin()
      or (storage.foldername(name))[1] = public.current_clube_id()::text
    )
  );

create policy athletto_avatares_update on storage.objects
  for update
  using (
    bucket_id = 'avatares'
    and (
      public.is_superadmin()
      or (storage.foldername(name))[1] = public.current_clube_id()::text
    )
  )
  with check (
    bucket_id = 'avatares'
    and (
      public.is_superadmin()
      or (storage.foldername(name))[1] = public.current_clube_id()::text
    )
  );

create policy athletto_avatares_delete on storage.objects
  for delete
  using (
    bucket_id = 'avatares'
    and (
      public.is_superadmin()
      or (storage.foldername(name))[1] = public.current_clube_id()::text
    )
  );
