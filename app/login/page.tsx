import Link from "next/link";
import { SunIcon } from "@/app/components/icons";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen bg-[#FBF4EC] lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[linear-gradient(155deg,#F6A98E_0%,#F2937A_45%,#EC7E62_100%)] px-[60px] py-14 text-white lg:flex">
        <div aria-hidden="true" className="absolute -right-[120px] -top-[140px] h-[420px] w-[420px] rounded-full bg-white/12" />
        <div aria-hidden="true" className="absolute -bottom-[110px] -left-[80px] h-[300px] w-[300px] rounded-full bg-white/10" />
        <div className="relative flex items-center gap-[13px]">
          <span className="flex h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-white/22 text-white">
            <SunIcon size={26} />
          </span>
          <span className="font-heading text-[21px] font-semibold tracking-[.5px]">OpenDayCare</span>
        </div>
        <div className="relative">
          <h1 className="m-0 font-heading text-[42px] font-semibold leading-[1.12]">
            El día de cada niño,
            <br />
            compartido con su familia.
          </h1>
          <p className="mt-[18px] max-w-[430px] text-[17px] leading-[1.6] text-white/92">
            Publicá momentos, gestioná las salas y mantené a las familias cerca, desde un solo lugar.
          </p>
        </div>
        <div className="relative text-sm text-white/90">🌿 Guardería Sala Soles</div>
      </div>

      <div className="flex items-center justify-center p-10">
        <div className="w-full max-w-[392px]">
          <h2 className="m-0 font-heading text-[30px] font-semibold text-[#3F362E]">Iniciar sesión</h2>
          <p className="mb-7 mt-[6px] text-[15px] text-[#94887B]">Ingresá para ver el día de hoy.</p>

          <label className="mb-2 block text-xs font-bold tracking-[.7px] text-[#94887B]" htmlFor="login-email">
            EMAIL
          </label>
          <input
            className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-3.5 text-[15px] text-[#3F362E] outline-none placeholder:text-[#B6A99B]"
            id="login-email"
            placeholder="tu@email.com"
            type="email"
          />
          <label className="mb-2 block text-xs font-bold tracking-[.7px] text-[#94887B]" htmlFor="login-password">
            CONTRASEÑA
          </label>
          <input
            className="mb-2.5 w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-3.5 text-[15px] text-[#3F362E] outline-none placeholder:text-[#B6A99B]"
            id="login-password"
            placeholder="••••••••"
            type="password"
          />
          <div className="mb-5 text-right">
            <span className="cursor-pointer text-[13.5px] font-bold text-[#C5503A]">¿Olvidaste tu contraseña?</span>
          </div>

          <a
            className="block w-full cursor-pointer rounded-[15px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] p-[15px] text-center text-base font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)]"
            href="#"
          >
            Iniciar sesión
          </a>

          <p className="mt-6 text-center text-[14.5px] text-[#94887B]">
            ¿Te invitó la guardería?{" "}
            <Link className="font-extrabold text-[#C5503A]" href="/activate">
              Activá tu cuenta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
