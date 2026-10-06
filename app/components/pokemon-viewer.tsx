"use client";

import { useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/app/components/icons";

interface PokemonType {
  type: { name: string };
}

interface Pokemon {
  id: number;
  name: string;
  sprites: {
    front_default: string;
    other: {
      "official-artwork": { front_default: string };
    };
  };
  types: PokemonType[];
  stats: { base_stat: number; stat: { name: string } }[];
  height: number;
  weight: number;
}

const TYPE_COLORS: Record<string, string> = {
  normal: "#A8A77A",
  fire: "#EE8130",
  water: "#6390F0",
  electric: "#F7D02C",
  grass: "#7AC74C",
  ice: "#96D9D6",
  fighting: "#C22E28",
  poison: "#A33EA1",
  ground: "#E2BF65",
  flying: "#A98FF3",
  psychic: "#F95587",
  bug: "#A6B91A",
  rock: "#B6A136",
  ghost: "#735797",
  dragon: "#6F35FC",
  dark: "#705746",
  steel: "#B7B7CE",
  fairy: "#D685AD",
};

const STAT_LABELS: Record<string, string> = {
  hp: "HP",
  attack: "Ataque",
  defense: "Defensa",
  "special-attack": "At. Esp.",
  "special-defense": "De. Esp.",
  speed: "Velocidad",
};

function formatName(raw: string) {
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function PokemonViewer() {
  const [id, setId] = useState(1);
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        if (!res.ok) throw new Error("No se encontró este Pokémon.");
        const data: Pokemon = await res.json();
        if (!cancelled) {
          setPokemon(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error desconocido.");
          setPokemon(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const goPrev = () => {
    setLoading(true);
    setId((prev) => Math.max(1, prev - 1));
  };
  const goNext = () => {
    setLoading(true);
    setId((prev) => prev + 1);
  };

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-8">
      <h1 className="mb-8 font-[var(--font-display)] text-[28px] font-bold text-[var(--color-ink)]">
        Pokédex
      </h1>

      <div className="w-full max-w-[380px] rounded-[22px] border-[1.5px] border-[var(--color-line)] bg-[var(--color-surface)] p-6 shadow-[0_2px_16px_rgba(63,54,46,.07)]">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <span className="text-[15px] text-[var(--color-muted)]">Cargando…</span>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center py-16">
            <span className="text-[15px] text-[var(--color-coral-dark)]">{error}</span>
          </div>
        )}

        {pokemon && !loading && (
          <>
            <div className="mb-4 text-center">
              <span className="font-[var(--font-display)] text-[14px] tracking-[.6px] text-[var(--color-muted)]">
                #{String(pokemon.id).padStart(3, "0")}
              </span>
            </div>

            <div className="mb-5 flex justify-center">
              <img
                src={pokemon.sprites.other["official-artwork"].front_default || pokemon.sprites.front_default}
                alt={pokemon.name}
                width={180}
                height={180}
                className="drop-shadow-[0_4px_12px_rgba(0,0,0,.08)]"
              />
            </div>

            <h2 className="mb-3 text-center font-[var(--font-display)] text-[24px] font-bold text-[var(--color-ink)]">
              {formatName(pokemon.name)}
            </h2>

            <div className="mb-5 flex flex-wrap justify-center gap-2">
              {pokemon.types.map(({ type }) => (
                <span
                  key={type.name}
                  className="rounded-full px-3.5 py-1 text-[12.5px] font-semibold text-white"
                  style={{ backgroundColor: TYPE_COLORS[type.name] ?? "#888" }}
                >
                  {formatName(type.name)}
                </span>
              ))}
            </div>

            <div className="mb-4 flex justify-center gap-6 text-[13px] text-[var(--color-muted)]">
              <span>Altura: {(pokemon.height / 10).toFixed(1)} m</span>
              <span>Peso: {(pokemon.weight / 10).toFixed(1)} kg</span>
            </div>

            <div className="space-y-2.5 border-t border-[var(--color-divider)] pt-4">
              {pokemon.stats.map(({ base_stat, stat }) => (
                <div key={stat.name} className="flex items-center gap-3">
                  <span className="w-[72px] shrink-0 text-[12px] font-medium text-[var(--color-muted)]">
                    {STAT_LABELS[stat.name] ?? stat.name}
                  </span>
                  <span className="w-[28px] text-right text-[13px] font-bold text-[var(--color-ink)]">
                    {base_stat}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-divider)]">
                    <div
                      className="h-full rounded-full bg-[var(--color-coral)] transition-all duration-300"
                      style={{ width: `${Math.min((base_stat / 255) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={goPrev}
          disabled={id <= 1}
          className="flex items-center gap-1.5 rounded-[12px] border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-2.5 text-[14px] font-semibold text-[var(--color-ink)] shadow-[0_1px_4px_rgba(0,0,0,.05)] transition hover:border-[var(--color-coral)] hover:bg-[var(--color-coral-soft)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeftIcon size={16} />
          Anterior
        </button>

        <span className="text-[13px] text-[var(--color-muted)]">
          #{id}
        </span>

        <button
          onClick={goNext}
          className="flex items-center gap-1.5 rounded-[12px] border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-2.5 text-[14px] font-semibold text-[var(--color-ink)] shadow-[0_1px_4px_rgba(0,0,0,.05)] transition hover:border-[var(--color-coral)] hover:bg-[var(--color-coral-soft)]"
        >
          Siguiente
          <ChevronRightIcon size={16} />
        </button>
      </div>
    </div>
  );
}
