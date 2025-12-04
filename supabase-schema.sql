-- =============================================
-- SUPABASE DATABASE SCHEMA FOR GRAFICOS AI
-- =============================================
-- Run this in Supabase SQL Editor

-- 1. Create charts table
create table if not exists public.charts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  anonymous_id text, -- Para usuarios sin cuenta (localStorage ID)
  title text not null,
  chart_type text not null check (chart_type in ('bar', 'line', 'pie', 'area')),
  labels jsonb not null,
  values jsonb not null,
  unit text,
  description text,
  sources jsonb,
  insights jsonb,
  trend text check (trend in ('up', 'down', 'stable') or trend is null),
  is_public boolean default false,
  share_id text unique, -- URL-friendly ID for sharing
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Create index for faster queries
create index if not exists charts_user_id_idx on public.charts(user_id);
create index if not exists charts_anonymous_id_idx on public.charts(anonymous_id);
create index if not exists charts_share_id_idx on public.charts(share_id);
create index if not exists charts_created_at_idx on public.charts(created_at desc);

-- 3. Enable Row Level Security
alter table public.charts enable row level security;

-- 4. RLS Policies

-- Users can view their own charts
create policy "Users can view own charts" on public.charts
  for select using (
    auth.uid() = user_id 
    or anonymous_id = current_setting('app.anonymous_id', true)
  );

-- Anyone can view public/shared charts
create policy "Anyone can view public charts" on public.charts
  for select using (is_public = true);

-- Users can insert charts (authenticated or anonymous)
create policy "Users can insert charts" on public.charts
  for insert with check (
    auth.uid() = user_id 
    or (user_id is null and anonymous_id is not null)
  );

-- Users can update their own charts
create policy "Users can update own charts" on public.charts
  for update using (
    auth.uid() = user_id 
    or anonymous_id = current_setting('app.anonymous_id', true)
  );

-- Users can delete their own charts
create policy "Users can delete own charts" on public.charts
  for delete using (
    auth.uid() = user_id 
    or anonymous_id = current_setting('app.anonymous_id', true)
  );

-- 5. Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 6. Trigger for updated_at
drop trigger if exists on_charts_updated on public.charts;
create trigger on_charts_updated
  before update on public.charts
  for each row execute procedure public.handle_updated_at();

-- 7. Function to generate share_id
create or replace function public.generate_share_id()
returns trigger as $$
begin
  if new.share_id is null then
    new.share_id = encode(gen_random_bytes(6), 'base64');
    -- Remove problematic characters for URLs
    new.share_id = replace(replace(replace(new.share_id, '/', '_'), '+', '-'), '=', '');
  end if;
  return new;
end;
$$ language plpgsql;

-- 8. Trigger for share_id generation
drop trigger if exists on_charts_generate_share_id on public.charts;
create trigger on_charts_generate_share_id
  before insert on public.charts
  for each row execute procedure public.generate_share_id();

-- =============================================
-- SUPABASE AUTH CONFIGURATION (do in Dashboard)
-- =============================================
-- 1. Go to Authentication -> Providers
-- 2. Enable Google provider
-- 3. Add your Google OAuth credentials:
--    - Client ID from Google Cloud Console
--    - Client Secret from Google Cloud Console
-- 4. Set redirect URL in Google Cloud Console:
--    https://your-project.supabase.co/auth/v1/callback
-- 5. Add your app URL to allowed redirect URLs in Supabase:
--    - http://localhost:5173 (development)
--    - https://graficos.ignacio.cloud (production)
