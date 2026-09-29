import { cookies } from "next/headers";
import { KidsList } from "@/app/components/kids-list";
import { Sidebar } from "@/app/components/sidebar";
import { AddKidDialog } from "@/app/components/add-kid-dialog";
import {
  buildViewChild,
  type RoomOption,
  type ViewChild,
} from "@/app/utils/child-view";
import { requireUser } from "@/utils/supabase/require-user";
import { createClient } from "@/utils/supabase/server";

export default async function KidsPage() {
  await requireUser();
  const supabase = createClient(await cookies());
  const [roomsResult, childrenResult] = await Promise.all([
    supabase
      .from("rooms")
      .select("id, name")
      .order("created_at", { ascending: true }),
    supabase
      .from("children")
      .select("id, room_id, full_name, birth_date, enrolled_at, allergy_tags")
      .eq("status", "active"),
  ]);

  if (roomsResult.error) {
    throw roomsResult.error;
  }
  if (childrenResult.error) {
    throw childrenResult.error;
  }

  const rooms: RoomOption[] = (roomsResult.data ?? []).map((room) => ({
    id: room.id,
    name: room.name,
  }));
  const roomNames = new Map(rooms.map((room) => [room.id, room.name] as const));
  const viewChildren: ViewChild[] = (childrenResult.data ?? [])
    .map((row) => {
      const roomName = roomNames.get(row.room_id);
      if (roomName === undefined) {
        throw new Error("A child row references a room outside the visible daycare.");
      }

      return buildViewChild(row, roomName);
    })
    .sort((left, right) => left.fullName.localeCompare(right.fullName, "es"));

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
            <AddKidDialog rooms={rooms} />
          </header>
          <KidsList rooms={rooms} kids={viewChildren} />
        </div>
      </main>
    </div>
  );
}
