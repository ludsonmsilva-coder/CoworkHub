-- Booking reminder support columns
alter table if exists public.bookings
  add column if not exists reminder_sent_at timestamptz,
  add column if not exists reminder_error text,
  add column if not exists reminder_attempts integer not null default 0;

-- Helps scan upcoming confirmed bookings with reminders.
create index if not exists idx_bookings_reminder_scan
  on public.bookings (starts_at)
  where status = 'confirmed' and reminder_hours is not null;
