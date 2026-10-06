import { CommentIcon, HeartIcon, ImageIcon, MegaphoneIcon } from "@/app/components/icons";
import type { FeedPost } from "@/app/data/mock-feed";
import type { RealFeedPost } from "@/app/utils/post-view";
import Image from "next/image";

const styles: Record<string, { avatar: string; badge: string; dot: string; label: string }> = {
  food: { avatar: "bg-[#F4DC8E] text-[#9A7B1E]", badge: "bg-[#F4DC8E] text-[#9A7B1E]", dot: "bg-[#9A7B1E]", label: "COMIDA" },
  nap: { avatar: "bg-[#E7DCF6] text-[#7B5FC0]", badge: "bg-[#E7DCF6] text-[#7B5FC0]", dot: "bg-[#7B5FC0]", label: "SIESTA" },
  achievement: { avatar: "bg-[#A9D9E8] text-[#1F7A93]", badge: "bg-[#CFEBD8] text-[#3E9B6C]", dot: "bg-[#3E9B6C]", label: "LOGRO" },
  activity: { avatar: "bg-[#A9D9E8] text-[#1F7A93]", badge: "bg-[#C7E7F1] text-[#2E89A6]", dot: "bg-[#2E89A6]", label: "ACTIVIDAD" },
  mood: { avatar: "bg-[#F9D2DE] text-[#C56486]", badge: "bg-[#F9D2DE] text-[#C56486]", dot: "bg-[#C56486]", label: "ÁNIMO" },
  photo: { avatar: "bg-[#FBD8CC] text-[#D9684A]", badge: "bg-[#FBD8CC] text-[#D9684A]", dot: "bg-[#D9684A]", label: "FOTO" },
  announcement: { avatar: "bg-[#CCD8F4] text-[#4E72C8]", badge: "bg-[#CCD8F4] text-[#4E72C8]", dot: "bg-[#4E72C8]", label: "ANUNCIO" },
};

export function FeedPost({ post }: { post: FeedPost | RealFeedPost }) {
  const style = styles[post.kind] ?? styles.activity;
  const isRealPost = "authorName" in post;
  const isAnnouncement = post.kind === "announcement" && !isRealPost;

  return (
    <article className="rounded-[20px] border border-[#ECE0D0] bg-[#FFFDF9] px-[22px] py-5 shadow-[0_4px_16px_-12px_rgba(120,90,60,.5)]">
      <header className="mb-[14px] flex items-center gap-3">
        <span className={`flex h-11 w-11 flex-none items-center justify-center rounded-full font-heading text-[17px] font-semibold ${style.avatar}`}>
          {isAnnouncement ? <MegaphoneIcon size={20} /> : isRealPost ? post.authorName.charAt(0).toUpperCase() : post.childName?.[0]}
        </span>
        <span className="min-w-0 flex-1">
           <span className="block font-heading text-[16.5px] font-semibold text-[#3F362E]">{isAnnouncement ? "Anuncio general" : isRealPost ? post.authorName : post.childName}</span>
           <span className="block text-[12.5px] text-[#A89A8B]">{post.time} · {isRealPost ? post.authorRole : "publicado por vos"}</span>
        </span>
        <span className={`flex items-center gap-[7px] rounded-full px-3 py-1.5 text-[12px] font-extrabold tracking-[.5px] ${style.badge}`}>
          <span className={`h-2 w-2 rounded-full ${style.dot}`} />
          {style.label}
        </span>
      </header>
      <p className="mb-2.5 text-[12.5px] text-[#A89A8B]">Para: {post.audience}</p>
      <p className="m-0 text-[15.5px] leading-[1.55] text-[#4A4038]">{post.body}</p>
      {isRealPost && post.media.length > 0 ? (
        <div className={`mt-3.5 grid gap-2 ${post.media.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {post.media.map((media) => <Image alt="Imagen de la publicación" className="max-h-[280px] w-full rounded-2xl object-cover" height={400} key={media.id} src={media.url} unoptimized width={600} />)}
        </div>
      ) : !isRealPost && post.photoCaption ? (
        <div className="mt-3.5 flex h-[200px] flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-[#DBCDBA] bg-[#F4ECE1] text-[#B0A290]">
          <ImageIcon size={30} />
          <span className="text-[13.5px]">Foto · {post.photoCaption}</span>
        </div>
       ) : null}
      {!isRealPost && <footer className="mt-4 flex items-center gap-[18px] border-t border-[#F0E6D8] pt-3.5">
        <span className="flex items-center gap-[7px] text-sm font-bold text-[#E0654A]"><HeartIcon filled size={19} />{post.hearts}</span>
        <span className="flex items-center gap-[7px] text-sm font-bold text-[#94887B]"><CommentIcon size={18} />{post.comments}</span>
        <span className="flex-1" />
        <a className="text-sm font-extrabold text-[#C5503A]" href="#">Editar</a>
      </footer>}
    </article>
  );
}
