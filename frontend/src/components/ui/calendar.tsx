"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"]

function toDateOnly(value: string): Date | undefined {
  if (!value) return undefined
  const [y, m, d] = value.split("-").map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function isSameDay(a?: Date, b?: Date): boolean {
  if (!a || !b) return false
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

interface CalendarProps {
  /** ISO yyyy-mm-dd string, or empty for no selection */
  value?: string
  onChange: (isoDate: string) => void
  className?: string
}

function Calendar({ value, onChange, className }: CalendarProps) {
  const selected = toDateOnly(value ?? "")
  const [viewDate, setViewDate] = React.useState(() => selected ?? new Date())

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const today = new Date()

  const firstOfMonth = new Date(year, month, 1)
  const startOffset = firstOfMonth.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (Date | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))

  const monthLabel = viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })

  return (
    <div className={cn("p-3 w-64", className)}>
      <div className="flex items-center justify-between mb-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">{monthLabel}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />
          const isSelected = isSameDay(date, selected)
          const isToday = isSameDay(date, today)
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(toIsoDate(date))}
              className={cn(
                "h-8 w-8 rounded-md text-xs transition-colors flex items-center justify-center",
                isSelected
                  ? "bg-primary text-primary-foreground font-semibold"
                  : isToday
                  ? "border border-emerald-500/50 text-foreground hover:bg-muted"
                  : "text-foreground hover:bg-muted"
              )}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>

      {value && (
        <div className="mt-2 pt-2 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full h-7 text-xs text-muted-foreground"
            onClick={() => onChange("")}
          >
            Clear date
          </Button>
        </div>
      )}
    </div>
  )
}

export { Calendar }
