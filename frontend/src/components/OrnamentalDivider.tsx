export function OrnamentalDivider({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center py-6 gap-3 text-[color:var(--gold)] opacity-80 ${className}`}
      aria-hidden
    >
      <span className="h-px flex-1 max-w-[80px] bg-[color:var(--gold)]/40" />
      {Array.from({ length: 9 }).map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
          <path
            d="M12 2 L15 9 L22 12 L15 15 L12 22 L9 15 L2 12 L9 9 Z"
            fill="currentColor"
            opacity={i % 2 === 0 ? 1 : 0.55}
          />
          <circle cx="12" cy="12" r="1.5" fill="#fff" opacity="0.6" />
        </svg>
      ))}
      <span className="h-px flex-1 max-w-[80px] bg-[color:var(--gold)]/40" />
    </div>
  );
}
