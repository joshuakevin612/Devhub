interface ErrorStateProps {
  message: string;
  status?: number;
  onRetry?: () => void;
}

/**
 * Shared error panel for failed API calls. Speaks in the interface's own
 * voice (no "oops", no apology) and distinguishes rate-limit and not-found
 * from generic failures since those need different next steps.
 */
export function ErrorState({ message, status, onRetry }: ErrorStateProps) {
  const isRateLimit = status === 429;
  const isNotFound = status === 404;

  return (
    <div className="flex flex-col items-center gap-3 rounded border border-hairline bg-surface px-6 py-10 text-center">
      <p className="font-mono text-sm text-negative">
        {isRateLimit ? "Rate limited" : isNotFound ? "Not found" : "Request failed"}
      </p>
      <p className="max-w-sm text-sm text-muted">
        {isRateLimit
          ? "GitHub's API quota is temporarily exhausted. Try again in a minute."
          : message}
      </p>
      {onRetry && !isNotFound && (
        <button
          onClick={onRetry}
          className="mt-2 rounded border border-hairline px-4 py-1.5 text-sm text-ivory transition-colors hover:border-signal"
        >
          Try again
        </button>
      )}
    </div>
  );
}
