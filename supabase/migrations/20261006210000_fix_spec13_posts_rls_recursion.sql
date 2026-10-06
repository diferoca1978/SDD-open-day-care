create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create or replace function private.is_staff_for_daycare(p_daycare_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.users u
      where u.id = (select auth.uid())
        and u.daycare_id = p_daycare_id
        and u.role in ('staff'::public.user_role, 'admin'::public.user_role)
        and u.status = 'active'::public.user_status
    )
$$;

create or replace function private.can_view_post(p_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.posts p
    where p.id = p_post_id
      and (
        private.is_staff_for_daycare(p.daycare_id)
        or exists (
          select 1
          from public.post_children pc
          join public.children c on c.id = pc.child_id
          join public.rooms r on r.id = c.room_id
          join public.parent_child link on link.child_id = c.id
          where pc.post_id = p.id
            and link.user_id = (select auth.uid())
            and c.status = 'active'::public.child_status
            and r.daycare_id = p.daycare_id
        )
        or exists (
          select 1
          from public.post_rooms pr
          join public.rooms r on r.id = pr.room_id
          join public.children c on c.room_id = r.id
          join public.parent_child link on link.child_id = c.id
          where pr.post_id = p.id
            and link.user_id = (select auth.uid())
            and c.status = 'active'::public.child_status
            and r.daycare_id = p.daycare_id
        )
      )
  )
$$;

create or replace function private.can_view_post_child(p_post_id uuid, p_child_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.posts p
    join public.children c on c.id = p_child_id
    join public.rooms r on r.id = c.room_id
    where p.id = p_post_id
      and r.daycare_id = p.daycare_id
      and (
        private.is_staff_for_daycare(p.daycare_id)
        or exists (
          select 1 from public.post_children pc
          join public.parent_child link on link.child_id = pc.child_id
          where pc.post_id = p.id
            and pc.child_id = p_child_id
            and link.user_id = (select auth.uid())
            and c.status = 'active'::public.child_status
        )
      )
  )
$$;

create or replace function private.can_view_post_room(p_post_id uuid, p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.posts p
    join public.rooms r on r.id = p_room_id
    where p.id = p_post_id
      and r.daycare_id = p.daycare_id
      and (
        private.is_staff_for_daycare(p.daycare_id)
        or exists (
          select 1
          from public.post_rooms pr
          join public.children c on c.room_id = pr.room_id
          join public.parent_child link on link.child_id = c.id
          where pr.post_id = p.id
            and pr.room_id = p_room_id
            and link.user_id = (select auth.uid())
            and c.status = 'active'::public.child_status
        )
      )
  )
$$;

create or replace function private.can_create_post(p_daycare_id uuid, p_author_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_author_id = (select auth.uid()) and private.is_staff_for_daycare(p_daycare_id)
$$;

create or replace function private.can_add_post_child(p_post_id uuid, p_child_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.posts p
    join public.children c on c.id = p_child_id
    join public.rooms r on r.id = c.room_id
    where p.id = p_post_id
      and r.daycare_id = p.daycare_id
      and private.is_staff_for_daycare(p.daycare_id)
  )
$$;

create or replace function private.can_add_post_room(p_post_id uuid, p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.posts p
    join public.rooms r on r.id = p_room_id
    where p.id = p_post_id
      and r.daycare_id = p.daycare_id
      and private.is_staff_for_daycare(p.daycare_id)
  )
$$;

create or replace function private.can_add_post_media(p_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.posts p
    where p.id = p_post_id
      and private.is_staff_for_daycare(p.daycare_id)
  )
$$;

do $$
declare f record;
begin
  for f in select oid::regprocedure as fn from pg_proc where pronamespace = 'private'::regnamespace and proname in ('is_staff_for_daycare','can_view_post','can_view_post_child','can_view_post_room','can_create_post','can_add_post_child','can_add_post_room','can_add_post_media') loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.fn);
    execute format('grant execute on function %s to authenticated', f.fn);
  end loop;
end $$;

drop policy if exists posts_select_staff_daycare on public.posts;
drop policy if exists posts_select_parent_linked on public.posts;
drop policy if exists posts_insert_staff on public.posts;
drop policy if exists post_children_select_staff_daycare on public.post_children;
drop policy if exists post_children_select_parent_linked on public.post_children;
drop policy if exists post_children_insert_staff on public.post_children;
drop policy if exists post_rooms_select_staff_daycare on public.post_rooms;
drop policy if exists post_rooms_select_parent_linked on public.post_rooms;
drop policy if exists post_rooms_insert_staff on public.post_rooms;
drop policy if exists post_media_select_staff_daycare on public.post_media;
drop policy if exists post_media_select_parent_linked on public.post_media;
drop policy if exists post_media_insert_staff on public.post_media;
drop policy if exists post_media_storage_select on storage.objects;
drop policy if exists post_media_storage_insert_staff on storage.objects;

create policy posts_select_staff_daycare on public.posts for select to authenticated using ((select private.is_staff_for_daycare(daycare_id)));
create policy posts_select_parent_linked on public.posts for select to authenticated using ((select private.can_view_post(id)));
create policy posts_insert_staff on public.posts for insert to authenticated with check ((select private.can_create_post(daycare_id, author_id)));

create policy post_children_select_staff_daycare on public.post_children for select to authenticated using ((select private.can_view_post(post_id)));
create policy post_children_select_parent_linked on public.post_children for select to authenticated using ((select private.can_view_post_child(post_id, child_id)));
create policy post_children_insert_staff on public.post_children for insert to authenticated with check ((select private.can_add_post_child(post_id, child_id)));

create policy post_rooms_select_staff_daycare on public.post_rooms for select to authenticated using ((select private.can_view_post(post_id)));
create policy post_rooms_select_parent_linked on public.post_rooms for select to authenticated using ((select private.can_view_post_room(post_id, room_id)));
create policy post_rooms_insert_staff on public.post_rooms for insert to authenticated with check ((select private.can_add_post_room(post_id, room_id)));

create policy post_media_select_staff_daycare on public.post_media for select to authenticated using ((select private.can_view_post(post_id)));
create policy post_media_select_parent_linked on public.post_media for select to authenticated using ((select private.can_view_post(post_id)));
create policy post_media_insert_staff on public.post_media for insert to authenticated with check ((select private.can_add_post_media(post_id)));

create policy post_media_storage_select on storage.objects for select to authenticated using (
  bucket_id = 'post-media'
  and (storage.foldername(objects.name))[1] = 'posts'
  and (select private.can_view_post(((storage.foldername(objects.name))[2])::uuid))
);
create policy post_media_storage_insert_staff on storage.objects for insert to authenticated with check (
  bucket_id = 'post-media'
  and (storage.foldername(name))[1] = 'posts'
  and (select private.can_add_post_media(((storage.foldername(name))[2])::uuid))
);
