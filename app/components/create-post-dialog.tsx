"use client";

import { ImageIcon, PlusIcon } from "@/app/components/icons";
import { kids } from "@/app/data/mock-kids";
import { postTypes } from "@/app/data/post-types";
import { useCallback, useEffect, useState } from "react";

const labelClassName = "mb-2 block text-xs font-extrabold tracking-[.7px] text-[#94887B]";
const initialDescription = "Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón.";

type FormErrors = {
  description?: string;
  type?: string;
};

type CreatePostDialogProps = {
  onClose: () => void;
  onPublish: () => void;
  open: boolean;
};

type NewPostButtonProps = {
  active?: boolean;
};

const newPostButtonClassName = "mb-[18px] flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] px-3 py-3 text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.75)]";

export function NewPostButton({ active = false }: NewPostButtonProps) {
  const [open, setOpen] = useState(false);

  if (!active) {
    return (
      <a className={newPostButtonClassName} href="#">
        <PlusIcon size={17} />
        Nueva publicación
      </a>
    );
  }

  return (
    <>
      <button className={newPostButtonClassName} onClick={() => setOpen(true)} type="button">
        <PlusIcon size={17} />
        Nueva publicación
      </button>
      <CreatePostDialog onClose={() => setOpen(false)} onPublish={() => setOpen(false)} open={open} />
    </>
  );
}

export function CreatePostDialog({ onClose, onPublish, open }: CreatePostDialogProps) {
  const [selectedKids, setSelectedKids] = useState<string[]>([kids[0].id]);
  const [allRoomSelected, setAllRoomSelected] = useState(false);
  const [selectedType, setSelectedType] = useState<string>();
  const [description, setDescription] = useState(initialDescription);
  const [errors, setErrors] = useState<FormErrors>({});

  const resetForm = useCallback(() => {
    setSelectedKids([kids[0].id]);
    setAllRoomSelected(false);
    setSelectedType(undefined);
    setDescription(initialDescription);
    setErrors({});
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose, open]);

  if (!open) {
    return null;
  }

  function toggleKid(kidId: string) {
    setAllRoomSelected(false);
    setSelectedKids((current) => current.includes(kidId) ? current.filter((id) => id !== kidId) : [...current, kidId]);
  }

  function toggleAllRoom() {
    setAllRoomSelected((current) => !current);
    setSelectedKids([]);
  }

  function handlePublish() {
    const nextErrors: FormErrors = {};
    if (!selectedType) {
      nextErrors.type = "Selecciona un tipo de publicación.";
    }
    if (!description.trim()) {
      nextErrors.description = "Escribe una descripción.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      resetForm();
      onPublish();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#3F362E]/50 px-6 py-10"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        aria-labelledby="create-post-title"
        aria-modal="true"
        className="w-full max-w-[580px] overflow-hidden rounded-[24px] border border-[#ECE0D0] bg-[#FBF4EC] shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)]"
        role="dialog"
      >
        <div className="flex items-center justify-between border-b border-[#ECE0D0] px-[26px] py-5">
          <button className="text-[15px] font-bold text-[#94887B]" onClick={handleClose} type="button">
            Cancelar
          </button>
          <h2 className="m-0 font-heading text-lg font-semibold text-[#3F362E]" id="create-post-title">
            Nueva publicación
          </h2>
          <button className="text-[15px] font-extrabold text-[#D9583C]" onClick={handlePublish} type="button">
            Publicar
          </button>
        </div>

        <div className="px-[26px] py-6">
          <section className="mb-[18px]">
            <h3 className={labelClassName}>PARA</h3>
            <div className="flex flex-wrap gap-[9px]">
              {kids.map((kid) => (
                <button
                  aria-pressed={selectedKids.includes(kid.id)}
                  className={`flex items-center gap-2 rounded-full border-[1.5px] py-1.5 pl-1.5 pr-3.5 text-sm font-bold ${selectedKids.includes(kid.id) ? "border-[#3F362E] bg-[#3F362E] text-white" : "border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359]"}`}
                  onClick={() => toggleKid(kid.id)}
                  key={kid.id}
                  type="button"
                >
                  <span
                    className="flex h-[26px] w-[26px] items-center justify-center rounded-full font-heading text-[13px] font-semibold"
                    style={{ backgroundColor: kid.avatarColor, color: kid.avatarTextColor }}
                  >
                    {kid.name.charAt(0)}
                  </span>
                  {kid.name.split(" ")[0]}
                </button>
              ))}
              <button
                aria-pressed={allRoomSelected}
                className={`rounded-full border-[1.5px] px-4 py-1.5 text-sm font-bold ${allRoomSelected ? "border-[#3F362E] bg-[#3F362E] text-white" : "border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359]"}`}
                onClick={toggleAllRoom}
                type="button"
              >
                Toda la sala
              </button>
            </div>
          </section>

          <section className="mb-[18px]">
            <h3 className={labelClassName}>TIPO</h3>
            <div className="flex flex-wrap gap-[9px]">
              {postTypes.map((postType) => (
                <button
                  aria-pressed={selectedType === postType.id}
                  className={`rounded-full border-[1.5px] px-4 py-2 text-[13.5px] font-extrabold ${selectedType === postType.id ? "border-[#3F362E]" : "border-transparent"}`}
                  onClick={() => {
                    setSelectedType(postType.id);
                    setErrors((current) => ({ ...current, type: undefined }));
                  }}
                  key={postType.id}
                  style={{ backgroundColor: postType.bgColor, color: postType.textColor }}
                  type="button"
                >
                  {postType.label}
                </button>
              ))}
            </div>
            {errors.type && <p className="mt-1.5 text-[13px] font-bold text-[#C5413A]">{errors.type}</p>}
          </section>

          <section className="mb-[18px]">
            <label className={labelClassName} htmlFor="create-post-description">
              DESCRIPCIÓN
            </label>
            <textarea
              aria-describedby={errors.description ? "create-post-description-error" : undefined}
              aria-invalid={Boolean(errors.description)}
              className={`min-h-[120px] w-full resize-y rounded-[14px] border-[1.5px] bg-white px-4 py-3.5 text-[15px] leading-[1.5] text-[#3F362E] outline-none placeholder:text-[#B6A99B] ${errors.description ? "border-[#C5413A]" : "border-[#EADFD0]"}`}
              onChange={(event) => {
                setDescription(event.target.value);
                if (errors.description) {
                  setErrors((current) => ({ ...current, description: undefined }));
                }
              }}
              value={description}
              id="create-post-description"
              placeholder="Contá cómo le fue hoy…"
            />
            {errors.description && <p className="mt-1.5 text-[13px] font-bold text-[#C5413A]" id="create-post-description-error">{errors.description}</p>}
          </section>

          <section>
            <h3 className={labelClassName}>FOTOS</h3>
            <div className="flex gap-3">
              <div className="flex h-24 w-24 items-center justify-center rounded-[14px] border border-[#ECE0D0] bg-[#F4ECE1] text-[#CBB89F]">
                <ImageIcon size={26} />
              </div>
              <button
                className="flex h-24 w-24 flex-col items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed border-[#DBCDBA] bg-[#F4ECE1] text-[#B0A290]"
                type="button"
              >
                <PlusIcon className="text-[#C5503A]" size={22} />
                <span className="text-xs">Agregar</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
