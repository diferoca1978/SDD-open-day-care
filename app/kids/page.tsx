import { PlusIcon } from "@/app/components/icons";
import { KidsList } from "@/app/components/kids-list";
import { Sidebar } from "@/app/components/sidebar";

export default function KidsPage() {
  return (
    <div className="flex min-h-screen bg-[#F6ECDF]">
      <Sidebar activeItem="kids" />
      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[880px] px-5 pb-24 pt-[34px] sm:px-10 sm:pb-20">
          <header className="mb-5.5 flex items-end justify-between gap-4">
            <div>
              <div className="mb-1 text-[12.5px] font-extrabold tracking-[.8px] text-[#D9583C]">GESTIÓN</div>
              <h1 className="m-0 font-heading text-[30px] font-semibold text-[#3F362E]">Niños</h1>
            </div>
            <a className="flex items-center gap-2 rounded-[14px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] px-[18px] py-[11px] text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.7)]" href="#">
              <PlusIcon size={17} />
              Agregar niño
            </a>
          </header>
          <KidsList />
        </div>
      </main>
    </div>
  );
}
