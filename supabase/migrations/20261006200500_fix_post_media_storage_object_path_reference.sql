drop policy if exists post_media_storage_select on storage.objects;

create policy post_media_storage_select
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'post-media'
    and (storage.foldername(objects.name))[1] = 'posts'
    and (
      exists (
        select 1
        from public.posts p
        join public.users u on u.id = (select auth.uid())
        where p.id::text = (storage.foldername(objects.name))[2]
          and p.daycare_id = (select public.current_daycare_id())
          and u.daycare_id = p.daycare_id
          and u.role in ('staff', 'admin')
      )
      or exists (
        select 1
        from public.posts p
        join public.post_children post_child on post_child.post_id = p.id
        join public.children c on c.id = post_child.child_id
        join public.rooms r on r.id = c.room_id
        join public.parent_child parent_link on parent_link.child_id = c.id
        where p.id::text = (storage.foldername(objects.name))[2]
          and parent_link.user_id = (select auth.uid())
          and c.status = 'active'
          and r.daycare_id = p.daycare_id
      )
      or exists (
        select 1
        from public.posts p
        join public.post_rooms post_room on post_room.post_id = p.id
        join public.rooms r on r.id = post_room.room_id
        join public.children c on c.room_id = r.id
        join public.parent_child parent_link on parent_link.child_id = c.id
        where p.id::text = (storage.foldername(objects.name))[2]
          and parent_link.user_id = (select auth.uid())
          and c.status = 'active'
          and r.daycare_id = p.daycare_id
      )
    )
  );
