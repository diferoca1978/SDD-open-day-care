import type { Metadata } from "next";
import { PokemonViewer } from "@/app/components/pokemon-viewer";

export const metadata: Metadata = {
  title: "Pokédex — OpenDayCare",
};

export default function PokemonPage() {
  return <PokemonViewer />;
}
