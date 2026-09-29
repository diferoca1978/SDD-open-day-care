"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { ChevronDownIcon, PlusIcon } from "@/app/components/icons";
import { addChild, type AddChildState } from "@/app/actions/children";
import type { RoomOption } from "@/app/utils/child-view";

const labelClassName = "mb-2 block text-xs font-extrabold tracking-[.7px] text-[#94887B]";
const fieldClassName =
  "w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[13px] text-[15px] text-[#3F362E] outline-none placeholder:text-[#B6A99B]";
const fieldInvalidClassName = "border-[#C5413A]";
const errorMessageClassName = "mt-1.5 text-[13px] font-bold text-[#C5413A]";

type FormErrors = {
  name?: string;
  birthDate?: string;
};

const initialActionState: AddChildState = { error: null, savedAt: null };

function getTodayIso() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function AddKidDialog({ rooms }: { rooms: RoomOption[] }) {
  const defaultRoomId = rooms[0]?.id ?? "";
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [roomId, setRoomId] = useState(defaultRoomId);
  const [allergies, setAllergies] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverErrorDismissed, setServerErrorDismissed] = useState(false);
  const [actionState, formAction, pending] = useActionState(
    addChild,
    initialActionState,
  );
  const handledSavedAt = useRef<number | null>(null);

  const closeDialog = useCallback(() => {
    setOpen(false);
    setName("");
    setBirthDate("");
    setRoomId(defaultRoomId);
    setAllergies("");
    setNotes("");
    setErrors({});
    setServerErrorDismissed(true);
  }, [defaultRoomId]);

  useEffect(() => {
    if (
      actionState.savedAt === null ||
      actionState.savedAt === handledSavedAt.current
    ) {
      return;
    }

    handledSavedAt.current = actionState.savedAt;
    closeDialog();
  }, [actionState.savedAt, closeDialog]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const nextErrors: FormErrors = {};
    if (!name.trim()) {
      nextErrors.name = "Ingresa el nombre completo.";
    }
    if (!birthDate) {
      nextErrors.birthDate = "Selecciona la fecha de nacimiento.";
    } else if (birthDate > getTodayIso()) {
      nextErrors.birthDate = "La fecha no puede ser futura.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault();
      setServerErrorDismissed(true);
      return;
    }

    setServerErrorDismissed(false);
  }

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDialog();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeDialog, open]);

  return (
    <>
      <button
        className="flex items-center gap-2 rounded-[14px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] px-[18px] py-[11px] text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.7)]"
        onClick={() => setOpen(true)}
        type="button"
      >
        <PlusIcon size={17} />
        Agregar niño
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#3F362E]/50 px-6 py-10"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeDialog();
            }
          }}
        >
          <div
            aria-modal="true"
            aria-labelledby="add-kid-title"
            className="w-full max-w-[520px] overflow-hidden rounded-[24px] border border-[#ECE0D0] bg-[#FBF4EC] shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)]"
            role="dialog"
          >
            <form action={formAction} onSubmit={handleSubmit}>
              <div className="flex items-center justify-between border-b border-[#ECE0D0] px-[26px] py-5">
                <button className="text-[15px] font-bold text-[#94887B]" onClick={closeDialog} type="button">
                  Cancelar
                </button>
                <h2 className="m-0 font-heading text-lg font-semibold text-[#3F362E]" id="add-kid-title">
                  Agregar niño
                </h2>
                <button
                  className="text-[15px] font-extrabold text-[#D9583C] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={pending}
                  type="submit"
                >
                  {pending ? "Guardando…" : "Guardar"}
                </button>
              </div>
              <div className="px-[26px] py-6">
                <div className="mb-[18px]">
                  <label className={labelClassName} htmlFor="kid-name">
                    NOMBRE COMPLETO
                  </label>
                  <input
                    aria-describedby={errors.name ? "kid-name-error" : undefined}
                    aria-invalid={Boolean(errors.name)}
                    className={`${fieldClassName} ${errors.name ? fieldInvalidClassName : ""}`}
                    id="kid-name"
                    name="fullName"
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Ej. Martina López"
                    type="text"
                    value={name}
                  />
                  {errors.name && (
                    <p className={errorMessageClassName} id="kid-name-error">
                      {errors.name}
                    </p>
                  )}
                </div>
                <div className="mb-[18px] flex gap-3.5">
                  <div className="flex-1">
                    <label className={labelClassName} htmlFor="kid-birth-date">
                      FECHA DE NACIMIENTO
                    </label>
                    <input
                      aria-describedby={errors.birthDate ? "kid-birth-date-error" : undefined}
                      aria-invalid={Boolean(errors.birthDate)}
                      className={`${fieldClassName} ${errors.birthDate ? fieldInvalidClassName : ""}`}
                      id="kid-birth-date"
                      name="birthDate"
                      onChange={(event) => setBirthDate(event.target.value)}
                      type="date"
                      value={birthDate}
                    />
                    {errors.birthDate && (
                      <p className={errorMessageClassName} id="kid-birth-date-error">
                        {errors.birthDate}
                      </p>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className={labelClassName} htmlFor="kid-room">
                      SALA
                    </label>
                    <div className="relative">
                      <select
                        className="w-full appearance-none rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[13px] text-[15px] font-bold text-[#3F362E] outline-none"
                        id="kid-room"
                        name="roomId"
                        onChange={(event) => setRoomId(event.target.value)}
                        value={roomId}
                      >
                        {rooms.map((room) => (
                          <option key={room.id} value={room.id}>
                            {room.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDownIcon
                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#B0A290]"
                        size={16}
                      />
                    </div>
                  </div>
                </div>
                <div className="mb-[18px]">
                  <label className={labelClassName} htmlFor="kid-allergies">
                    ALERGIAS (ETIQUETAS)
                  </label>
                  <input
                    className={fieldClassName}
                    id="kid-allergies"
                    name="allergies"
                    onChange={(event) => setAllergies(event.target.value)}
                    placeholder="Ej. Maní, Lactosa"
                    type="text"
                    value={allergies}
                  />
                </div>
                <label className={labelClassName} htmlFor="kid-notes">
                  NOTAS MÉDICAS
                </label>
                <textarea
                  className={`${fieldClassName} min-h-[90px] resize-y leading-[1.5]`}
                  id="kid-notes"
                  name="medicalNotes"
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Indicaciones, medicación, contactos…"
                  value={notes}
                />
                {actionState.error && !serverErrorDismissed && !pending && (
                  <p className={`${errorMessageClassName} mt-4`} role="alert">
                    {actionState.error}
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
