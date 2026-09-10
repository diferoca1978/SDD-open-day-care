import Link from "next/link";
import { SunIcon } from "@/app/components/icons";

export default function ActivatePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FBF4EC] p-10">
      <div className="w-full max-w-[440px]">
        <div className="mb-[22px] flex h-[58px] w-[58px] items-center justify-center rounded-[18px] bg-[linear-gradient(155deg,#F8C3A8,#F2937A)] text-white shadow-[0_12px_26px_-10px_rgba(238,129,100,.65)]">
          <SunIcon size={30} />
        </div>
        <h1 className="m-0 font-heading text-[32px] font-semibold leading-[1.15] text-[#3F362E]">
          Bienvenida a OpenDayCare
        </h1>
        <p className="mb-[26px] mt-2 text-[15.5px] leading-[1.55] text-[#94887B]">
          Te invitaron a seguir el día de tu hijo. Creá tu contraseña para activar la cuenta.
        </p>

        <div className="mb-[22px] flex items-center gap-3.5 rounded-2xl border-[1.5px] border-[#EADFD0] bg-white px-4 py-3.5">
          <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[#A9D9E8] font-heading text-[19px] font-semibold text-[#1F7A93]">
            M
          </span>
          <div>
            <div className="text-[13px] text-[#94887B]">Te invitaron a seguir a</div>
            <div className="font-heading text-[17px] font-semibold text-[#3F362E]">Mateo · Sala Soles</div>
          </div>
        </div>

        <label className="mb-2 block text-xs font-bold tracking-[.7px] text-[#94887B]" htmlFor="activate-code">
          CÓDIGO DE INVITACIÓN
        </label>
        <input
          className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-3.5 font-heading text-[18px] font-bold tracking-[3px] text-[#3F362E] outline-none"
          defaultValue="7K4P9"
          id="activate-code"
          type="text"
        />
        <label className="mb-2 block text-xs font-bold tracking-[.7px] text-[#94887B]" htmlFor="activate-email">
          EMAIL
        </label>
        <input
          className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-3.5 text-[15px] text-[#3F362E] outline-none"
          defaultValue="lucia.fernandez@gmail.com"
          id="activate-email"
          type="email"
        />
        <label className="mb-2 block text-xs font-bold tracking-[.7px] text-[#94887B]" htmlFor="activate-password">
          CREAR CONTRASEÑA
        </label>
        <input
          className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#F2A78E] bg-white px-4 py-3.5 text-[15px] text-[#3F362E] outline-none"
          defaultValue="contraseña"
          id="activate-password"
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
        </div>

        <a
          className="block w-full rounded-[15px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] p-[15px] text-center text-base font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)]"
          href="#"
        >
          Activar mi cuenta
        </a>
        <p className="mt-[22px] text-center text-[14.5px] text-[#94887B]">
          ¿Ya tenés cuenta?{" "}
          <Link className="font-extrabold text-[#C5503A]" href="/login">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
