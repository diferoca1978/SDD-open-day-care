create type public.child_status as enum ('active', 'archived');

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares (id),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.children (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id),
  full_name text not null,
  birth_date date not null,
  enrolled_at date not null default current_date,
  medical_notes text,
  allergy_tags text[] not null default '{}',
  photo_consent boolean not null default true,
  status public.child_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index rooms_daycare_id_idx on public.rooms using btree (daycare_id);
create index children_room_id_idx on public.children using btree (room_id);

alter table public.rooms enable row level security;
alter table public.children enable row level security;

revoke all privileges on table public.rooms, public.children from anon, authenticated;
grant select on table public.rooms, public.children to authenticated;
grant insert on table public.children to authenticated;

create or replace function public.current_daycare_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.daycare_id
  from public.users u
  where u.id = (select auth.uid())
$$;

revoke execute on function public.current_daycare_id() from PUBLIC, anon;
grant execute on function public.current_daycare_id() to authenticated;

alter policy users_select_own_daycare
  on public.users
  using (
    id = (select auth.uid())
    or daycare_id = (select public.current_daycare_id())
  );

create policy rooms_select_own_daycare
  on public.rooms
  for select
  to authenticated
  using (daycare_id = (select public.current_daycare_id()));

create policy children_select_own_daycare
  on public.children
  for select
  to authenticated
  using (
    room_id in (
      select id
      from public.rooms
      where daycare_id = (select public.current_daycare_id())
    )
  );

create policy children_insert_staff
  on public.children
  for insert
  to authenticated
  with check (
    room_id in (
      select id
      from public.rooms
      where daycare_id = (select public.current_daycare_id())
    )
    and exists (
      select 1
      from public.users u
      where u.id = (select auth.uid())
        and u.role in ('staff', 'admin')
        and u.daycare_id = (select public.current_daycare_id())
    )
  );

create trigger children_set_updated_at
  before update on public.children
  for each row execute function public.set_updated_at();
