create table if not exists public.booking_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  event_type text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists booking_events_booking_created_idx
  on public.booking_events (booking_id, created_at desc);

alter table public.booking_events enable row level security;
