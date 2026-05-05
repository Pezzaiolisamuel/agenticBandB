create table if not exists public.app_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  source text not null,
  message text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists app_events_type_created_at_idx
  on public.app_events (event_type, created_at desc);
