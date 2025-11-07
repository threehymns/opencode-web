"use client"

import * as React from "react"
import { CheckIcon, CopyIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function CopyButton({
  value,
  className,
  variant = "ghost",
  tooltip = "Copy to Clipboard",
  ...props
}: React.ComponentProps<typeof Button> & {
  value: string
  tooltip?: string
}) {
  const [hasCopied, setHasCopied] = React.useState(false)

  React.useEffect(() => {
    setTimeout(() => {
      hasCopied && setHasCopied(false)
    }, 2000)
  }, [hasCopied])

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          data-slot="copy-button"
          data-copied={hasCopied}
          size="icon"
          variant={variant}
          className={cn(
            "size-7",
            className
          )}
          onClick={() => {
            navigator.clipboard.writeText(value)
            setHasCopied(true)
          }}
          {...props}
        >
          <span className="sr-only">Copy</span>
          <CopyIcon className={cn("opacity-100 scale-100 transition-all", hasCopied ? "opacity-0 scale-0" : "opacity-100 scale-100")} />
          <CheckIcon className={cn("absolute opacity-0 scale-0 transition-all", hasCopied ? "opacity-100 scale-100" : "opacity-0 scale-0")} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{hasCopied ? "Copied" : tooltip}</TooltipContent>
    </Tooltip>
  )
}