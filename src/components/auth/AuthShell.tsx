export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center bg-navy px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="font-display text-3xl font-semibold tracking-wide text-gold-strong">
            Finic
          </span>
        </div>
        <div className="surface-card overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)]">
          <div className="h-1 w-full bg-gradient-to-r from-gold-soft via-gold to-gold-strong" />
          <div className="p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
