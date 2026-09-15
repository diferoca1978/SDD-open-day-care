"use client";

import { useCallback, useEffect, useState } from "react";
import { InfoIcon, PlusIcon, SendIcon, XIcon } from "@/app/components/icons";
import { parentRoles } from "@/app/data/parent-roles";

const labelClassName = "mb-2 block text-xs font-extrabold tracking-[.7px] text-[#94887B]";
const fieldClassName =
  "w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[13px] text-[15px] text-[#3F362E] outline-none placeholder:text-[#B6A99B]";
const errorMessageClassName = "mt-1.5 text-[13px] font-bold text-[#C5413A]";

type FormErrors = {
  name?: string;
  email?: string;
};

type LinkParentDialogProps = {
  kidName: string;
};

export function LinkParentDialog({ kidName }: LinkParentDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof parentRoles)[number]>(parentRoles[0]);
  const [errors, setErrors] = useState<FormErrors>({});
  const firstName = kidName.trim().split(/\s+/)[0] || kidName;

  const closeDialog = useCallback(() => {
    setOpen(false);
    setName("");
    setEmail("");
    setRole(parentRoles[0]);
    setErrors({});
  }, []);

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

  function handleSubmit() {
    const nextErrors: FormErrors = {};
    if (!name.trim()) {
      nextErrors.name = "Ingresa el nombre del padre o madre.";
    }
    if (!email.trim()) {
      nextErrors.email = "Ingresa un email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Ingresa un email válido.";
    }
    setErrors(nextErrors);
    if (!nextErrors.name && !nextErrors.email) {
      closeDialog();
    }
  }

  return (
    <>
      <button className="flex items-center gap-3 pt-2" onClick={() => setOpen(true)} type="button">
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-[#D8CBBA] text-[#B0A290]">
          <PlusIcon size={18} />
        </span>
        <span className="text-[14.5px] font-extrabold text-[#C5503A]">Vincular otro padre</span>
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
            aria-labelledby="link-parent-title"
            aria-modal="true"
            className="w-full max-w-[480px] overflow-hidden rounded-[24px] border border-[#ECE0D0] bg-[#FBF4EC] shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)]"
            role="dialog"
          >
            <div className="flex items-center justify-between border-b border-[#ECE0D0] px-[26px] py-5">
              <div>
                <h2 className="m-0 font-heading text-lg font-semibold text-[#3F362E]" id="link-parent-title">
                  Vincular padre
                </h2>
                <div className="text-[13px] text-[#A89A8B]">a {kidName}</div>
              </div>
              <button
                aria-label="Cerrar"
                className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-[#F0E6D8] text-[#94887B]"
                onClick={closeDialog}
                type="button"
              >
                <XIcon size={18} />
              </button>
            </div>
            <div className="max-h-[calc(100vh-5rem)] overflow-y-auto px-[26px] py-[22px]">
              <div className="mb-5 flex gap-[11px] rounded-[14px] bg-[#E3ECFB] px-4 py-[13px]">
                <InfoIcon className="mt-px flex-none text-[#4E72C8]" size={20} />
                <span className="text-[13.5px] leading-[1.45] text-[#3F5694]">
                  Le enviaremos un correo con un código para que active su cuenta. Solo verá el feed de {firstName}.
                </span>
              </div>

              <div className="mb-[18px]">
                <label className={labelClassName} htmlFor="parent-name">
                  NOMBRE DEL PADRE/MADRE
                </label>
                <input
                  aria-describedby={errors.name ? "parent-name-error" : undefined}
                  aria-invalid={Boolean(errors.name)}
                  className={`${fieldClassName} ${errors.name ? "border-[#C5413A]" : ""}`}
                  id="parent-name"
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ej. Diego Fernández"
                  type="text"
                  value={name}
                />
                {errors.name && <p className={errorMessageClassName} id="parent-name-error">{errors.name}</p>}
              </div>
              <div className="mb-[18px]">
                <label className={labelClassName} htmlFor="parent-email">
                  EMAIL
                </label>
                <input
                  aria-describedby={errors.email ? "parent-email-error" : undefined}
                  aria-invalid={Boolean(errors.email)}
                  className={`${fieldClassName} ${errors.email ? "border-[#C5413A]" : ""}`}
                  id="parent-email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="correo@ejemplo.com"
                  type="email"
                  value={email}
                />
                {errors.email && <p className={errorMessageClassName} id="parent-email-error">{errors.email}</p>}
              </div>

              <div className="mb-5">
                <div className={`${labelClassName} mb-2.5`}>PARENTESCO</div>
                <div className="flex gap-[9px]">
                  {parentRoles.map((parentRole, index) => (
                    <button
                      aria-pressed={role === parentRoles[index]}
                      className={`flex-1 rounded-full border-[1.5px] px-[11px] py-[11px] text-sm font-extrabold ${
                        role === parentRoles[index]
                          ? "border-[#9FB8EC] bg-[#CCD8F4] text-[#4E72C8]"
                          : "border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359]"
                      }`}
                      key={parentRole}
                      onClick={() => setRole(parentRoles[index])}
                      type="button"
                    >
                      {parentRole}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-5 rounded-2xl border-[1.5px] border-dashed border-[#E6D08A] bg-[#FBF1D6] p-[18px] text-center">
                <div className="mb-2 text-xs font-extrabold tracking-[.7px] text-[#A88526]">CÓDIGO DE INVITACIÓN</div>
                <div className="font-heading text-[34px] font-semibold tracking-[7px] text-[#8A7234]">7K4P9</div>
                <div className="mt-1.5 text-[13px] text-[#A88526]">Vence en 7 días</div>
              </div>

              <button
                className="flex w-full items-center justify-center gap-[9px] rounded-[14px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] py-3.5 text-[15.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)]"
                onClick={handleSubmit}
                type="button"
              >
                <SendIcon size={19} />
                Enviar invitación
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
