-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create Enum for Roles
create type user_role as enum ('admin', 'parent', 'student');

-- PROFILES Table
create table public.profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  role user_role default 'student',
  created_at timestamptz default now()
);

-- GRADES Table
create table public.grades (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  academic_year text not null,
  active boolean default true,
  created_at timestamptz default now()
);

-- STUDENTS Table
create table public.students (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users unique, -- Optional link to auth user
  full_name text not null,
  cedula text unique not null,
  grade_id uuid references public.grades not null,
  academic_year text not null,
  photo_url text, -- Storage URL
  created_at timestamptz default now()
);

-- PARENTS Table
create table public.parents (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users unique, -- Link to auth user
  full_name text not null,
  cedula text unique not null,
  email text unique not null,
  phone text,
  created_at timestamptz default now()
);

-- PARENT_STUDENTS Junction Table
create table public.parent_student (
  id uuid default uuid_generate_v4() primary key,
  parent_id uuid references public.parents on delete cascade not null,
  student_id uuid references public.students on delete cascade not null,
  unique(parent_id, student_id)
);

-- TEMPLATES Table
create table public.templates (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  image_url text not null,
  created_at timestamptz default now()
);

-- TEMPLATE_GRADES Junction Table
create table public.template_grades (
  id uuid default uuid_generate_v4() primary key,
  template_id uuid references public.templates on delete cascade not null,
  grade_id uuid references public.grades on delete cascade not null,
  unique(template_id, grade_id)
);

-- TEMPLATE DESIGN ELEMENTS Table
create table public.template_design_elements (
  id uuid default uuid_generate_v4() primary key,
  template_id uuid references public.templates on delete cascade not null,
  field_type text not null, -- 'name', 'grade', 'year', 'photo'
  x_position numeric not null,
  y_position numeric not null,
  width numeric,
  height numeric,
  created_at timestamptz default now()
);

-- STORAGE BUCKETS
-- You need to create these buckets in Supabase dashboard: 'photos', 'templates'

-- RLS POLICIES (Simplified for initial setup - You should refine these)
alter table public.profiles enable row level security;
alter table public.grades enable row level security;
alter table public.students enable row level security;
alter table public.parents enable row level security;
alter table public.parent_student enable row level security;
alter table public.templates enable row level security;

-- Admin Access Policy (Global)
-- Ideally, create a function is_admin() checking public.profiles
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer;

-- Apply generic polices (Read all for now to ease development, restrict writes to admin)
create policy "Public Read" on public.grades for select using (true);
create policy "Admin Write Grades" on public.grades for all using (public.is_admin());

create policy "Admin Write Students" on public.students for all using (public.is_admin());
create policy "Student Read Own" on public.students for select using (auth.uid() = user_id);
create policy "Parent Read Kids" on public.students for select using (
  exists (
    select 1 from public.parent_student ps
    join public.parents p on p.id = ps.parent_id
    where p.user_id = auth.uid() and ps.student_id = public.students.id
  )
);
create policy "Admin Read Students" on public.students for select using (public.is_admin());

-- Set up trigger for new users to automatic create profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', (new.raw_user_meta_data->>'role')::user_role);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
