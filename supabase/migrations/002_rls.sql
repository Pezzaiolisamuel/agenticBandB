alter table public.rooms enable row level security;
alter table public.room_images enable row level security;
alter table public.pricing_rules enable row level security;
alter table public.bookings enable row level security;
alter table public.availability_blocks enable row level security;
alter table public.policies enable row level security;
alter table public.site_content enable row level security;
alter table public.consents enable row level security;
alter table public.agent_logs enable row level security;

create policy "public read active rooms"
on public.rooms for select
using (is_active = true);

create policy "public read room images"
on public.room_images for select
using (true);

create policy "public read policies"
on public.policies for select
using (true);

create policy "public read site content"
on public.site_content for select
using (true);