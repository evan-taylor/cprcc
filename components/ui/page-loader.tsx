interface PageLoaderProps {
  detail?: string;
  fullScreen?: boolean;
  message?: string;
}

export function PageLoader({
  message = "Preparing your experience...",
  detail,
  fullScreen = true,
}: PageLoaderProps) {
  return (
    <div
      className={`flex items-center justify-center px-5 py-16 ${
        fullScreen ? "min-h-screen" : "min-h-[20rem]"
      }`}
    >
      <div className="editorial-card w-full max-w-md animate-fade-in rounded-3xl px-8 py-10 text-center">
        <div className="mx-auto flex h-14 w-14 animate-soft-pulse items-center justify-center rounded-2xl bg-[color:var(--color-primary)] text-white shadow-lg shadow-red-900/25 ring-2 ring-[color:var(--color-primary-light)]">
          <svg
            aria-hidden="true"
            className="h-8 w-8"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M14 2h-4v8H2v4h8v8h4v-8h8v-4h-8V2z" />
          </svg>
        </div>

        <p className="mt-5 font-semibold text-[color:var(--color-text-emphasis)] text-lg">
          {message}
        </p>
        {detail ? (
          <p
            aria-live="polite"
            className="mt-1.5 text-[color:var(--color-text-muted)] text-sm"
          >
            {detail}
          </p>
        ) : null}

        <div className="mt-6 space-y-2.5">
          <div className="shimmer-surface h-2.5 rounded-full" />
          <div className="shimmer-surface h-2.5 w-[86%] rounded-full" />
          <div className="shimmer-surface h-2.5 w-[72%] rounded-full" />
        </div>
      </div>
    </div>
  );
}
