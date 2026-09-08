import Link from "next/link";
import { ChevronRightIcon } from "@/app/components/icons";
import type { Kid } from "@/app/data/mock-kids";

const chip = "flex-none rounded-full px-[9px] py-[5px] text-[11px] font-extrabold";

export function KidCard({ kid }: { kid: Kid }) {
  const parentCount = kid.parents.length;
  const parentLabel =
    parentCount === 0
      ? "sin padres vinculados"
      : `${parentCount} ${parentCount === 1 ? "padre" : "padres"} vinculado${parentCount === 1 ? "" : "s"}`;

  return (
    <Link
      className="flex min-w-0 items-center gap-3.5 rounded-[18px] border border-[#ECE0D0] bg-[#FFFDF9] p-4 shadow-[0_4px_14px_-12px_rgba(120,90,60,.5)] transition duration-150 hover:-translate-y-0.5 hover:border-[#F2A78E]"
      href={`/kids/${kid.id}`}
    >
      <span
        className="flex h-12 w-12 flex-none items-center justify-center rounded-full font-heading text-[19px] font-semibold"
        style={{ backgroundColor: kid.avatarColor, color: kid.avatarTextColor }}
      >
        {kid.name.charAt(0)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-heading text-[16px] font-semibold text-[#3F362E]">{kid.name}</span>
        <span className="block text-[13px] text-[#A89A8B]">{kid.ageLabel} · {parentLabel}</span>
      </span>
      {parentCount === 0 ? (
        <span className={`${chip} bg-[#F9D2DE] text-[#C56486]`}>VINCULAR</span>
      ) : kid.allergyChips?.length ? (
        <span className="flex flex-none gap-1.5">
          {kid.allergyChips.map((allergy) => (
            <span className={`${chip} bg-[#FBD8CC] text-[#D9684A]`} key={allergy}>{allergy}</span>
          ))}
        </span>
      ) : (
        <ChevronRightIcon className="flex-none text-[#CBB89F]" size={18} />
      )}
    </Link>
  );
}
