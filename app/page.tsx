import { CameraIcon } from "@/app/components/icons";
import { FeedPost } from "@/app/components/feed-post";
import { Sidebar } from "@/app/components/sidebar";
import { posts, room } from "@/app/data/mock-feed";
import {
  buildRealFeedPosts,
  type PostAuthorRow,
  type PostChildRecipientRow,
  type PostMediaRow,
  type PostRoomRecipientRow,
  type PostRow,
} from "@/app/utils/post-view";
import { requireUser } from "@/utils/supabase/require-user";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export default async function Home() {
  const claims = await requireUser();
  const supabase = createClient(await cookies());

  // Get user profile from database
  const { data: profile } = await supabase
    .from("users")
    .select("full_name, role")
    .eq("id", claims.sub)
    .single();

  const displayName = profile?.full_name || "Usuario";
  const { data: postRows, error: postsError } = await supabase
    .from("posts")
    .select("id, daycare_id, author_id, type, body, created_at")
    .order("created_at", { ascending: false });
  if (postsError) throw postsError;

  const rows = (postRows ?? []) as PostRow[];
  const postIds = rows.map((post) => post.id);
  const authorIds = [...new Set(rows.map((post) => post.author_id))];
  const [authorsResult, childRecipientsResult, roomRecipientsResult, mediaResult] = await Promise.all([
    authorIds.length > 0
      ? supabase.from("users").select("id, full_name, role").in("id", authorIds)
      : Promise.resolve({ data: [], error: null }),
    postIds.length > 0
      ? supabase.from("post_children").select("post_id, child_id, children(full_name)").in("post_id", postIds)
      : Promise.resolve({ data: [], error: null }),
    postIds.length > 0
      ? supabase.from("post_rooms").select("post_id, room_id, rooms(name)").in("post_id", postIds)
      : Promise.resolve({ data: [], error: null }),
    postIds.length > 0
      ? supabase.from("post_media").select("id, post_id, storage_path, mime_type, byte_size, position").in("post_id", postIds).order("position", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (authorsResult.error) throw authorsResult.error;
  if (childRecipientsResult.error) throw childRecipientsResult.error;
  if (roomRecipientsResult.error) throw roomRecipientsResult.error;
  if (mediaResult.error) throw mediaResult.error;

  const authors = new Map((authorsResult.data as PostAuthorRow[]).map((author) => [author.id, author]));
  const childRecipients = (childRecipientsResult.data as Array<PostChildRecipientRow & { post_id: string; children?: PostChildRecipientRow["child"] | PostChildRecipientRow["child"][] }>).map((item) => ({
    post_id: item.post_id,
    child_id: item.child_id,
    child: Array.isArray(item.children) ? item.children[0] : item.children ?? item.child,
  })).filter((item): item is PostChildRecipientRow & { post_id: string } => Boolean(item.child));
  const roomRecipients = (roomRecipientsResult.data as Array<PostRoomRecipientRow & { post_id: string; rooms?: PostRoomRecipientRow["room"] | PostRoomRecipientRow["room"][] }>).map((item) => ({
    post_id: item.post_id,
    room_id: item.room_id,
    room: Array.isArray(item.rooms) ? item.rooms[0] : item.rooms ?? item.room,
  })).filter((item): item is PostRoomRecipientRow & { post_id: string } => Boolean(item.room));
  const media = mediaResult.data as Array<PostMediaRow & { post_id: string }>;
  const mediaPaths = media.map((item) => item.storage_path);
  const { data: signedMedia, error: signedMediaError } = mediaPaths.length > 0
    ? await supabase.storage.from("post-media").createSignedUrls(mediaPaths, 60 * 60)
    : { data: [], error: null };
  if (signedMediaError) throw signedMediaError;

  const signedUrls = Object.fromEntries((signedMedia ?? []).map((item) => [item.path, item.signedUrl]));
  const realPosts = buildRealFeedPosts(rows.flatMap((post) => {
    const author = authors.get(post.author_id);
    if (!author) return [];
    return [{
      post,
      author,
      childRecipients: childRecipients.filter((item) => item.post_id === post.id),
      roomRecipients: roomRecipients.filter((item) => item.post_id === post.id),
      media: media.filter((item) => item.post_id === post.id),
    }];
  }), signedUrls);

  return (
    <div className="flex min-h-screen bg-[#F6ECDF]">
      <Sidebar activeItem="feed" newPostEnabled />
      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[760px] px-5 pb-24 pt-[34px] sm:px-10 sm:pb-20">
          <header className="mb-6">
            <div className="mb-1 text-[12.5px] font-extrabold tracking-[.8px] text-[#D9583C]">GUARDERÍA · SALA SOLES</div>
            <h1 className="m-0 font-heading text-[30px] font-semibold text-[#3F362E]">Buenas, {displayName}</h1>
            <p className="mt-[5px] text-[14.5px] text-[#94887B]">{room.childrenCount} niños · martes 17 jun</p>
          </header>

          <button className="mb-6 flex w-full items-center gap-3.5 rounded-[18px] border border-[#ECE0D0] bg-[#FFFDF9] px-[18px] py-3.5 text-left shadow-[0_4px_14px_-10px_rgba(120,90,60,.4)]" type="button">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#F2937A] font-heading text-base font-semibold text-white">{displayName.charAt(0).toUpperCase()}</span>
            <span className="flex-1 text-[15px] text-[#A89A8B]">Compartí un momento…</span>
            <span className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-[#FBE3D8] text-[#E0654A]"><CameraIcon size={19} /></span>
          </button>

          <div className="mb-3.5 flex items-center gap-3.5"><span className="text-[12.5px] font-extrabold tracking-[.8px] text-[#8A7C6D]">PUBLICADO HOY</span><span className="h-px flex-1 bg-[#E7DAC8]" /></div>
          <div className="flex flex-col gap-4">
            {realPosts.map((post) => <FeedPost key={post.id} post={post} />)}
            {posts.map((post) => <FeedPost key={post.id} post={post} />)}
          </div>
        </div>
      </main>
    </div>
  );
}
