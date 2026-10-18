-- Run this in Supabase Dashboard > SQL Editor.
-- Replace admin@example.com below with the exact email of your Supabase Auth admin user.
create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 180),
  artist text not null default '',
  album text not null default '',
  track_no integer not null check (track_no > 0),
  audio_url text not null,
  cover_url text not null,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists songs_track_no_idx on public.songs(track_no);
alter table public.songs enable row level security;
drop policy if exists "Anyone can read published songs" on public.songs;
create policy "Anyone can read published songs" on public.songs for select using (published = true);
drop policy if exists "Admin can read all songs" on public.songs;
create policy "Admin can read all songs" on public.songs for select to authenticated using ((auth.jwt() ->> 'email') = 'admin@example.com');
drop policy if exists "Admin can insert songs" on public.songs;
create policy "Admin can insert songs" on public.songs for insert to authenticated with check ((auth.jwt() ->> 'email') = 'admin@example.com');
drop policy if exists "Admin can update songs" on public.songs;
create policy "Admin can update songs" on public.songs for update to authenticated using ((auth.jwt() ->> 'email') = 'admin@example.com') with check ((auth.jwt() ->> 'email') = 'admin@example.com');
drop policy if exists "Admin can delete songs" on public.songs;
create policy "Admin can delete songs" on public.songs for delete to authenticated using ((auth.jwt() ->> 'email') = 'admin@example.com');

-- Create a PUBLIC bucket for published audio/artwork URLs, with admin-only uploads.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('waris-media', 'waris-media', true, 52428800, array['audio/mpeg','audio/mp4','audio/wav','audio/ogg','image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 52428800;
drop policy if exists "Admin can upload Waris media" on storage.objects;
create policy "Admin can upload Waris media" on storage.objects for insert to authenticated with check (bucket_id = 'waris-media' and (auth.jwt() ->> 'email') = 'admin@example.com');
drop policy if exists "Admin can update Waris media" on storage.objects;
create policy "Admin can update Waris media" on storage.objects for update to authenticated using (bucket_id = 'waris-media' and (auth.jwt() ->> 'email') = 'admin@example.com') with check (bucket_id = 'waris-media' and (auth.jwt() ->> 'email') = 'admin@example.com');
drop policy if exists "Admin can delete Waris media" on storage.objects;
create policy "Admin can delete Waris media" on storage.objects for delete to authenticated using (bucket_id = 'waris-media' and (auth.jwt() ->> 'email') = 'admin@example.com');
