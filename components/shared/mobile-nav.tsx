'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingBag,
  Calendar,
  List,
  BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const mobileNavItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/marketplace', label: 'Market', icon: ShoppingBag },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/listings', label: 'Listings', icon: List },
  { href: '/ledger', label: 'Ledger', icon: BookOpen },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t">
      <div className="grid grid-cols-5 h-16">
        {mobileNavItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors min-h-[44px]',
                active ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <item.icon className={cn('h-5 w-5', active ? 'text-blue-600' : 'text-gray-400')} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
