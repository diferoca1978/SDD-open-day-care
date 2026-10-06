"use client";

import { useActionState } from "react";
import { signIn } from "@/app/actions/auth";

type LoginState = { error: string | null };

const initialState: LoginState = { error: null };
const errorId = "login-error";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction}>
      <label className="mb-2 block text-xs font-bold tracking-[.7px] text-[#6B6054]" htmlFor="login-email">
        EMAIL
      </label>
      <input
        autoComplete="email"
        className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-3.5 text-[15px] text-[#3F362E] outline-none focus-visible:ring-2 focus-visible:ring-[#EE8164] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBF4EC] placeholder:text-[#B6A99B]"
        id="login-email"
        name="email"
        placeholder="tu@email.com"
        type="email"
        required
        aria-required="true"
        aria-invalid={state.error ? true : undefined}
        aria-describedby={state.error ? errorId : undefined}
      />
      <label className="mb-2 block text-xs font-bold tracking-[.7px] text-[#6B6054]" htmlFor="login-password">
        CONTRASEÑA
      </label>
      <input
        autoComplete="current-password"
        className="mb-2.5 w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-3.5 text-[15px] text-[#3F362E] outline-none focus-visible:ring-2 focus-visible:ring-[#EE8164] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBF4EC] placeholder:text-[#B6A99B]"
        id="login-password"
        name="password"
        placeholder="••••••••"
        type="password"
        required
        aria-required="true"
        aria-invalid={state.error ? true : undefined}
        aria-describedby={state.error ? errorId : undefined}
      />
      {state.error && (
        <p id={errorId} className="mb-2.5 text-[13.5px] font-bold text-[#A8402D]" role="alert">
          {state.error}
        </p>
      )}
      <div className="mb-5 text-right">
        <a
          className="text-[13.5px] font-bold text-[#A8402D] underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A8402D]"
          href="/forgot-password"
        >
          ¿Olvidaste tu contraseña?
        </a>
      </div>

      <button
        className="block w-full cursor-pointer rounded-[15px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] p-[15px] text-center text-base font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)] focus-visible:ring-2 focus-visible:ring-[#C5503A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBF4EC] focus-visible:outline-none"
        disabled={pending}
        aria-busy={pending}
        type="submit"
      >
        {pending ? "Iniciando sesión…" : "Iniciar sesión"}
      </button>
    </form>
  );
}
