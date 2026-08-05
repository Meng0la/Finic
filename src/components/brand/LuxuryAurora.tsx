function buildParticles(count: number) {
  return Array.from({ length: count }).map((_, i) => {
    const left = (i * 43) % 100;
    const size = 2 + (i % 3);
    const delay = (i * 1.7) % 14;
    const duration = 12 + (i % 5) * 2.5;
    const drift = ((i % 5) - 2) * 16;
    const opacity = 0.35 + (i % 4) * 0.1;
    return { left, size, delay, duration, drift, opacity };
  });
}

export function LuxuryAurora({
  particleCount = 22,
  vignette = true,
}: {
  particleCount?: number;
  vignette?: boolean;
}) {
  const particles = buildParticles(particleCount);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="aurora-blob aurora-blob-1" />
      <div className="aurora-blob aurora-blob-2" />
      <div className="aurora-blob aurora-blob-3" />
      <div className="luxury-grid" />
      <div className="luxury-shimmer" />
      {particles.map((p, i) => (
        <span
          key={i}
          className="luxury-particle"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            ["--drift" as string]: `${p.drift}px`,
            ["--particle-opacity" as string]: p.opacity,
          }}
        />
      ))}
      {vignette && <div className="luxury-vignette" />}
    </div>
  );
}
