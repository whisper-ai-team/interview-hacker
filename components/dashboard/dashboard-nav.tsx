"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LogOut, Rocket } from "lucide-react"
import { signOut } from "next-auth/react"

interface DashboardNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string
    title: string
    icon: React.ComponentType<{ className?: string }>
  }[]
}

export function DashboardNav({ className, items, ...props }: DashboardNavProps) {
  const pathname = usePathname()

  return (
    <nav className={cn("flex flex-col space-y-2", className)} {...props}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-indigo-100 hover:text-indigo-900",
            pathname === item.href ? "bg-indigo-100 text-indigo-900" : "text-gray-500",
          )}
        >
          <item.icon className={cn("mr-2 h-4 w-4")} />
          <span>{item.title}</span>
        </Link>
      ))}

      {/* Add direct link to Copilot */}
      <Link
        href="/copilot"
        className="flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all bg-indigo-600 text-white hover:bg-indigo-700"
      >
        <Rocket className="mr-2 h-4 w-4" />
        <span>Launch Copilot</span>
      </Link>

      <div className="mt-auto pt-4">
        <Button
          variant="outline"
          className="w-full justify-start text-gray-500 hover:text-gray-900"
          onClick={() => signOut()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      </div>
    </nav>
  )
}
