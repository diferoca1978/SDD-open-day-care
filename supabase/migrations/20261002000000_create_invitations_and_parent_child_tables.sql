create type public.invitation_status as enum ('pending', 'accepted', 'expired');

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares (id),
  child_id uuid not null references public.children (id),
  parent_email text not null,
  parent_name text not null,
  parent_role text not null,
  code text not null,
  expires_at timestamptz not null,
  status public.invitation_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.parent_child (
  user_id uuid not null references public.users (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, child_id)
);

create unique index invitations_code_idx on public.invitations (code);
create index invitations_daycare_id_idx on public.invitations (daycare_id);
create index invitations_child_id_idx on public.invitations (child_id);
create index invitations_parent_email_idx on public.invitations (parent_email);
create index parent_child_user_id_idx on public.parent_child (user_id);
create index parent_child_child_id_idx on public.parent_child (child_id);

alter table public.invitations enable row level security;
alter table public.parent_child enable row level security;

create or replace function public.generate_invitation_code()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  chars text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text := '';
  i int;
begin
  for i in 1..5 loop
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return code;
end;
$$;

revoke execute on function public.generate_invitation_code() from public, anon;
grant execute on function public.generate_invitation_code() to authenticated;

create policy invitations_select_own_daycare
  on public.invitations
  for select
  to authenticated
  using (daycare_id = (select public.current_daycare_id()));

create policy invitations_insert_staff
  on public.invitations
  for insert
  to authenticated
  with check (
    daycare_id = (select public.current_daycare_id())
    and exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.role in ('staff', 'admin')
        and u.daycare_id = (select public.current_daycare_id())
    )
  );

create policy invitations_update_own_daycare
  on public.invitations
  for update
  to authenticated
  using (
    daycare_id = (select public.current_daycare_id())
    and exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.role in ('staff', 'admin')
        and u.daycare_id = (select public.current_daycare_id())
    )
  )
  with check (
    daycare_id = (select public.current_daycare_id())
  );

create policy parent_child_select_own_daycare
  on public.parent_child
  for select
  to authenticated
  using (
    child_id in (
      select c.id from public.children c
      join public.rooms r on r.id = c.room_id
      where r.daycare_id = (select public.current_daycare_id())
    )
  );

create policy parent_child_insert_staff
  on public.parent_child
  for insert
  to authenticated
  with check (
    child_id in (
      select c.id from public.children c
      join public.rooms r on r.id = c.room_id
      where r.daycare_id = (select public.current_daycare_id())
    )
    and exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.role in ('staff', 'admin')
        and u.daycare_id = (select public.current_daycare_id())
    )
  );

create policy parent_child_insert_self
  on public.parent_child
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.invitations inv
      where inv.child_id = child_id
        and inv.parent_email = (select email from auth.users where id = auth.uid())
        and inv.status = 'pending'
        and inv.expires_at > now()
    )
  );
