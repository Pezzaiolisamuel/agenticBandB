create index if not exists chat_booking_state_updated_at_idx
  on public.chat_booking_state (updated_at);

create or replace function public.cleanup_stale_chat_booking_state()
returns void
language sql
as $$
  delete from public.chat_booking_state
  where updated_at < now() - interval '7 days';
$$;
