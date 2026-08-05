import { LuxuryAurora } from "@/components/brand/LuxuryAurora";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid flex-1 grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
      <div className="relative flex min-h-[280px] flex-col items-center justify-center overflow-hidden bg-navy px-8 py-16">
        <LuxuryAurora />
        <div className="relative z-10 max-w-sm text-center">
          <span className="font-display text-4xl font-semibold tracking-wide text-gold-strong lg:text-5xl">
            Finic
          </span>
          <p className="font-display mt-3 text-base italic text-gold-soft lg:text-lg">
            &ldquo;Fino cuidado com suas finanças.&rdquo;
          </p>
          <div className="mx-auto my-5 h-px w-14 bg-gradient-to-r from-transparent via-gold to-transparent" />
          <p className="text-xs uppercase tracking-[0.3em] text-[#c7cfe0]">
            Controle financeiro pessoal
          </p>
          <p className="mt-6 hidden text-sm leading-relaxed text-[#93a0b8] lg:block">
            Clareza e discrição para administrar o seu patrimônio, com a precisão que ele merece.
          </p>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center bg-surface px-4 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
