import { CameraIcon } from "@/app/components/icons";
import { FeedPost } from "@/app/components/feed-post";
import { Sidebar } from "@/app/components/sidebar";
import { currentUser, posts, room } from "@/app/data/mock-feed";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-[#F6ECDF]">
      <Sidebar activeItem="feed" />
      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[760px] px-5 pb-24 pt-[34px] sm:px-10 sm:pb-20">
          <header className="mb-6">
            <div className="mb-1 text-[12.5px] font-extrabold tracking-[.8px] text-[#D9583C]">GUARDERÍA · SALA SOLES</div>
            <h1 className="m-0 font-heading text-[30px] font-semibold text-[#3F362E]">Buenas, Caro</h1>
            <p className="mt-[5px] text-[14.5px] text-[#94887B]">{room.childrenCount} niños · martes 17 jun</p>
          </header>

          <a className="mb-6 flex items-center gap-3.5 rounded-[18px] border border-[#ECE0D0] bg-[#FFFDF9] px-[18px] py-3.5 shadow-[0_4px_14px_-10px_rgba(120,90,60,.4)]" href="#">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#F2937A] font-heading text-base font-semibold text-white">{currentUser.initial}</span>
            <span className="flex-1 text-[15px] text-[#A89A8B]">Compartí un momento…</span>
            <span className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-[#FBE3D8] text-[#E0654A]"><CameraIcon size={19} /></span>
          </a>

          <div className="mb-3.5 flex items-center gap-3.5"><span className="text-[12.5px] font-extrabold tracking-[.8px] text-[#8A7C6D]">PUBLICADO HOY</span><span className="h-px flex-1 bg-[#E7DAC8]" /></div>
          <div className="flex flex-col gap-4">
            {posts.map((post) => <FeedPost key={post.id} post={post} />)}
          </div>
        </div>
      </main>
    </div>
  );
}
