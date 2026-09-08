"use client";

import { useState } from "react";
import { KidCard } from "@/app/components/kid-card";
import { SearchIcon } from "@/app/components/icons";
import { kids } from "@/app/data/mock-kids";

function normalize(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function KidsList() {
  const [query, setQuery] = useState("");
  const normalizedQuery = normalize(query);
  const filteredKids = kids.filter((kid) => normalize(kid.name).includes(normalizedQuery));

  return (
    <>
      <div className="mb-5.5 flex items-center gap-[11px] rounded-[14px] border border-[#ECE0D0] bg-[#FFFDF9] px-4 py-3">
        <SearchIcon className="flex-none text-[#B0A290]" size={18} />
        <input
          aria-label="Buscar niño"
          className="w-full flex-1 border-none bg-transparent text-[15px] text-[#3F362E] outline-none placeholder:text-[#B6A99B]"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar niño…"
          type="text"
          value={query}
        />
      </div>
      <div className="mb-3.5 flex items-center gap-3">
        <span className="text-[12.5px] font-extrabold tracking-[.8px] text-[#3F362E]">SALA SOLES</span>
        <span className="text-[13px] text-[#A89A8B]">{kids.length} niños</span>
        <span className="h-px flex-1 bg-[#E7DAC8]" />
      </div>
      {filteredKids.length > 0 ? (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          {filteredKids.map((kid) => <KidCard key={kid.id} kid={kid} />)}
        </div>
      ) : (
        <p className="m-0 rounded-[18px] border-[1.5px] border-dashed border-[#DBCDBA] bg-[#F4ECE1] px-4 py-10 text-center text-[14.5px] text-[#B0A290]">Sin resultados…</p>
      )}
    </>
  );
}
