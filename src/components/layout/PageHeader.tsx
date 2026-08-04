export function PageHeader({
  eyebrow,
  title,
  meta,
}: {
  eyebrow: string;
  title: string;
  meta?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="field-label">{eyebrow}</p>
        <h1 className="font-display text-3xl font-semibold text-ink">{title}</h1>
      </div>
      {meta && <div className="text-sm text-ink-muted">{meta}</div>}
    </div>
  );
}
