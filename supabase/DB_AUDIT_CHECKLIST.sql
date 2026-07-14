-- CoworkHub - DB audit checklist (run in Supabase SQL Editor)
-- Objective: verify RLS, policies, indexes, and integrity risks in production.

-- 1) RLS status on core tables
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('spaces','members','rooms','bookings','leases','invoices')
order by tablename;

-- 2) Policies by table
select schemaname, tablename, policyname, permissive, cmd, roles, qual, with_check
from pg_policies
where schemaname in ('public','storage')
  and tablename in ('spaces','members','rooms','bookings','leases','invoices','objects')
order by schemaname, tablename, policyname;

-- 3) Existing indexes and usage hints
select schemaname, tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in ('spaces','members','rooms','bookings','leases','invoices')
order by tablename, indexname;

-- 4) Potential duplicates/integrity issues
-- 4.1 Active lease collision (same unit with >1 active lease)
select unit_id, count(*) as active_count
from public.leases
where status = 'active'
group by unit_id
having count(*) > 1
order by active_count desc;

-- 4.2 Bookings with invalid times
select id, room_id, starts_at, ends_at
from public.bookings
where ends_at <= starts_at
order by starts_at desc
limit 100;

-- 4.3 Members without space relation
select m.id, m.space_id
from public.members m
left join public.spaces s on s.id = m.space_id
where s.id is null
limit 100;

-- 4.4 Leases with unit outside same space (if join model requires same space)
select l.id, l.space_id as lease_space, r.space_id as room_space, l.unit_id
from public.leases l
join public.rooms r on r.id = l.unit_id
where l.space_id <> r.space_id
limit 100;

-- 5) Reminder columns/index health
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'bookings'
  and column_name in ('reminder_hours','reminder_sent_at','reminder_error','reminder_attempts')
order by column_name;

select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'bookings'
  and indexname ilike '%reminder%';
