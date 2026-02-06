import * as React from "react"
import { cn } from "../../lib/utils"
// import { Slot } from "@radix-ui/react-slot" // If using Radix, but let's stick to simple for now or assume Slot is not needed yet unless requested. Use simple button.

const Button = React.forwardRef(({ className, variant = "default", size = "default", ...props }, ref) => {
  const variants = {
    default: "bg-primary text-primary-foreground shadow hover:bg-primary/90 hover:glow transition-all duration-300",
    destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
    outline: "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
    glass: "glass text-foreground hover:bg-white/10 hover:border-white/20 transition-all duration-300",
    gradient: "bg-linear-to-r from-violet-600 to-indigo-600 text-white shadow-lg hover:shadow-violet-500/25 hover:scale-[1.02] transition-all duration-300 border-0",
  }

  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-8 rounded-md px-3 text-xs",
    lg: "h-12 rounded-md px-8",
    icon: "h-10 w-10",
  }

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button }
