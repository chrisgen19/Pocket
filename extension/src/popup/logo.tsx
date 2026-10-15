/** Pocket wordmark, same as the web app's src/components/logo.tsx (ribbon + "Pocket"). */
export function Logo() {
  return (
    <span className="inline-flex items-center gap-2 text-foreground">
      <svg
        viewBox="0 0 12 16"
        aria-hidden="true"
        fill="currentColor"
        className="h-4 w-3 shrink-0 text-primary"
      >
        <path d="M1.5 0h9A1.5 1.5 0 0 1 12 1.5V16l-6-4.5L0 16V1.5A1.5 1.5 0 0 1 1.5 0Z" />
      </svg>
      <span className="font-serif text-lg leading-none font-semibold tracking-[-0.01em]">
        Pocket
      </span>
    </span>
  );
}
