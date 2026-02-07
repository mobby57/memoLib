"use client"

import { UrgencyLevel, URGENCY_COLORS } from "@/types/cesda"

interface UrgencyBadgeProps {
  level: UrgencyLevel
  label?: string
  size?: "sm" | "md" | "lg"
}

export default function UrgencyBadge({ level, label, size = "md" }: Readonly<UrgencyBadgeProps>) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-2 text-base",
  }

  const getLevelText = () => {
    switch (level) {
      case UrgencyLevel.CRITIQUE:
        return "Critique"
      case UrgencyLevel.ELEVE:
        return "eleve"
      case UrgencyLevel.MOYEN:
        return "Moyen"
      case UrgencyLevel.FAIBLE:
        return "Faible"
    }
  }

  const getLevelIcon = () => {
    switch (level) {
      case UrgencyLevel.CRITIQUE:
        return ""
      case UrgencyLevel.ELEVE:
        return ""
      case UrgencyLevel.MOYEN:
        return ""
      case UrgencyLevel.FAIBLE:
        return ""
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full ${sizeClasses[size]}`}
      style={{
        backgroundColor: `${URGENCY_COLORS[level]}20`,
        color: URGENCY_COLORS[level],
        border: `1px solid ${URGENCY_COLORS[level]}`,
      }}
    >
      <span>{getLevelIcon()}</span>
      <span>{label || getLevelText()}</span>
    </span>
  )
}
