"use client";

import { createPost, type CreatePostState } from "@/app/actions/posts";
import { ImageIcon, PlusIcon } from "@/app/components/icons";
import { postTypes } from "@/app/data/post-types";
import Image from "next/image";
import { createPortal } from "react-dom";
import { startTransition, useActionState, useCallback, useEffect, useState } from "react";

const labelClassName = "mb-2 block text-xs font-extrabold tracking-[.7px] text-[#94887B]";
const newPostButtonClassName = "mb-[18px] flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] px-3 py-3 text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.75)]";
const avatarPalette = [
  ["#A9D9E8", "#1F7A93"],
  ["#F4B8CC", "#C44A7A"],
  ["#B9DEC4", "#3E8B62"],
  ["#F4DC8E", "#9A7B1E"],
  ["#C9B6E8", "#7B5FC0"],
] as const;

export type PostAudienceChild = { id: string; fullName: string };
export type PostAudienceRoom = { id: string; name: string };

type CreatePostDialogProps = {
  audienceChildren: PostAudienceChild[];
  rooms: PostAudienceRoom[];
  onClose: () => void;
  onPublish: () => void;
  open: boolean;
};

type NewPostButtonProps = {
  active?: boolean;
  audienceChildren?: PostAudienceChild[];
  rooms?: PostAudienceRoom[];
};

function avatarColors(id: string) {
  let hash = 0;
  for (const character of id) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return avatarPalette[hash % avatarPalette.length];
}

export function NewPostButton({ active = false, audienceChildren = [], rooms = [] }: NewPostButtonProps) {
  const [open, setOpen] = useState(false);

  if (!active) {
    return <a className={newPostButtonClassName} href="#"><PlusIcon size={17} />Nueva publicación</a>;
  }

  return (
    <>
      <button className={newPostButtonClassName} onClick={() => setOpen(true)} type="button">
        <PlusIcon size={17} />Nueva publicación
      </button>
      <CreatePostDialog
        audienceChildren={audienceChildren}
        onClose={() => setOpen(false)}
        onPublish={() => setOpen(false)}
        open={open}
        rooms={rooms}
        key={open ? "open" : "closed"}
      />
    </>
  );
}

export function CreatePostDialog({ audienceChildren, onClose, onPublish, open, rooms }: CreatePostDialogProps) {
  const [state, formAction, pending] = useActionState<CreatePostState, FormData>(createPost, {
    error: null,
    postId: null,
    savedAt: null,
  });
  const [selectedKids, setSelectedKids] = useState<string[]>(audienceChildren[0] ? [audienceChildren[0].id] : []);
  const [allRoomSelected, setAllRoomSelected] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<{ file: File; previewUrl: string }[]>([]);

  const resetForm = useCallback(() => {
    selectedFiles.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
    setSelectedKids(audienceChildren[0] ? [audienceChildren[0].id] : []);
    setAllRoomSelected(false);
    setSelectedType("");
    setDescription("");
    setSelectedFiles([]);
  }, [audienceChildren, selectedFiles]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose, open]);

  useEffect(() => {
    if (state.savedAt) {
      onPublish();
    }
  }, [onPublish, state.savedAt]);

  if (!open) return null;

  function toggleKid(kidId: string) {
    setAllRoomSelected(false);
    setSelectedKids((current) => current.includes(kidId) ? current.filter((id) => id !== kidId) : [...current, kidId]);
  }

  function toggleAllRoom() {
    if (rooms.length === 0) return;
    setAllRoomSelected((current) => !current);
    setSelectedKids([]);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.delete("media");
    selectedFiles.forEach(({ file }) => formData.append("media", file));
    startTransition(() => formAction(formData));
  }

  function handleFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const availableSlots = Math.max(0, 5 - selectedFiles.length);
    const filesToAdd = [...event.target.files ?? []].slice(0, availableSlots).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setSelectedFiles((current) => [...current, ...filesToAdd]);
    event.target.value = "";
  }

  function removeFile(previewUrl: string) {
    URL.revokeObjectURL(previewUrl);
    setSelectedFiles((current) => current.filter((item) => item.previewUrl !== previewUrl));
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#3F362E]/50 px-6 py-10"
      onClick={(event) => { if (event.target === event.currentTarget) handleClose(); }}
    >
      <div aria-labelledby="create-post-title" aria-modal="true" className="w-full max-w-[580px] overflow-hidden rounded-[24px] border border-[#ECE0D0] bg-[#FBF4EC] shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)]" role="dialog">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between border-b border-[#ECE0D0] px-[26px] py-5">
            <button className="text-[15px] font-bold text-[#94887B]" onClick={handleClose} type="button">Cancelar</button>
            <h2 className="m-0 font-heading text-lg font-semibold text-[#3F362E]" id="create-post-title">Nueva publicación</h2>
            <button className="text-[15px] font-extrabold text-[#D9583C] disabled:opacity-50" disabled={pending} type="submit">{pending ? "Publicando…" : "Publicar"}</button>
          </div>

          <div className="px-[26px] py-6">
            <section className="mb-[18px]">
              <h3 className={labelClassName}>PARA</h3>
              <div className="flex flex-wrap gap-[9px]">
                {audienceChildren.map((child) => {
                  const selected = selectedKids.includes(child.id);
                  const [backgroundColor, textColor] = avatarColors(child.id);
                  return (
                    <button aria-pressed={selected} className={`flex items-center gap-2 rounded-full border-[1.5px] py-1.5 pl-1.5 pr-3.5 text-sm font-bold ${selected ? "border-[#3F362E] bg-[#3F362E] text-white" : "border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359]"}`} onClick={() => toggleKid(child.id)} key={child.id} type="button">
                      <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full font-heading text-[13px] font-semibold" style={{ backgroundColor, color: textColor }}>{child.fullName.charAt(0)}</span>
                      {child.fullName.split(" ")[0]}
                    </button>
                  );
                })}
                <button aria-pressed={allRoomSelected} className={`rounded-full border-[1.5px] px-4 py-1.5 text-sm font-bold ${allRoomSelected ? "border-[#3F362E] bg-[#3F362E] text-white" : "border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359]"}`} disabled={rooms.length === 0} onClick={toggleAllRoom} type="button">Toda la sala</button>
              </div>
              <input name="audience" type="hidden" value={allRoomSelected ? "rooms" : "children"} />
              {selectedKids.map((kidId) => <input key={kidId} name="childIds" type="hidden" value={kidId} />)}
            </section>

            <section className="mb-[18px]">
              <h3 className={labelClassName}>TIPO</h3>
              <div className="flex flex-wrap gap-[9px]">
                {postTypes.map((postType) => <button aria-pressed={selectedType === postType.id} className={`rounded-full border-[1.5px] px-4 py-2 text-[13.5px] font-extrabold ${selectedType === postType.id ? "border-[#3F362E]" : "border-transparent"}`} key={postType.id} onClick={() => setSelectedType(postType.id)} style={{ backgroundColor: postType.bgColor, color: postType.textColor }} type="button">{postType.label}</button>)}
              </div>
            </section>

            <section className="mb-[18px]">
              <label className={labelClassName} htmlFor="create-post-description">DESCRIPCIÓN</label>
              <textarea aria-describedby={state.error ? "create-post-error" : undefined} aria-invalid={Boolean(state.error)} className={`min-h-[120px] w-full resize-y rounded-[14px] border-[1.5px] bg-white px-4 py-3.5 text-[15px] leading-[1.5] text-[#3F362E] outline-none placeholder:text-[#B6A99B] ${state.error ? "border-[#C5413A]" : "border-[#EADFD0]"}`} id="create-post-description" name="body" onChange={(event) => setDescription(event.target.value)} placeholder="Contá cómo le fue hoy…" value={description} />
            </section>

            <section>
              <h3 className={labelClassName}>FOTOS</h3>
              <div className="flex flex-wrap gap-3">
                {selectedFiles.map(({ file, previewUrl }) => <div className="relative h-24 w-24 overflow-hidden rounded-[14px] border border-[#ECE0D0] bg-[#F4ECE1]" key={previewUrl}><Image alt={`Vista previa de ${file.name}`} className="h-full w-full object-cover" height={96} src={previewUrl} unoptimized width={96} /><button aria-label={`Eliminar ${file.name}`} className="absolute right-1 top-1 rounded-full bg-[#3F362E]/80 px-1.5 text-xs text-white" onClick={() => removeFile(previewUrl)} type="button">×</button></div>)}
                {selectedFiles.length === 0 && <div className="flex h-24 w-24 items-center justify-center rounded-[14px] border border-[#ECE0D0] bg-[#F4ECE1] text-[#CBB89F]"><ImageIcon size={26} /></div>}
                {selectedFiles.length < 5 && <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed border-[#DBCDBA] bg-[#F4ECE1] text-[#B0A290]"><PlusIcon className="text-[#C5503A]" size={22} /><span className="text-xs">Agregar</span><input accept="image/jpeg,image/png,image/webp" className="sr-only" multiple onChange={handleFilesSelected} type="file" /></label>}
              </div>
            </section>
            {state.error && <p className="mt-4 text-[13px] font-bold text-[#C5413A]" id="create-post-error" role="alert">{state.error}</p>}
            <input name="type" type="hidden" value={selectedType} />
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
