"use client";

import { useActionState } from "react";
import { activateAccount, type ActivateState } from "@/app/actions/activate";

const labelClassName = "mb-2 block text-xs font-bold tracking-[.7px] text-[#94887B]";

type ActivateFormProps = {
  code: string;
  email: string;
};

const initialState: ActivateState = { error: null };

export function ActivateForm({ code, email }: ActivateFormProps) {
  const [state, formAction, isPending] = useActionState(activateAccount, initialState);

  if (state.success) {
    return (
      <div className="rounded-[14px] bg-[#E8F5E9] px-4 py-3 text-[13.5px] font-bold text-[#2E7D32]">
        Cuenta activada exitosamente. Cerrá sesión y volvé a iniciar sesión con las credenciales del padre.
      </div>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="code" value={code} />

      <label className={labelClassName} htmlFor="activate-code">
        CÓDIGO DE INVITACIÓN
      </label>
      <input
        className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-3.5 font-heading text-[18px] font-bold tracking-[3px] text-[#3F362E] outline-none"
        defaultValue={code}
        id="activate-code"
        name="code"
        readOnly
        type="text"
      />

      <label className={labelClassName} htmlFor="activate-email">
        EMAIL
      </label>
      <input
        className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-3.5 text-[15px] text-[#3F362E] outline-none"
        defaultValue={email}
        id="activate-email"
        name="email"
        type="email"
      />

      <label className={labelClassName} htmlFor="activate-password">
        CREAR CONTRASEÑA
      </label>
      <input
        className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#F2A78E] bg-white px-4 py-3.5 text-[15px] text-[#3F362E] outline-none"
        id="activate-password"
        name="password"
        placeholder="Mínimo 6 caracteres"
        type="password"
      />

      <div className="mb-6 flex items-start gap-3 rounded-[14px] bg-[#FBF1D6] px-4 py-3.5">
        <span className="mt-px flex h-6 w-6 flex-none items-center justify-center rounded-lg bg-[#5FB97E] text-white">
          <svg aria-hidden="true" fill="none" height="15" viewBox="0 0 24 24" width="15" xmlns="http://www.w3.org/2000/svg">
            <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
          </svg>
        </span>
        <span className="text-sm leading-[1.45] text-[#8A7234]">
          Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro de la app.
        </span>
        <input type="hidden" name="photoConsent" value="on" />
      </div>

      {state.error && (
        <div className="mb-5 rounded-[14px] bg-[#FDE8E8] px-4 py-3 text-[13.5px] font-bold text-[#C5413A]">
          {state.error}
        </div>
      )}

      <button
        className="block w-full rounded-[15px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] p-[15px] text-center text-base font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)] disabled:opacity-50"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Activando..." : "Activar mi cuenta"}
      </button>
    </form>
  );
}
