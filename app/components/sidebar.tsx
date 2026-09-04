import { currentUser } from "@/app/data/mock-feed";
import { BellIcon, HomeIcon, LogoutIcon, PeopleIcon, PlusIcon, SunIcon, UserIcon } from "@/app/components/icons";

const navItems = [
  { label: "Feed", icon: HomeIcon },
  { label: "Niños", icon: PeopleIcon },
  { label: "Avisos", icon: BellIcon },
  { label: "Mi cuenta", icon: UserIcon },
];

function Navigation({ mobile = false }: { mobile?: boolean }) {
  return (
    <nav className={mobile ? "flex w-full items-center justify-around" : "flex flex-1 flex-col gap-1"}>
      {navItems.map(({ label, icon: ItemIcon }, index) => (
        <a
          aria-current={index === 0 ? "page" : undefined}
          className={mobile
            ? `flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-700 ${index === 0 ? "text-[#D9583C]" : "text-[#8A7C6D]"}`
            : `flex items-center gap-3 rounded-xl px-3 py-[11px] text-[14.5px] ${index === 0 ? "bg-[#FBE3D8] font-800 text-[#D9583C]" : "font-600 text-[#6E6359]"}`}
          href="#"
          key={label}
        >
          <ItemIcon size={mobile ? 20 : 19} />
          <span>{label}</span>
        </a>
      ))}
    </nav>
  );
}

export function Sidebar() {
  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-[248px] flex-none flex-col border-r border-[#ECE0D0] bg-[#FFFDF9] px-4 py-6 md:flex">
        <a className="flex items-center gap-[11px] px-2 pb-[22px]" href="#">
          <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl bg-gradient-to-br from-[#F8C3A8] to-[#F2937A] text-white">
            <SunIcon size={21} />
          </span>
          <span>
            <span className="block font-heading text-[17px] font-600 leading-none text-[#3F362E]">OpenDayCare</span>
            <span className="mt-0.5 block text-[11.5px] text-[#A89A8B]">Sala Soles</span>
          </span>
        </a>
        <a className="mb-[18px] flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] px-3 py-3 text-[14.5px] font-800 text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.75)]" href="#">
          <PlusIcon size={17} />
          Nueva publicación
        </a>
        <Navigation />
        <div className="mt-[10px] border-t border-[#ECE0D0] pt-[14px]">
          <div className="flex items-center gap-[11px] px-2 py-1.5">
            <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-[#F2937A] font-heading text-base font-600 text-white">{currentUser.initial}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-800 text-[#3F362E]">{currentUser.name}</span>
              <span className="block text-xs text-[#A89A8B]">{currentUser.role} · {currentUser.room}</span>
            </span>
            <a aria-label="Cerrar sesión" className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-[#F6ECDF] text-[#94887B]" href="#"><LogoutIcon size={16} /></a>
          </div>
        </div>
      </aside>
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#ECE0D0] bg-[#FFFDF9]/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-4px_16px_-12px_rgba(120,90,60,.5)] backdrop-blur md:hidden">
        <Navigation mobile />
      </div>
    </>
  );
}
