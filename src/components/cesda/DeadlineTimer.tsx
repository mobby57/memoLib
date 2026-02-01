"use client"

import { useEffect, useState } from "react"
import { UrgencyLevel } from "@/types/cesda"
import UrgencyBadge from "./UrgencyBadge"

interface DeadlineTimerProps {
  deadlineDate: Date
  notificationDate?: Date
  urgencyLevel: UrgencyLevel
  showProgress?: boolean
}

export default function DeadlineTimer({
  deadlineDate,
  notificationDate,
  urgencyLevel,
  showProgress = true,
}: Readonly<DeadlineTimerProps>) {
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
    isExpired: boolean
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false })

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date()
      const deadline = new Date(deadlineDate)
      const diff = deadline.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true })
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeRemaining({ days, hours, minutes, seconds, isExpired: false })
    }

    calculateTime()
    const interval = setInterval(calculateTime, 1000)

    return () => clearInterval(interval)
  }, [deadlineDate])

  const calculateProgress = () => {
    if (!notificationDate) return 0
    const total = new Date(deadlineDate).getTime() - new Date(notificationDate).getTime()
    const elapsed = new Date().getTime() - new Date(notificationDate).getTime()
    return Math.min((elapsed / total) * 100, 100)
  }

  const progress = showProgress && notificationDate ? calculateProgress() : 0

  if (timeRemaining.isExpired) {
    return (
      <div className="bg-red-50 border-2 border-red-600 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-label="warning"></span>
          <div>
            <p className="font-bold text-red-900 text-lg">Delai expire</p>
            <p className="text-red-700 text-sm">Action immediate requise</p>
          </div>
        </div>
      </div>
    )
  }

  const isCritical = urgencyLevel === UrgencyLevel.CRITIQUE

  return (
    <div
      className={`border-2 rounded-lg p-4 ${
        isCritical
          ? "bg-red-50 border-red-600 animate-pulse"
          : "bg-white border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-label="timer"></span>
          <div>
            <p className="font-semibold text-gray-700 text-sm">Temps restant</p>
            <p className="text-xs text-gray-500">
              echeance: {new Date(deadlineDate).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
        <UrgencyBadge level={urgencyLevel} size="sm" />
      </div>

      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="text-center">
          <div
            className={`text-2xl font-bold font-mono ${
              isCritical ? "text-red-700" : "text-gray-900"
            }`}
          >
            {timeRemaining.days}
          </div>
          <div className="text-xs text-gray-600">jours</div>
        </div>
        <div className="text-center">
          <div
            className={`text-2xl font-bold font-mono ${
              isCritical ? "text-red-700" : "text-gray-900"
            }`}
          >
            {timeRemaining.hours}
          </div>
          <div className="text-xs text-gray-600">heures</div>
        </div>
        <div className="text-center">
          <div
            className={`text-2xl font-bold font-mono ${
              isCritical ? "text-red-700" : "text-gray-900"
            }`}
          >
            {timeRemaining.minutes}
          </div>
          <div className="text-xs text-gray-600">min</div>
        </div>
        <div className="text-center">
          <div
            className={`text-2xl font-bold font-mono ${
              isCritical ? "text-red-700" : "text-gray-900"
            }`}
          >
            {timeRemaining.seconds}
          </div>
          <div className="text-xs text-gray-600">sec</div>
        </div>
      </div>

      {showProgress && notificationDate && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Progression du delai</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                progress > 75
                  ? "bg-red-600"
                  : progress > 50
                  ? "bg-orange-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${progress.toString()}%` }}
            />
          </div>
        </div>
      )}

      {isCritical && (
        <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-800">
          <span aria-label="warning"></span> <strong>Attention :</strong> Ce delai est critique. Une action immediate est requise.
        </div>
      )}
    </div>
  )
}
