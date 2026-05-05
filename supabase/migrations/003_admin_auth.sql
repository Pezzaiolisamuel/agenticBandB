create table public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_profiles enable row level security;

create policy "authenticated users can read own admin profile"
on public.admin_profiles for select
to authenticated
using (auth.uid() = user_id);
