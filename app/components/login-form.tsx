"use client";

import { useActionState } from "react";
import { signIn } from "@/app/actions/auth";

type LoginState = { error: string | null };

const initialState: LoginState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction}>
      <label className="mb-2 block text-xs font-bold tracking-[.7px] text-[#94887B]" htmlFor="login-email">
        EMAIL
      </label>
      <input
        autoComplete="email"
        className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-3.5 text-[15px] text-[#3F362E] outline-none placeholder:text-[#B6A99B]"
        id="login-email"
        name="email"
        placeholder="tu@email.com"
        type="email"
      />
      <label className="mb-2 block text-xs font-bold tracking-[.7px] text-[#94887B]" htmlFor="login-password">
        CONTRASEÑA
      </label>
      <input
        autoComplete="current-password"
        className="mb-2.5 w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-3.5 text-[15px] text-[#3F362E] outline-none placeholder:text-[#B6A99B]"
        id="login-password"
        name="password"
        placeholder="••••••••"
        type="password"
      />
      {state.error && (
        <p className="mb-2.5 text-[13.5px] font-bold text-[#C5503A]" role="alert">
          {state.error}
        </p>
      )}
      <div className="mb-5 text-right">
        <span className="cursor-pointer text-[13.5px] font-bold text-[#C5503A]">¿Olvidaste tu contraseña?</span>
      </div>

      <button
        className="block w-full cursor-pointer rounded-[15px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] p-[15px] text-center text-base font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)]"
        disabled={pending}
        type="submit"
      >
        Iniciar sesión
      </button>
    </form>
  );
}
