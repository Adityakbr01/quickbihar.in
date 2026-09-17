"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 text-sm", className)}
      classNames={{
        root: "w-fit",
        months: "flex flex-col gap-4",
        month: "space-y-3",
        month_caption: "relative flex h-8 items-center justify-center px-8",
        caption_label: "text-sm font-medium text-foreground",
        nav: "absolute inset-x-0 top-0 flex items-center justify-between",
        button_previous: cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "size-8"),
        button_next: cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "size-8"),
        chevron: "size-4",
        month_grid: "w-full border-collapse",
        weekdays: "grid grid-cols-7",
        weekday: "flex size-8 items-center justify-center text-xs font-medium text-muted-foreground",
        week: "grid grid-cols-7",
        day: "relative flex size-8 items-center justify-center p-0 text-center text-sm data-disabled:opacity-40 data-outside:text-muted-foreground data-outside:opacity-50",
        day_button: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "size-8 rounded-md p-0 font-normal aria-selected:opacity-100"
        ),
        selected: "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground",
        today: "[&>button]:border [&>button]:border-cyan-400/50 [&>button]:text-cyan-300",
        disabled: "pointer-events-none opacity-40",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        PreviousMonthButton: ({ className, ...buttonProps }) => (
          <Button variant="ghost" size="icon-sm" className={className} {...buttonProps} />
        ),
        NextMonthButton: ({ className, ...buttonProps }) => (
          <Button variant="ghost" size="icon-sm" className={className} {...buttonProps} />
        ),
      }}
      {...props}
    />
  )
}

export { Calendar }
