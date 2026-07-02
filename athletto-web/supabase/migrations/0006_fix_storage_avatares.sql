-- ============================================================================
-- Athletto — 0006_fix_storage_avatares.sql
-- Fix: a foto do gestor/responsável sobe em `avatares/<user_id>/avatar.png`
-- (useGestor.uploadFoto), mas as policies de 0004 só permitiam a pasta
-- `<clube_id>/...` → "new row violates row-level security policy".
-- Solução: permitir também a pasta do próprio usuário (auth.uid()).
-- ============================================================================

drop policy if exists athletto_avatares_insert on storage.objects;
drop policy if exists athletto_avatares_update on storage.objects;
drop policy if exists athletto_avatares_delete on storage.objects;

create policy athletto_avatares_insert on storage.objects
  for insert
  with check (
    bucket_id = 'avatares'
    and (
      public.is_superadmin()
      or (storage.foldername(name))[1] = public.current_clube_id()::text
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

create policy athletto_avatares_update on storage.objects
  for update
  using (
    bucket_id = 'avatares'
    and (
      public.is_superadmin()
      or (storage.foldername(name))[1] = public.current_clube_id()::text
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  )
  with check (
    bucket_id = 'avatares'
    and (
      public.is_superadmin()
      or (storage.foldername(name))[1] = public.current_clube_id()::text
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

create policy athletto_avatares_delete on storage.objects
  for delete
  using (
    bucket_id = 'avatares'
    and (
      public.is_superadmin()
      or (storage.foldername(name))[1] = public.current_clube_id()::text
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );
