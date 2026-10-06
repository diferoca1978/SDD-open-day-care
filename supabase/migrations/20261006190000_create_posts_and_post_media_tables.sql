create type public.post_type as enum (
  'food',
  'nap',
  'activity',
  'achievement',
  'mood',
  'photo',
  'announcement'
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares (id),
  author_id uuid not null references public.users (id),
  type public.post_type not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.post_children (
  post_id uuid not null references public.posts (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  primary key (post_id, child_id)
);

create table public.post_rooms (
  post_id uuid not null references public.posts (id) on delete cascade,
  room_id uuid not null references public.rooms (id) on delete cascade,
  primary key (post_id, room_id)
);

create table public.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  storage_path text not null unique,
  mime_type text not null,
  byte_size integer not null,
  position integer not null,
  created_at timestamptz not null default now(),
  unique (post_id, position)
);

create index posts_daycare_id_idx on public.posts using btree (daycare_id);
create index posts_author_id_idx on public.posts using btree (author_id);
create index posts_created_at_idx on public.posts using btree (created_at);
create index post_children_post_id_idx on public.post_children using btree (post_id);
create index post_children_child_id_idx on public.post_children using btree (child_id);
create index post_rooms_post_id_idx on public.post_rooms using btree (post_id);
create index post_rooms_room_id_idx on public.post_rooms using btree (room_id);
create index post_media_post_id_idx on public.post_media using btree (post_id);

alter table public.posts enable row level security;
alter table public.post_children enable row level security;
alter table public.post_rooms enable row level security;
alter table public.post_media enable row level security;

revoke all privileges on table public.posts, public.post_children, public.post_rooms, public.post_media from anon, authenticated;
grant select, insert on table public.posts, public.post_children, public.post_rooms, public.post_media to authenticated;

create policy posts_select_staff_daycare
  on public.posts
  for select
  to authenticated
  using (
    daycare_id = (select public.current_daycare_id())
    and exists (
      select 1
      from public.users u
      where u.id = (select auth.uid())
        and u.daycare_id = daycare_id
        and u.role in ('staff', 'admin')
    )
  );

create policy posts_select_parent_linked
  on public.posts
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.parent_child pc
      join public.children c on c.id = pc.child_id
      join public.rooms r on r.id = c.room_id
      where pc.user_id = (select auth.uid())
        and c.status = 'active'
        and r.daycare_id = posts.daycare_id
        and (
          exists (
            select 1
            from public.post_children post_child
            where post_child.post_id = posts.id
              and post_child.child_id = c.id
          )
          or exists (
            select 1
            from public.post_rooms post_room
            where post_room.post_id = posts.id
              and post_room.room_id = c.room_id
          )
        )
    )
  );

create policy posts_insert_staff
  on public.posts
  for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and daycare_id = (select public.current_daycare_id())
    and exists (
      select 1
      from public.users u
      where u.id = (select auth.uid())
        and u.daycare_id = daycare_id
        and u.role in ('staff', 'admin')
    )
  );

create policy post_children_select_staff_daycare
  on public.post_children
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.posts p
      join public.users u on u.daycare_id = p.daycare_id
      where p.id = post_children.post_id
        and u.id = (select auth.uid())
        and u.role in ('staff', 'admin')
        and p.daycare_id = (select public.current_daycare_id())
    )
  );

create policy post_children_select_parent_linked
  on public.post_children
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.parent_child pc
      join public.children c on c.id = pc.child_id
      join public.rooms r on r.id = c.room_id
      where pc.user_id = (select auth.uid())
        and post_children.child_id = c.id
        and c.status = 'active'
    )
  );

create policy post_children_insert_staff
  on public.post_children
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.posts p
      join public.users u on u.id = (select auth.uid())
      join public.children c on c.id = post_children.child_id
      join public.rooms r on r.id = c.room_id
      where p.id = post_children.post_id
        and p.daycare_id = (select public.current_daycare_id())
        and r.daycare_id = p.daycare_id
        and u.daycare_id = p.daycare_id
        and u.role in ('staff', 'admin')
    )
  );

create policy post_rooms_select_staff_daycare
  on public.post_rooms
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.posts p
      join public.users u on u.daycare_id = p.daycare_id
      where p.id = post_rooms.post_id
        and u.id = (select auth.uid())
        and u.role in ('staff', 'admin')
        and p.daycare_id = (select public.current_daycare_id())
    )
  );

create policy post_rooms_select_parent_linked
  on public.post_rooms
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.children c
      join public.parent_child pc on pc.child_id = c.id
      where pc.user_id = (select auth.uid())
        and c.status = 'active'
    )
  );

create policy post_rooms_insert_staff
  on public.post_rooms
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.posts p
      join public.rooms r on r.id = post_rooms.room_id
      join public.users u on u.id = (select auth.uid())
      where p.id = post_rooms.post_id
        and p.daycare_id = (select public.current_daycare_id())
        and r.daycare_id = p.daycare_id
        and u.daycare_id = p.daycare_id
        and u.role in ('staff', 'admin')
    )
  );

create policy post_media_select_staff_daycare
  on public.post_media
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.posts p
      join public.users u on u.daycare_id = p.daycare_id
      where p.id = post_media.post_id
        and u.id = (select auth.uid())
        and u.role in ('staff', 'admin')
        and p.daycare_id = (select public.current_daycare_id())
    )
  );

create policy post_media_select_parent_linked
  on public.post_media
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.post_children pc
      join public.parent_child parent_link on parent_link.child_id = pc.child_id
      join public.children c on c.id = pc.child_id
      where pc.post_id = post_media.post_id
        and parent_link.user_id = (select auth.uid())
        and c.status = 'active'
    )
    or exists (
      select 1
      from public.post_rooms pr
      join public.children c on c.room_id = pr.room_id
      join public.parent_child parent_link on parent_link.child_id = c.id
      where pr.post_id = post_media.post_id
        and parent_link.user_id = (select auth.uid())
        and c.status = 'active'
    )
  );

create policy post_media_insert_staff
  on public.post_media
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.posts p
      join public.users u on u.id = (select auth.uid())
      where p.id = post_media.post_id
        and p.daycare_id = (select public.current_daycare_id())
        and u.daycare_id = p.daycare_id
        and u.role in ('staff', 'admin')
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-media', 'post-media', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']::text[]);

create policy post_media_storage_select
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'post-media'
    and exists (
      select 1
      from public.posts p
      where p.id::text = (storage.foldername(name))[2]
    )
  );

create policy post_media_storage_insert_staff
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] = 'posts'
    and exists (
      select 1
      from public.posts p
      join public.users u on u.id = (select auth.uid())
      where p.id::text = (storage.foldername(name))[2]
        and p.daycare_id = (select public.current_daycare_id())
        and u.daycare_id = p.daycare_id
        and u.role in ('staff', 'admin')
    )
  );
