-- Security/RLS hardening baseline for CoworkHub
-- Non-destructive: enables RLS, adds policies and indexes used by app queries.

-- 1) Helper: all spaces visible to current authenticated user
create or replace function public.current_user_space_ids()
returns setof uuid
language sql
stable
as $$
  select s.id
  from public.spaces s
  where s.owner_id = auth.uid()
  union
  select m.space_id
  from public.members m
  where m.user_id = auth.uid()
$$;

grant execute on function public.current_user_space_ids() to authenticated;

-- 2) Ensure RLS is enabled on core business tables
alter table if exists public.spaces enable row level security;
alter table if exists public.members enable row level security;
alter table if exists public.rooms enable row level security;
alter table if exists public.bookings enable row level security;
alter table if exists public.leases enable row level security;
alter table if exists public.invoices enable row level security;

-- 3) Spaces policies
drop policy if exists spaces_select_member_or_owner on public.spaces;
create policy spaces_select_member_or_owner
on public.spaces
for select
to authenticated
using (id in (select public.current_user_space_ids()));

drop policy if exists spaces_insert_owner_only on public.spaces;
create policy spaces_insert_owner_only
on public.spaces
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists spaces_update_owner_only on public.spaces;
create policy spaces_update_owner_only
on public.spaces
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists spaces_delete_owner_only on public.spaces;
create policy spaces_delete_owner_only
on public.spaces
for delete
to authenticated
using (owner_id = auth.uid());

-- 4) Members policies
drop policy if exists members_select_same_space on public.members;
create policy members_select_same_space
on public.members
for select
to authenticated
using (space_id in (select public.current_user_space_ids()));

drop policy if exists members_insert_owner_only on public.members;
create policy members_insert_owner_only
on public.members
for insert
to authenticated
with check (
  exists (
    select 1
    from public.spaces s
    where s.id = members.space_id
      and s.owner_id = auth.uid()
  )
);

drop policy if exists members_update_owner_only on public.members;
create policy members_update_owner_only
on public.members
for update
to authenticated
using (
  exists (
    select 1
    from public.spaces s
    where s.id = members.space_id
      and s.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.spaces s
    where s.id = members.space_id
      and s.owner_id = auth.uid()
  )
);

drop policy if exists members_delete_owner_only on public.members;
create policy members_delete_owner_only
on public.members
for delete
to authenticated
using (
  exists (
    select 1
    from public.spaces s
    where s.id = members.space_id
      and s.owner_id = auth.uid()
  )
);

-- 5) Rooms policies
drop policy if exists rooms_select_same_space on public.rooms;
create policy rooms_select_same_space
on public.rooms
for select
to authenticated
using (space_id in (select public.current_user_space_ids()));

drop policy if exists rooms_mutate_owner_only on public.rooms;
create policy rooms_mutate_owner_only
on public.rooms
for all
to authenticated
using (
  exists (
    select 1
    from public.spaces s
    where s.id = rooms.space_id
      and s.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.spaces s
    where s.id = rooms.space_id
      and s.owner_id = auth.uid()
  )
);

-- 6) Bookings policies
drop policy if exists bookings_select_same_space on public.bookings;
create policy bookings_select_same_space
on public.bookings
for select
to authenticated
using (space_id in (select public.current_user_space_ids()));

drop policy if exists bookings_mutate_owner_only on public.bookings;
create policy bookings_mutate_owner_only
on public.bookings
for all
to authenticated
using (
  exists (
    select 1
    from public.spaces s
    where s.id = bookings.space_id
      and s.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.spaces s
    where s.id = bookings.space_id
      and s.owner_id = auth.uid()
  )
);

-- 7) Leases policies
drop policy if exists leases_select_same_space on public.leases;
create policy leases_select_same_space
on public.leases
for select
to authenticated
using (space_id in (select public.current_user_space_ids()));

drop policy if exists leases_mutate_owner_only on public.leases;
create policy leases_mutate_owner_only
on public.leases
for all
to authenticated
using (
  exists (
    select 1
    from public.spaces s
    where s.id = leases.space_id
      and s.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.spaces s
    where s.id = leases.space_id
      and s.owner_id = auth.uid()
  )
);

-- 8) Invoices policies
drop policy if exists invoices_select_same_space on public.invoices;
create policy invoices_select_same_space
on public.invoices
for select
to authenticated
using (space_id in (select public.current_user_space_ids()));

drop policy if exists invoices_mutate_owner_only on public.invoices;
create policy invoices_mutate_owner_only
on public.invoices
for all
to authenticated
using (
  exists (
    select 1
    from public.spaces s
    where s.id = invoices.space_id
      and s.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.spaces s
    where s.id = invoices.space_id
      and s.owner_id = auth.uid()
  )
);

-- 9) Storage hardening for logos bucket (optional if bucket exists)
-- Operator can write only under "<space_id>/..." for spaces they own.
drop policy if exists logos_insert_owner_only on storage.objects;
create policy logos_insert_owner_only
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'logos'
  and split_part(name, '/', 1) ~ '^[0-9a-fA-F-]{36}$'
  and exists (
    select 1
    from public.spaces s
    where s.id = split_part(storage.objects.name, '/', 1)::uuid
      and s.owner_id = auth.uid()
  )
);

drop policy if exists logos_update_owner_only on storage.objects;
create policy logos_update_owner_only
on storage.objects
for update
to authenticated
using (
  bucket_id = 'logos'
  and split_part(name, '/', 1) ~ '^[0-9a-fA-F-]{36}$'
  and exists (
    select 1
    from public.spaces s
    where s.id = split_part(storage.objects.name, '/', 1)::uuid
      and s.owner_id = auth.uid()
  )
)
with check (
  bucket_id = 'logos'
  and split_part(name, '/', 1) ~ '^[0-9a-fA-F-]{36}$'
  and exists (
    select 1
    from public.spaces s
    where s.id = split_part(storage.objects.name, '/', 1)::uuid
      and s.owner_id = auth.uid()
  )
);

drop policy if exists logos_delete_owner_only on storage.objects;
create policy logos_delete_owner_only
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'logos'
  and split_part(name, '/', 1) ~ '^[0-9a-fA-F-]{36}$'
  and exists (
    select 1
    from public.spaces s
    where s.id = split_part(storage.objects.name, '/', 1)::uuid
      and s.owner_id = auth.uid()
  )
);

-- 10) Query-performance indexes aligned with app access patterns
create index if not exists idx_spaces_owner_id on public.spaces(owner_id);

create index if not exists idx_members_space_status_joined
  on public.members(space_id, status, joined_at desc);
create index if not exists idx_members_user_id
  on public.members(user_id);

create index if not exists idx_rooms_space_active_created
  on public.rooms(space_id, is_active, created_at);

create index if not exists idx_bookings_space_status_starts
  on public.bookings(space_id, status, starts_at);
create index if not exists idx_bookings_room_status_starts_ends
  on public.bookings(room_id, status, starts_at, ends_at);
create index if not exists idx_bookings_member_status_starts
  on public.bookings(member_id, status, starts_at);

create index if not exists idx_leases_space_status_created
  on public.leases(space_id, status, created_at);
create index if not exists idx_leases_unit_status
  on public.leases(unit_id, status);
create index if not exists idx_leases_member_status
  on public.leases(member_id, status);

create index if not exists idx_invoices_space_status_due
  on public.invoices(space_id, status, due_date);
create index if not exists idx_invoices_member_status_due
  on public.invoices(member_id, status, due_date);
