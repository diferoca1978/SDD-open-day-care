import { notFound } from "next/navigation";
import Link from "next/link";
import { AlertIcon, ChevronLeftIcon, PlusIcon, SunIcon } from "@/app/components/icons";
import { Sidebar } from "@/app/components/sidebar";
import { kids } from "@/app/data/mock-kids";
import type { ParentStatus } from "@/app/data/mock-kids";

const parentStatus: Record<ParentStatus, { chip: string; label: string; note: string }> = {
  active: { chip: "bg-[#CFEBD8] text-[#3E9B6C]", label: "ACTIVA", note: "activa" },
  pending: { chip: "bg-[#F7E7A6] text-[#9A7B1E]", label: "PENDIENTE", note: "invitación enviada" },
};

export default async function KidProfilePage({ params }: PageProps<"/kids/[id]">) {
  const { id } = await params;
  const kid = kids.find((kid) => kid.id === id);

  if (!kid) {
    notFound();
  }

  const dataRows = [
    { label: "Fecha de nacimiento", value: kid.birthDateLabel },
    { label: "Sala", value: kid.room },
    { label: "Ingreso", value: kid.entryLabel },
  ];

  return (
    <div className="flex min-h-screen bg-[#F6ECDF]">
      <Sidebar activeItem="kids" />
      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[820px] px-5 pb-24 pt-[34px] sm:px-10 sm:pb-20">
          <Link className="mb-5 flex items-center gap-[7px] text-sm font-bold text-[#94887B]" href="/kids">
            <ChevronLeftIcon size={18} />
            Volver a Niños
          </Link>
          <div className="flex flex-wrap items-start gap-[26px]">
            <div className="flex min-w-0 flex-1 flex-col gap-[18px] md:min-w-[300px]">
              <div className="flex items-center gap-[18px]">
                <span
                  className="flex h-[84px] w-[84px] flex-none items-center justify-center rounded-full font-heading text-[34px] font-semibold"
                  style={{ backgroundColor: kid.avatarColor, color: kid.avatarTextColor }}
                >
                  {kid.name.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <h1 className="m-0 font-heading text-[28px] font-semibold leading-[normal] text-[#3F362E]">{kid.name}</h1>
                  <p className="mt-[3px] text-[15px] text-[#94887B]">{kid.ageLabel} · Sala {kid.room}</p>
                </div>
                <a className="flex-none rounded-[12px] border-[1.5px] border-[#ECE0D0] bg-[#FFFDF9] px-4 py-[9px] text-sm font-bold text-[#6E6359]" href="#">Editar</a>
              </div>
              {kid.allergyNotes && (
                <div className="flex gap-3.5 rounded-2xl bg-[#FBDAD6] px-[18px] py-4">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[11px] bg-[#F4A8A0] text-white">
                    <AlertIcon size={22} />
                  </span>
                  <div>
                    <div className="mb-0.5 text-[15px] font-extrabold text-[#C5413A]">Alergias y notas</div>
                    <p className="m-0 text-[14.5px] leading-[1.5] text-[#B25249]">{kid.allergyNotes}</p>
                  </div>
                </div>
              )}
              <div className="overflow-hidden rounded-2xl border border-[#ECE0D0] bg-[#FFFDF9]">
                {dataRows.map((row, index) => (
                  <div
                    className={`flex justify-between px-[18px] py-[15px] ${index < dataRows.length - 1 ? "border-b border-[#F0E6D8]" : ""}`}
                    key={row.label}
                  >
                    <span className="text-[14.5px] text-[#94887B]">{row.label}</span>
                    <span className="text-[14.5px] font-extrabold text-[#3F362E]">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex w-full flex-none flex-col gap-3.5 md:w-[300px]">
              <a className="flex w-full items-center justify-center gap-[9px] rounded-[14px] bg-[#3F362E] py-[13px] text-[15px] font-extrabold text-white" href="#">
                <SunIcon size={18} />
                Resumen del día
              </a>
              <div className="rounded-2xl border border-[#ECE0D0] bg-[#FFFDF9] px-[18px] py-4">
                <div className="mb-3.5 text-[12.5px] font-extrabold tracking-[.8px] text-[#8A7C6D]">PADRES VINCULADOS</div>
                <div className="flex flex-col gap-3.5">
                  {kid.parents.map((parent) => {
                    const status = parentStatus[parent.status];
                    return (
                      <div className="flex items-center gap-3" key={parent.name}>
                        <span
                          className="flex h-10 w-10 flex-none items-center justify-center rounded-full font-heading text-base font-semibold text-white"
                          style={{ backgroundColor: parent.avatarColor }}
                        >
                          {parent.name.charAt(0)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[14.5px] font-extrabold text-[#3F362E]">{parent.name}</span>
                          <span className="block text-[12.5px] text-[#A89A8B]">{parent.role} · {status.note}</span>
                        </span>
                        <span className={`flex-none rounded-full px-[9px] py-1 text-[10.5px] font-extrabold ${status.chip}`}>{status.label}</span>
                      </div>
                    );
                  })}
                  <a className="flex items-center gap-3 pt-2" href="#">
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-[#D8CBBA] text-[#B0A290]">
                      <PlusIcon size={18} />
                    </span>
                    <span className="text-[14.5px] font-extrabold text-[#C5503A]">Vincular otro padre</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
