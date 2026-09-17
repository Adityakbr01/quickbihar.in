"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarClockIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type DateTimePickerProps = {
  value?: string
  onChange?: (value: string) => void
  name?: string
  id?: string
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
}

function DateTimePicker({
  value = "",
  onChange,
  name,
  id,
  placeholder = "Pick date and time",
  className,
  disabled,
  required,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [internalValue, setInternalValue] = React.useState(value)
  const currentValue = onChange ? value : internalValue
  const selected = parseDateTimeValue(currentValue)
  const timeValue = parseTimeValue(currentValue)

  React.useEffect(() => {
    if (!onChange) setInternalValue(value)
  }, [onChange, value])

  const setValue = (nextValue: string) => {
    if (onChange) onChange(nextValue)
    else setInternalValue(nextValue)
  }

  const updateDate = (date?: Date) => {
    if (!date) {
      setValue("")
      return
    }

    setValue(toDateTimeValue(date, timeValue))
  }

  const updateTime = (nextTime: string) => {
    const baseDate = selected || new Date()
    setValue(toDateTimeValue(baseDate, normalizeTime(nextTime)))
  }

  const clearValue = () => {
    setValue("")
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
        <CalendarClockIcon className="h-4 w-4 text-gray-400" />
        <span className="truncate">{selected ? format(selected, "PP p") : placeholder}</span>
      </PopoverTrigger>
      <PopoverContent className="w-auto border-white/10 bg-[#1c1c1c] p-0 text-white" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={updateDate}
          defaultMonth={selected}
          disabled={disabled}
        />
        <div className="flex items-center gap-2 border-t border-white/10 p-3">
          <Input
            type="time"
            value={timeValue}
            onChange={(event) => updateTime(event.target.value)}
            disabled={disabled}
            className="h-9 border-white/10 bg-white/5 text-white"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearValue}
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

function parseDateTimeValue(value?: string) {
  if (!value) return undefined
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (match) {
    const [, year, month, day, hour, minute] = match
    const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute))
    return Number.isNaN(date.getTime()) ? undefined : date
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function parseTimeValue(value?: string) {
  const match = value?.match(/T(\d{2}):(\d{2})/)
  return match ? `${match[1]}:${match[2]}` : "00:00"
}

function normalizeTime(value?: string) {
  return /^\d{2}:\d{2}$/.test(value || "") ? value! : "00:00"
}

function toDateTimeValue(date: Date, time: string) {
  return `${format(date, "yyyy-MM-dd")}T${normalizeTime(time)}`
}

export { DateTimePicker }
