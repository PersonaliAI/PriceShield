"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

interface DatePickerProps {
  /** ISO yyyy-mm-dd string, or empty for no selection */
  value?: string
  onChange: (isoDate: string) => void
  placeholder?: string
  className?: string
}

function formatDisplay(iso?: string): string | null {
  if (!iso) return null
  const [y, m, d] = iso.split("-").map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function DatePicker({ value, onChange, placeholder = "Select date", className }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const display = formatDisplay(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "flex items-center gap-2 h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 hover:bg-muted/50 dark:bg-input/30 dark:hover:bg-input/50 cursor-pointer",
          className
        )}
      >
        <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className={cn("truncate", !display && "text-muted-foreground")}>
          {display ?? placeholder}
        </span>
      </PopoverTrigger>
      <PopoverContent>
        <Calendar
          value={value}
          onChange={(iso) => {
            onChange(iso)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
