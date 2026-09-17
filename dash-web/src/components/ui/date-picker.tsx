"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type DatePickerProps = {
  value?: string
  onChange?: (value: string) => void
  name?: string
  id?: string
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
}

function DatePicker({
  value = "",
  onChange,
  name,
  id,
  placeholder = "Pick date",
  className,
  disabled,
  required,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [internalValue, setInternalValue] = React.useState(value)
  const currentValue = onChange ? value : internalValue
  const selected = parseDateValue(currentValue)

  React.useEffect(() => {
    if (!onChange) setInternalValue(value)
  }, [onChange, value])

  const updateValue = (date?: Date) => {
    const nextValue = date ? format(date, "yyyy-MM-dd") : ""
    if (onChange) onChange(nextValue)
    else setInternalValue(nextValue)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {name && <input type="hidden" name={name} value={currentValue} />}
      <PopoverTrigger
        disabled={disabled}
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            className={cn(
              "h-9 w-full justify-start border-white/10 bg-white/5 px-2.5 text-left font-normal text-white hover:bg-white/10",
              !currentValue && "text-gray-500",
              className
            )}
            aria-required={required}
          />
        }
      >
        <CalendarIcon className="h-4 w-4 text-gray-400" />
        <span className="truncate">{selected ? format(selected, "PP") : placeholder}</span>
      </PopoverTrigger>
      <PopoverContent className="border-white/10 bg-[#1c1c1c] text-white" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={updateValue}
          defaultMonth={selected}
          disabled={disabled}
        />
        <div className="flex justify-end border-t border-white/10 p-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => updateValue(undefined)}
            disabled={!currentValue || disabled}
            className="text-gray-300 hover:bg-white/10 hover:text-white"
          >
            <XIcon className="h-3.5 w-3.5" />
            Clear
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function parseDateValue(value?: string) {
  if (!value) return undefined
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return undefined
  const date = new Date(year, month - 1, day)
  return Number.isNaN(date.getTime()) ? undefined : date
}

export { DatePicker }
