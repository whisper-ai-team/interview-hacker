import type React from "react"
import { cn } from "@/lib/utils"
import { Clock, FileText, MessageSquare } from "lucide-react"

interface EmptyPlaceholderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function EmptyPlaceholder({ className, children, ...props }: EmptyPlaceholderProps) {
  return (
    <div
      className={cn(
        "flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50",
        className,
      )}
      {...props}
    >
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">{children}</div>
    </div>
  )
}

interface EmptyPlaceholderIconProps extends React.HTMLAttributes<HTMLDivElement> {
  name: "meeting" | "resume" | "message"
}

EmptyPlaceholder.Icon = function EmptyPlaceholderIcon({ name, className, ...props }: EmptyPlaceholderIconProps) {
  const icons = {
    meeting: Clock,
    resume: FileText,
    message: MessageSquare,
  }

  const Icon = icons[name]

  return (
    <div className={cn("flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100", className)} {...props}>
      <Icon className="h-10 w-10 text-indigo-600" />
    </div>
  )
}

interface EmptyPlaceholderTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

EmptyPlaceholder.Title = function EmptyPlaceholderTitle({ className, ...props }: EmptyPlaceholderTitleProps) {
  return <h2 className={cn("mt-6 text-xl font-semibold", className)} {...props} />
}

interface EmptyPlaceholderDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

EmptyPlaceholder.Description = function EmptyPlaceholderDescription({
  className,
  ...props
}: EmptyPlaceholderDescriptionProps) {
  return (
    <p
      className={cn("mb-8 mt-2 text-center text-sm font-normal leading-6 text-muted-foreground", className)}
      {...props}
    />
  )
}
