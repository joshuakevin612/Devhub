export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(
    value
  );
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Renders a timestamp as a relative string ("3 days ago"). Deliberately
 * coarse (no "just now" hairsplitting) since this is used for repo pushes
 * and account ages, not a live chat feed.
 */
export function timeAgo(value: string): string {
  const diffSeconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));

  const steps: { limit: number; divisor: number; unit: string }[] = [
    { limit: 60, divisor: 1, unit: "second" },
    { limit: 3600, divisor: 60, unit: "minute" },
    { limit: 86400, divisor: 3600, unit: "hour" },
    { limit: 2592000, divisor: 86400, unit: "day" },
    { limit: 31536000, divisor: 2592000, unit: "month" },
    { limit: Infinity, divisor: 31536000, unit: "year" },
  ];

  for (const step of steps) {
    if (diffSeconds < step.limit) {
      const amount = Math.max(1, Math.floor(diffSeconds / step.divisor));
      return `${amount} ${step.unit}${amount === 1 ? "" : "s"} ago`;
    }
  }
  return "just now";
}
