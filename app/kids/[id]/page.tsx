import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LinkParentDialog } from "@/app/components/link-parent-dialog";
import { AlertIcon, ChevronLeftIcon, SunIcon } from "@/app/components/icons";
import { Sidebar } from "@/app/components/sidebar";
import { buildViewChild } from "@/app/utils/child-view";
import { requireUser } from "@/utils/supabase/require-user";
import { createClient } from "@/utils/supabase/server";

export default async function KidProfilePage({ params }: PageProps<"/kids/[id]">) {
  await requireUser();

  const { id } = await params;
  const supabase = createClient(await cookies());
  const { data: childRows, error: childError } = await supabase
    .from("children")
    .select(
      "id, room_id, full_name, birth_date, enrolled_at, medical_notes, allergy_tags",
    )
    .eq("id", id)
    .eq("status", "active")
    .limit(1);

  if (childError) {
    throw childError;
  }

  const child = childRows?.[0];
  if (!child) {
    notFound();
  }

  const { data: roomRows, error: roomError } = await supabase
    .from("rooms")
    .select("id, name")
    .eq("id", child.room_id)
    .limit(1);

  if (roomError) {
    throw roomError;
  }

  const room = roomRows?.[0];
  if (!room) {
    notFound();
  }

  const kid = buildViewChild(
    {
      id: child.id,
      room_id: child.room_id,
      full_name: child.full_name,
      birth_date: child.birth_date,
      enrolled_at: child.enrolled_at,
      allergy_tags: child.allergy_tags,
    },
    room.name,
  );
  const medicalNotes =
    typeof child.medical_notes === "string" ? child.medical_notes.trim() : "";

  const dataRows = [
    { label: "Fecha de nacimiento", value: kid.birthDateLabel },
    { label: "Sala", value: kid.roomName },
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
                  {kid.fullName.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <h1 className="m-0 font-heading text-[28px] font-semibold leading-[normal] text-[#3F362E]">{kid.fullName}</h1>
                  <p className="mt-[3px] text-[15px] text-[#94887B]">{kid.ageLabel} · Sala {kid.roomName}</p>
                </div>
                <a className="flex-none rounded-[12px] border-[1.5px] border-[#ECE0D0] bg-[#FFFDF9] px-4 py-[9px] text-sm font-bold text-[#6E6359]" href="#">Editar</a>
              </div>
              {(medicalNotes || kid.allergyLabels.length > 0) && (
                <div className="flex gap-3.5 rounded-2xl bg-[#FBDAD6] px-[18px] py-4">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[11px] bg-[#F4A8A0] text-white">
                    <AlertIcon size={22} />
                  </span>
                  <div>
                    <div className="mb-0.5 text-[15px] font-extrabold text-[#C5413A]">Alergias y notas</div>
                    {medicalNotes ? (
                      <p className="m-0 text-[14.5px] leading-[1.5] text-[#B25249]">{medicalNotes}</p>
                    ) : (
                      <p className="m-0 text-[14.5px] leading-[1.5] text-[#B25249]">
                        Alergias: {kid.allergyLabels.join(", ")}
                      </p>
                    )}
                    {medicalNotes && kid.allergyLabels.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {kid.allergyLabels.map((allergy) => (
                          <span
                            className="rounded-full bg-[#F4A8A0] px-[9px] py-[5px] text-[11px] font-extrabold text-[#9E3D37]"
                            key={allergy}
                          >
                            {allergy}
                          </span>
                        ))}
                      </div>
                    )}
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
                  <LinkParentDialog kidName={kid.fullName} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
