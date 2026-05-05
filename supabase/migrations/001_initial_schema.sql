create extension if not exists pgcrypto;

create type booking_status as enum (
  'pending_admin_confirmation',
  'confirmed',
  'cancelled',
  'completed'
);

create type booking_source as enum (
  'website',
  'phone',
  'admin'
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_it text not null,
  name_en text not null,
  description_it text not null,
  description_en text not null,
  bed_type text not null,
  max_guests integer not null check (max_guests >= 1),
  included_guests integer not null default 1 check (included_guests >= 1),
  base_price_eur numeric(10,2) not null check (base_price_eur >= 0),
  extra_guest_price_eur numeric(10,2) not null default 0 check (extra_guest_price_eur >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.room_images (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  storage_path text not null,
  alt_it text not null,
  alt_en text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.pricing_rules (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  price_eur numeric(10,2) not null check (price_eur >= 0),
  min_nights integer not null default 1 check (min_nights >= 1),
  created_at timestamptz not null default now(),
  constraint pricing_rules_dates check (end_date >= start_date)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_code text unique not null,
  room_id uuid not null references public.rooms(id),
  source booking_source not null,
  status booking_status not null default 'pending_admin_confirmation',
  guest_full_name text not null,
  guest_email text not null,
  guest_phone text,
  language text not null default 'it' check (language in ('it', 'en')),
  guests_count integer not null check (guests_count >= 1),
  check_in_date date not null,
  check_out_date date not null,
  nights integer not null check (nights >= 1),
  price_total_eur numeric(10,2) not null check (price_total_eur >= 0),
  notes text,
  cancellation_policy_snapshot_it text not null,
  cancellation_policy_snapshot_en text not null,
  consent_privacy boolean not null default false,
  consent_cookies boolean not null default false,
  auto_confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_dates check (check_out_date > check_in_date)
);

create table public.availability_blocks (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text not null,
  created_by text not null,
  created_at timestamptz not null default now(),
  constraint availability_blocks_dates check (end_date > start_date)
);

create table public.policies (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value_it text not null,
  value_en text not null,
  updated_at timestamptz not null default now()
);

create table public.site_content (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value_it text not null,
  value_en text not null,
  updated_at timestamptz not null default now()
);

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  visitor_id text,
  consent_type text not null,
  accepted boolean not null,
  language text not null check (language in ('it', 'en')),
  created_at timestamptz not null default now()
);

create table public.agent_logs (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('website_chat', 'website_voice', 'phone')),
  session_id text not null,
  user_message text,
  assistant_message text,
  tool_name text,
  created_at timestamptz not null default now()
);

create index bookings_room_dates_idx
  on public.bookings (room_id, check_in_date, check_out_date);

create index availability_blocks_room_dates_idx
  on public.availability_blocks (room_id, start_date, end_date);