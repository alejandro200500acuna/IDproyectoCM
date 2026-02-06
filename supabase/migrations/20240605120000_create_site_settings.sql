-- Create site_settings table if it doesn't exist
create table if not exists public.site_settings (
  key text primary key,
  value text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.site_settings enable row level security;

-- Allow read access to everyone
create policy "Public read access"
  on public.site_settings for select
  using (true);

-- Allow write access to authenticed users (admins) 
-- In a stricter environment we would check for admin role, 
-- but for now assuming auth user is sufficient as per current simple auth model
create policy "Authenticated update access"
  on public.site_settings for update
  using (auth.role() = 'authenticated');

create policy "Authenticated insert access"
  on public.site_settings for insert
  with check (auth.role() = 'authenticated');
