import { useId } from "react"
import { cn } from "@/lib/utils"

// Branded circular loader — a rotating gradient arc (violet -> fuchsia,
// matching the app's primary/fuchsia-500 pairing used elsewhere, e.g.
// IndeterminateProgress). Use variant="current" inside colored buttons
// (primary/destructive backgrounds) where the fixed gradient wouldn't
// have enough contrast — it traces the arc in currentColor instead.
function Spinner({
  className,
  variant = "gradient",
}: {
  className?: string
  variant?: "gradient" | "current"
}) {
  const gradientId = useId()

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn("size-4 animate-spin", className)}
      role="status"
      aria-label="Cargando"
    >
      {variant === "gradient" && (
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--color-fuchsia-500)" />
          </linearGradient>
        </defs>
      )}
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="3"
        fill="none"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke={variant === "gradient" ? `url(#${gradientId})` : "currentColor"}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

export { Spinner }
