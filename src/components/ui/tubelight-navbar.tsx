"use client"

import React from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  name: string
  url: string
  icon: LucideIcon
}

interface NavBarProps {
  items: NavItem[]
  className?: string
}

export function NavBar({ items, className }: NavBarProps) {
  const pathname = usePathname()

  // Determine active tab based on current pathname
  const getActiveTab = () => {
    const currentItem = items.find(item => {
      if (item.url === '/') {
        return pathname === '/'
      }
      return pathname.startsWith(item.url)
    })
    return currentItem?.name || items[0].name
  }

  const activeTab = getActiveTab()

  return (
    <nav
      className={cn(
        "fixed bottom-0 sm:static w-full sm:w-auto left-1/2 -translate-x-1/2 sm:translate-x-0 z-50 mb-6 sm:mb-0",
        className,
      )}
    >
      <div className="flex items-center justify-center gap-3 bg-background/5 border border-border backdrop-blur-lg py-1 px-1 rounded-full shadow-lg">
        {items.map((item, index) => {
          const Icon = item.icon
          const isActive = activeTab === item.name
          const isExternal = item.url.startsWith('http')

          const LinkComponent = isExternal ? 'a' : Link
          const linkProps = isExternal 
            ? { href: item.url, target: '_blank', rel: 'noopener noreferrer' }
            : { href: item.url }

          return (
            <LinkComponent
              key={`nav-${index}-${item.name}`}
              {...linkProps}
              className={cn(
                "relative cursor-pointer text-sm font-semibold px-6 py-2 rounded-full transition-colors",
                "text-foreground/80 hover:text-primary",
                isActive && "bg-muted text-primary",
              )}
            >
              <span className="hidden md:inline">{item.name}</span>
              <span className="md:hidden">
                <Icon size={18} strokeWidth={2.5} />
              </span>
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 w-full bg-primary/5 rounded-full -z-10"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full">
                    <div className="absolute w-12 h-6 bg-primary/20 rounded-full blur-md -top-2 -left-2" />
                    <div className="absolute w-8 h-6 bg-primary/20 rounded-full blur-sm -top-1" />
                    <div className="absolute w-4 h-4 bg-primary/20 rounded-full blur-sm top-0 left-2" />
                  </div>
                </motion.div>
              )}
            </LinkComponent>
          )
        })}
      </div>
    </nav>
  )
} 