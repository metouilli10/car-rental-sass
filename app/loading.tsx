import Image from "next/image";

export default function AppLoading() {
  return (
    <div className="relative flex min-h-dvh-screen items-center justify-center overflow-hidden bg-[#f4f7fb] px-6 py-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-12%] h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-300/18 blur-3xl sm:h-96 sm:w-96" />
        <div className="absolute bottom-[-10%] right-[-8%] h-72 w-72 rounded-full bg-blue-500/12 blur-3xl sm:h-[28rem] sm:w-[28rem]" />
        <div className="absolute left-[-10%] top-[58%] h-64 w-64 rounded-full bg-emerald-300/14 blur-3xl sm:h-80 sm:w-80" />
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
        <div className="rounded-[32px] border border-white/80 bg-white/92 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-7">
          <div className="rounded-[24px] bg-gradient-to-br from-slate-50 via-white to-slate-100 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:p-6">
            <Image
              src="/assets/locaryx icon.png"
              alt="Locaryx"
              width={180}
              height={180}
              priority
              className="h-24 w-24 object-contain sm:h-28 sm:w-28"
            />
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center">
          <Image
            src="/assets/locaryx logo new.png"
            alt="Locaryx"
            width={240}
            height={58}
            priority
            className="h-auto w-40 object-contain sm:w-44"
          />
          <p className="mt-3 max-w-[18rem] text-sm font-medium tracking-[0.02em] text-slate-600">
            Votre agence, sous controle
          </p>
          <div className="mt-6 flex items-center gap-2">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-400 [animation-delay:0ms]" />
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-sky-500 [animation-delay:180ms]" />
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-blue-600 [animation-delay:360ms]" />
          </div>
        </div>
      </div>
    </div>
  );
}
