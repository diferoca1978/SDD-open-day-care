import { CommentIcon, HeartIcon, ImageIcon, MegaphoneIcon } from "@/app/components/icons";
import type { FeedPost } from "@/app/data/mock-feed";

const styles = {
  achievement: { avatar: "bg-[#A9D9E8] text-[#1F7A93]", badge: "bg-[#CFEBD8] text-[#3E9B6C]", dot: "bg-[#3E9B6C]", label: "LOGRO" },
  activity: { avatar: "bg-[#A9D9E8] text-[#1F7A93]", badge: "bg-[#C7E7F1] text-[#2E89A6]", dot: "bg-[#2E89A6]", label: "ACTIVIDAD" },
  announcement: { avatar: "bg-[#CCD8F4] text-[#4E72C8]", badge: "bg-[#CCD8F4] text-[#4E72C8]", dot: "bg-[#4E72C8]", label: "ANUNCIO" },
} as const;

export function FeedPost({ post }: { post: FeedPost }) {
  const style = styles[post.kind];
  const isAnnouncement = post.kind === "announcement";

  return (
    <article className="rounded-[20px] border border-[#ECE0D0] bg-[#FFFDF9] px-[22px] py-5 shadow-[0_4px_16px_-12px_rgba(120,90,60,.5)]">
      <header className="mb-[14px] flex items-center gap-3">
        <span className={`flex h-11 w-11 flex-none items-center justify-center rounded-full font-heading text-[17px] font-600 ${style.avatar}`}>
          {isAnnouncement ? <MegaphoneIcon size={20} /> : post.childName?.[0]}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-heading text-[16.5px] font-600 text-[#3F362E]">{isAnnouncement ? "Anuncio general" : post.childName}</span>
          <span className="block text-[12.5px] text-[#A89A8B]">{post.time} · publicado por {post.publishedBy}</span>
        </span>
        <span className={`flex items-center gap-[7px] rounded-full px-3 py-1.5 text-[12px] font-800 tracking-[.5px] ${style.badge}`}>
          <span className={`h-2 w-2 rounded-full ${style.dot}`} />
          {style.label}
        </span>
      </header>
      <p className="mb-2.5 text-[12.5px] text-[#A89A8B]">Para: {post.audience}</p>
      <p className="m-0 text-[15.5px] leading-[1.55] text-[#4A4038]">{post.body}</p>
      {post.photoCaption && (
        <div className="mt-3.5 flex h-[200px] flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-[#DBCDBA] bg-[#F4ECE1] text-[#B0A290]">
          <ImageIcon size={30} />
          <span className="text-[13.5px]">Foto · {post.photoCaption}</span>
        </div>
      )}
      <footer className="mt-4 flex items-center gap-[18px] border-t border-[#F0E6D8] pt-3.5">
        <span className="flex items-center gap-[7px] text-sm font-700 text-[#E0654A]"><HeartIcon filled size={19} />{post.hearts}</span>
        <span className="flex items-center gap-[7px] text-sm font-700 text-[#94887B]"><CommentIcon size={18} />{post.comments}</span>
        <span className="flex-1" />
        <a className="text-sm font-800 text-[#C5503A]" href="#">Editar</a>
      </footer>
    </article>
  );
}
